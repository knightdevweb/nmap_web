"""
PDF Report Generator
====================
Generates PDF reports from Nmap scan results using ReportLab.
"""

import os
from datetime import datetime
from typing import Dict, Optional

try:
    from reportlab.lib import colors
    from reportlab.lib.pagesizes import A4
    from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
    from reportlab.lib.units import inch, cm
    from reportlab.platypus import (
        SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle,
        PageBreak, HRFlowable
    )
    from reportlab.lib.enums import TA_CENTER, TA_LEFT
    REPORTLAB_AVAILABLE = True
except ImportError:
    REPORTLAB_AVAILABLE = False


# Output directory for generated PDFs
OUTPUT_DIR = os.path.join(os.path.dirname(__file__), 'reports')


def generate_pdf_report(result: Dict, scan_id: str) -> Optional[str]:
    """
    Generate a PDF report from scan results.
    
    Args:
        result: Dictionary containing scan results
        scan_id: Unique scan identifier
    
    Returns:
        Path to generated PDF file, or None if generation failed
    """
    if not REPORTLAB_AVAILABLE:
        print("Warning: reportlab not installed. PDF generation unavailable.")
        return None
    
    # Ensure output directory exists
    os.makedirs(OUTPUT_DIR, exist_ok=True)
    
    filename = f"nmap-scan-{scan_id[:8]}-{datetime.now().strftime('%Y%m%d')}.pdf"
    filepath = os.path.join(OUTPUT_DIR, filename)
    
    try:
        doc = SimpleDocTemplate(
            filepath,
            pagesize=A4,
            rightMargin=1.5*cm,
            leftMargin=1.5*cm,
            topMargin=2*cm,
            bottomMargin=2*cm
        )
        
        # Styles
        styles = getSampleStyleSheet()
        title_style = ParagraphStyle(
            'CustomTitle',
            parent=styles['Title'],
            fontSize=20,
            textColor=colors.HexColor('#0064C8'),
            spaceAfter=12,
            alignment=TA_CENTER
        )
        heading_style = ParagraphStyle(
            'CustomHeading',
            parent=styles['Heading2'],
            fontSize=14,
            textColor=colors.HexColor('#333333'),
            spaceAfter=8,
            spaceBefore=16
        )
        normal_style = styles['Normal']
        
        # Build document content
        elements = []
        
        # Title
        elements.append(Paragraph("Nmap Scan Report", title_style))
        elements.append(Paragraph(
            f"Generated: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}",
            ParagraphStyle('Subtitle', parent=normal_style, alignment=TA_CENTER, textColor=colors.grey)
        ))
        elements.append(Spacer(1, 0.5*cm))
        elements.append(HRFlowable(width="100%", thickness=1, color=colors.HexColor('#0064C8')))
        elements.append(Spacer(1, 0.5*cm))
        
        # Scan Information
        elements.append(Paragraph("Scan Information", heading_style))
        
        scan_info_data = [
            ['Target:', result.get('target', 'N/A')],
            ['Scan Type:', result.get('scan_type', 'N/A')],
            ['Start Time:', result.get('start_time', 'N/A')],
            ['End Time:', result.get('end_time', 'N/A')],
            ['Status:', result.get('status', 'N/A').upper()],
        ]
        
        info_table = Table(scan_info_data, colWidths=[3*cm, 12*cm])
        info_table.setStyle(TableStyle([
            ('FONTNAME', (0, 0), (0, -1), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, -1), 9),
            ('TEXTCOLOR', (0, 0), (0, -1), colors.HexColor('#555555')),
            ('TEXTCOLOR', (1, 0), (1, -1), colors.HexColor('#333333')),
            ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
            ('TOPPADDING', (0, 0), (-1, -1), 6),
        ]))
        elements.append(info_table)
        elements.append(Spacer(1, 0.5*cm))
        
        # Summary
        summary = result.get('summary', {})
        elements.append(Paragraph("Scan Summary", heading_style))
        
        summary_data = [
            ['Metric', 'Value'],
            ['Total Hosts', str(summary.get('totalHosts', 0))],
            ['Hosts Up', str(summary.get('hostsUp', 0))],
            ['Hosts Down', str(summary.get('hostsDown', 0))],
            ['Total Ports', str(summary.get('totalPorts', 0))],
            ['Open Ports', str(summary.get('openPorts', 0))],
            ['Filtered Ports', str(summary.get('filteredPorts', 0))],
            ['Closed Ports', str(summary.get('closedPorts', 0))],
        ]
        
        summary_table = Table(summary_data, colWidths=[6*cm, 6*cm])
        summary_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#0064C8')),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, -1), 9),
            ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
            ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#CCCCCC')),
            ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.HexColor('#F5F5F5')]),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
            ('TOPPADDING', (0, 0), (-1, -1), 8),
        ]))
        elements.append(summary_table)
        elements.append(Spacer(1, 0.5*cm))
        
        # Host Results
        hosts = result.get('hosts', [])
        if hosts:
            elements.append(Paragraph("Host Results", heading_style))
            
            for i, host in enumerate(hosts):
                elements.append(Spacer(1, 0.3*cm))
                
                # Host header
                host_text = f"Host {i+1}: {host.get('ip', 'unknown')} ({host.get('hostname', '')})"
                elements.append(Paragraph(
                    host_text,
                    ParagraphStyle('HostHeader', parent=normal_style,
                                   fontSize=11, textColor=colors.HexColor('#0064C8'),
                                   fontName='Helvetica-Bold')
                ))
                
                # Host info
                host_info = f"Status: {host.get('status', 'unknown').upper()} | OS: {host.get('os', 'Unknown')}"
                elements.append(Paragraph(host_info, normal_style))
                elements.append(Spacer(1, 0.2*cm))
                
                # Ports table
                ports = host.get('ports', [])
                if ports:
                    port_data = [['Port', 'Protocol', 'State', 'Service', 'Version']]
                    for port in ports:
                        port_data.append([
                            str(port.get('port', '')),
                            port.get('protocol', ''),
                            port.get('state', ''),
                            port.get('service', ''),
                            port.get('version', '')[:40]  # Truncate long versions
                        ])
                    
                    port_table = Table(port_data, colWidths=[1.5*cm, 2*cm, 2*cm, 3*cm, 6*cm])
                    
                    # Build table style
                    table_style = [
                        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#333333')),
                        ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
                        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
                        ('FONTSIZE', (0, 0), (-1, -1), 8),
                        ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
                        ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#DDDDDD')),
                        ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.HexColor('#FAFAFA')]),
                        ('BOTTOMPADDING', (0, 0), (-1, -1), 5),
                        ('TOPPADDING', (0, 0), (-1, -1), 5),
                    ]
                    
                    # Color code port states
                    for row_idx, port in enumerate(ports, start=1):
                        state = port.get('state', '')
                        if state == 'open':
                            table_style.append(('TEXTCOLOR', (2, row_idx), (2, row_idx), colors.green))
                        elif state == 'filtered':
                            table_style.append(('TEXTCOLOR', (2, row_idx), (2, row_idx), colors.orange))
                        elif state == 'closed':
                            table_style.append(('TEXTCOLOR', (2, row_idx), (2, row_idx), colors.red))
                    
                    port_table.setStyle(TableStyle(table_style))
                    elements.append(port_table)
                
                elements.append(Spacer(1, 0.3*cm))
        
        # Footer
        elements.append(Spacer(1, 1*cm))
        elements.append(HRFlowable(width="100%", thickness=0.5, color=colors.grey))
        elements.append(Paragraph(
            "Generated by Nmap Web Scanner Dashboard",
            ParagraphStyle('Footer', parent=normal_style, alignment=TA_CENTER,
                          fontSize=8, textColor=colors.grey)
        ))
        
        # Build PDF
        doc.build(elements)
        return filepath
        
    except Exception as e:
        print(f"Error generating PDF: {e}")
        return None
