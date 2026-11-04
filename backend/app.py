"""
Nmap Web Scanner - Flask Backend
=================================
This is the Python backend for the Nmap Web Scanner Dashboard.
It provides REST API endpoints for running Nmap scans, tracking progress,
and retrieving results.

Requirements:
- Python 3.8+
- Nmap installed on the system
- See requirements.txt for Python dependencies

Usage:
    python app.py

The server will start on http://localhost:5000
"""

import os
import json
import uuid
import time
import threading
from datetime import datetime
from flask import Flask, request, jsonify, send_file
from flask_cors import CORS
from flask_socketio import SocketIO, emit

from scanner import NmapScanner
from pdf_generator import generate_pdf_report

# ─── App Configuration ───────────────────────────────────────────────────────

app = Flask(__name__)
app.config['SECRET_KEY'] = os.environ.get('SECRET_KEY', 'nmap-scanner-secret-key')
app.config['MAX_CONTENT_LENGTH'] = 16 * 1024 * 1024  # 16MB max

CORS(app)
socketio = SocketIO(app, cors_allowed_origins="*")

# ─── State Management ────────────────────────────────────────────────────────

scanner = NmapScanner()
active_scans = {}  # scan_id -> scan info
scan_results = {}  # scan_id -> result data
scan_history = []  # list of completed scan summaries


# ─── API Routes ──────────────────────────────────────────────────────────────

@app.route('/api/health', methods=['GET'])
def health_check():
    """Health check endpoint."""
    nmap_available = scanner.is_nmap_installed()
    return jsonify({
        'status': 'ok',
        'nmap_installed': nmap_available,
        'nmap_version': scanner.get_nmap_version() if nmap_available else None,
        'timestamp': datetime.utcnow().isoformat()
    })


@app.route('/api/scan', methods=['POST'])
def start_scan():
    """
    Start a new Nmap scan.
    
    Request body:
    {
        "target": "192.168.1.0/24",
        "scan_type": "tcp_syn",
        "ports": "80,443",
        "timing": "T3",
        "custom_flags": "-sV -O",
        "output_format": ["normal", "xml"]
    }
    """
    data = request.get_json()
    
    if not data or 'target' not in data:
        return jsonify({'error': 'Target is required'}), 400
    
    # Validate target
    target = data['target'].strip()
    if not target:
        return jsonify({'error': 'Target cannot be empty'}), 400
    
    # Generate scan ID
    scan_id = str(uuid.uuid4())
    
    # Build scan configuration
    config = {
        'target': target,
        'scan_type': data.get('scan_type', 'tcp_syn'),
        'ports': data.get('ports', ''),
        'timing': data.get('timing', 'T3'),
        'custom_flags': data.get('custom_flags', ''),
        'output_format': data.get('output_format', ['normal']),
    }
    
    # Store scan info
    active_scans[scan_id] = {
        'id': scan_id,
        'config': config,
        'status': 'running',
        'start_time': datetime.utcnow().isoformat(),
        'progress': 0,
    }
    
    # Start scan in background thread
    thread = threading.Thread(
        target=run_scan,
        args=(scan_id, config),
        daemon=True
    )
    thread.start()
    
    return jsonify({
        'scan_id': scan_id,
        'status': 'started',
        'message': f'Scan initiated for target: {target}'
    }), 202


@app.route('/api/scan/<scan_id>', methods=['GET'])
def get_scan_status(scan_id):
    """Get the current status of a scan."""
    if scan_id in active_scans:
        return jsonify(active_scans[scan_id])
    elif scan_id in scan_results:
        return jsonify({
            'id': scan_id,
            'status': 'completed',
            'result': scan_results[scan_id]
        })
    else:
        return jsonify({'error': 'Scan not found'}), 404


@app.route('/api/scan/<scan_id>/cancel', methods=['POST'])
def cancel_scan(scan_id):
    """Cancel an active scan."""
    if scan_id not in active_scans:
        return jsonify({'error': 'Scan not found or already completed'}), 404
    
    if active_scans[scan_id]['status'] != 'running':
        return jsonify({'error': 'Scan is not running'}), 400
    
    scanner.cancel_scan(scan_id)
    active_scans[scan_id]['status'] = 'cancelled'
    
    return jsonify({
        'scan_id': scan_id,
        'status': 'cancelled',
        'message': 'Scan cancelled successfully'
    })


