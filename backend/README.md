# Nmap Web Scanner - Backend Setup

## Overview

This is the Python/Flask backend for the Nmap Web Scanner Dashboard. It provides:

- **REST API** for managing Nmap scans
- **WebSocket** support for real-time progress updates
- **PDF export** for scan reports
- **Scan history** management

## Prerequisites

1. **Python 3.8+** installed
2. **Nmap** installed on your system:
   - **Ubuntu/Debian**: `sudo apt install nmap`
   - **macOS**: `brew install nmap`
   - **Windows**: Download from https://nmap.org/download.html
   - **CentOS/RHEL**: `sudo yum install nmap`

## Installation

```bash
# Navigate to the backend directory
cd backend

# Create a virtual environment (recommended)
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt
```

## Running the Server

```bash
# Start the Flask development server
python app.py
```

The server will start on `http://localhost:5000`

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/health` | Health check & Nmap status |
| POST | `/api/scan` | Start a new scan |
| GET | `/api/scan/<id>` | Get scan status |
| POST | `/api/scan/<id>/cancel` | Cancel active scan |
| GET | `/api/scan/<id>/result` | Get scan results |
| GET | `/api/scan/<id>/pdf` | Download PDF report |
| GET | `/api/history` | Get scan history |
| DELETE | `/api/history` | Clear history |
| GET | `/api/flags` | Get available Nmap flags |

## API Examples

### Start a Scan

```bash
curl -X POST http://localhost:5000/api/scan \
  -H "Content-Type: application/json" \
  -d '{
    "target": "192.168.1.1",
    "scan_type": "tcp_syn",
    "ports": "80,443,8080",
    "timing": "T4",
    "custom_flags": "-sV"
  }'
```

### Get Scan Status

```bash
curl http://localhost:5000/api/scan/<scan_id>
```

### Download PDF Report

```bash
curl -O http://localhost:5000/api/scan/<scan_id>/pdf
```

## WebSocket Events

Connect to `ws://localhost:5000` to receive real-time updates:

- `scan_progress` - Progress updates during scan
- `scan_complete` - Scan finished with results
- `scan_error` - Scan encountered an error

## Scan Types

| Type | Nmap Flag | Description |
|------|-----------|-------------|
| `tcp_syn` | `-sS` | TCP SYN (stealth) scan |
| `tcp_connect` | `-sT` | Full TCP connect scan |
| `udp` | `-sU` | UDP port scan |
| `ping` | `-sn` | Ping sweep (host discovery) |
| `service_version` | `-sS -sV` | Service version detection |
| `os_detection` | `-sS -O` | OS fingerprinting |
| `aggressive` | `-A` | Aggressive scan (all features) |

## Timing Templates

| Template | Description |
|----------|-------------|
| `T0` | Paranoid (IDS evasion, serial, 5min delay) |
| `T1` | Sneaky (IDS evasion, serial, 15sec delay) |
| `T2` | Polite (slows down to use less bandwidth) |
| `T3` | Normal (default, parallel) |
| `T4` | Aggressive (assumes fast network) |
| `T5` | Insane (very fast, may miss things) |

## Production Deployment

For production use, consider:

```bash
# Use gunicorn with gevent worker
pip install gunicorn
gunicorn --worker-class gevent -w 4 --bind 0.0.0.0:5000 app:app

# Or with eventlet
pip install eventlet
gunicorn --worker-class eventlet -w 1 --bind 0.0.0.0:5000 app:app
```

## Security Notes

⚠️ **Important**: This application runs Nmap scans which can be intrusive.
- Only scan networks you own or have permission to test
- Consider adding authentication to the API
- Use HTTPS in production
- Implement rate limiting
- Add IP whitelisting for sensitive environments

## Troubleshooting

### Nmap not found
```bash
# Check if nmap is installed
which nmap
nmap --version

# If not found, install it (see Prerequisites)
```

### Permission denied for scans
```bash
# Some scan types require root/admin privileges
sudo python app.py

# Or use unprivileged scan types (-sT instead of -sS)
```

### PDF generation fails
```bash
# Ensure reportlab is installed
pip install reportlab

# Check if reports directory is writable
mkdir -p reports
chmod 755 reports
```