@app.route('/api/scan/<scan_id>/result', methods=['GET'])
def get_scan_result(scan_id):
    """Get the full results of a completed scan."""
    if scan_id not in scan_results:
        return jsonify({'error': 'Results not found'}), 404
    
    return jsonify(scan_results[scan_id])


@app.route('/api/scan/<scan_id>/pdf', methods=['GET'])
def download_pdf(scan_id):
    """Generate and download a PDF report for a completed scan."""
    if scan_id not in scan_results:
        return jsonify({'error': 'Results not found'}), 404
    
    result = scan_results[scan_id]
    pdf_path = generate_pdf_report(result, scan_id)
    
    if pdf_path and os.path.exists(pdf_path):
        return send_file(
            pdf_path,
            mimetype='application/pdf',
            as_attachment=True,
            download_name=f'nmap-scan-{scan_id[:8]}.pdf'
        )
    
    return jsonify({'error': 'Failed to generate PDF'}), 500


@app.route('/api/history', methods=['GET'])
def get_history():
    """Get scan history."""
    limit = request.args.get('limit', 50, type=int)
    return jsonify(scan_history[-limit:][::-1])


@app.route('/api/history', methods=['DELETE'])
def clear_history():
    """Clear scan history."""
    global scan_history
    scan_history = []
    return jsonify({'message': 'History cleared'})


@app.route('/api/flags', methods=['GET'])
def get_flags():
    """Get available Nmap flags reference."""
    return jsonify(scanner.get_available_flags())


# ─── Background Scan Execution ───────────────────────────────────────────────

def run_scan(scan_id, config):
    """Execute the Nmap scan in a background thread."""
    try:
        def progress_callback(progress_data):
            """Called during scan to update progress."""
            if scan_id in active_scans:
                active_scans[scan_id]['progress'] = progress_data
                # Emit progress via WebSocket
                socketio.emit('scan_progress', {
                    'scan_id': scan_id,
                    'progress': progress_data
                })
        
        # Execute the scan
        result = scanner.run_scan(
            target=config['target'],
            scan_type=config['scan_type'],
            ports=config['ports'],
            timing=config['timing'],
            custom_flags=config['custom_flags'],
            progress_callback=progress_callback,
            scan_id=scan_id
        )
        
        # Store result
        end_time = datetime.utcnow().isoformat()
        result['id'] = scan_id
        result['start_time'] = active_scans[scan_id]['start_time']
        result['end_time'] = end_time
        result['status'] = 'completed'
        
        scan_results[scan_id] = result
        
        # Update active scan status
        active_scans[scan_id]['status'] = 'completed'
        active_scans[scan_id]['progress'] = 100
        
        # Add to history
        scan_history.append({
            'id': scan_id,
            'target': config['target'],
            'scan_type': config['scan_type'],
            'start_time': active_scans[scan_id]['start_time'],
            'end_time': end_time,
            'status': 'completed',
            'summary': result.get('summary', {})
        })
        
        # Emit completion event
        socketio.emit('scan_complete', {
            'scan_id': scan_id,
            'result': result
        })
        
    except Exception as e:
        if scan_id in active_scans:
            active_scans[scan_id]['status'] = 'failed'
            active_scans[scan_id]['error'] = str(e)
        
        socketio.emit('scan_error', {
            'scan_id': scan_id,
            'error': str(e)
        })


# ─── WebSocket Events ────────────────────────────────────────────────────────

@socketio.on('connect')
def handle_connect():
    """Handle client WebSocket connection."""
    emit('connected', {'message': 'Connected to Nmap Scanner'})


@socketio.on('subscribe_scan')
def handle_subscribe(data):
    """Subscribe to scan updates."""
    scan_id = data.get('scan_id')
    if scan_id and scan_id in active_scans:
        emit('scan_status', active_scans[scan_id])


# ─── Main Entry Point ────────────────────────────────────────────────────────

if __name__ == '__main__':
    print("=" * 60)
    print("  Nmap Web Scanner - Backend Server")
    print("=" * 60)
    print(f"  Nmap installed: {scanner.is_nmap_installed()}")
    if scanner.is_nmap_installed():
        print(f"  Nmap version: {scanner.get_nmap_version()}")
    print(f"  Server: http://localhost:5000")
    print(f"  API: http://localhost:5000/api/health")
    print("=" * 60)
    
    socketio.run(app, host='0.0.0.0', port=5000, debug=True)
