import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { ScanResult } from './types';

export function exportScanToPDF(result: ScanResult): void {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  
  // Title
  doc.setFontSize(20);
  doc.setTextColor(0, 100, 200);
  doc.text('Nmap Scan Report', pageWidth / 2, 20, { align: 'center' });
  
  // Subtitle
  doc.setFontSize(10);
  doc.setTextColor(100);
  doc.text(`Generated: ${new Date().toLocaleString()}`, pageWidth / 2, 28, { align: 'center' });
  
  // Scan Info
  doc.setFontSize(12);
  doc.setTextColor(0);
  let yPos = 42;
  
  doc.setFont('helvetica', 'bold');
  doc.text('Scan Information', 14, yPos);
  yPos += 8;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  
  const scanInfo = [
    ['Target:', result.target],
    ['Scan Type:', result.scanType],
    ['Flags:', result.flags],
    ['Start Time:', new Date(result.startTime).toLocaleString()],
    ['End Time:', new Date(result.endTime).toLocaleString()],
    ['Duration:', `${(result.duration / 1000).toFixed(1)} seconds`],
    ['Status:', result.status.toUpperCase()],
  ];
  
  autoTable(doc, {
    startY: yPos,
    head: [],
    body: scanInfo,
    theme: 'plain',
    styles: { fontSize: 9, cellPadding: 2 },
    columnStyles: {
      0: { fontStyle: 'bold', cellWidth: 35 },
      1: { cellWidth: 'auto' },
    },
    margin: { left: 14 },
  });
  
  yPos = (doc as any).lastAutoTable.finalY + 12;
  
  // Summary
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('Scan Summary', 14, yPos);
  yPos += 8;
  
  const summaryData = [
    ['Total Hosts', result.summary.totalHosts.toString()],
    ['Hosts Up', result.summary.hostsUp.toString()],
    ['Hosts Down', result.summary.hostsDown.toString()],
    ['Total Ports Scanned', result.summary.totalPorts.toString()],
    ['Open Ports', result.summary.openPorts.toString()],
    ['Filtered Ports', result.summary.filteredPorts.toString()],
    ['Closed Ports', result.summary.closedPorts.toString()],
  ];
  
  autoTable(doc, {
    startY: yPos,
    head: [['Metric', 'Value']],
    body: summaryData,
    theme: 'grid',
    headStyles: { fillColor: [0, 100, 200], fontSize: 9 },
    styles: { fontSize: 9, cellPadding: 3 },
    margin: { left: 14 },
  });
  
  yPos = (doc as any).lastAutoTable.finalY + 12;
  
  // Host Results
  result.hosts.forEach((host, index) => {
    if (yPos > 240) {
      doc.addPage();
      yPos = 20;
    }
    
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(0, 80, 160);
    doc.text(`Host ${index + 1}: ${host.ip} (${host.hostname})`, 14, yPos);
    yPos += 6;
    
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(0);
    doc.text(`Status: ${host.status.toUpperCase()} | OS: ${host.os}`, 14, yPos);
    yPos += 8;
    
    if (host.ports.length > 0) {
      const portData = host.ports.map(p => [
        p.port.toString(),
        p.protocol,
        p.state,
        p.service,
        p.version,
      ]);
      
      autoTable(doc, {
        startY: yPos,
        head: [['Port', 'Protocol', 'State', 'Service', 'Version']],
        body: portData,
        theme: 'striped',
        headStyles: { fillColor: [40, 40, 40], fontSize: 8 },
        styles: { fontSize: 8, cellPadding: 2 },
        columnStyles: {
          0: { cellWidth: 18 },
          1: { cellWidth: 20 },
          2: { cellWidth: 22 },
          3: { cellWidth: 30 },
          4: { cellWidth: 'auto' },
        },
        margin: { left: 14 },
        didParseCell: (data: any) => {
          if (data.section === 'body' && data.column.index === 2) {
            if (data.cell.raw === 'open') {
              data.cell.styles.textColor = [0, 128, 0];
              data.cell.styles.fontStyle = 'bold';
            } else if (data.cell.raw === 'filtered') {
              data.cell.styles.textColor = [200, 150, 0];
            } else if (data.cell.raw === 'closed') {
              data.cell.styles.textColor = [180, 0, 0];
            }
          }
        },
      });
      
      yPos = (doc as any).lastAutoTable.finalY + 10;
    }
  });
  
  // Footer
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(150);
    doc.text(
      `Nmap Web Scanner Dashboard - Page ${i} of ${pageCount}`,
      pageWidth / 2,
      doc.internal.pageSize.getHeight() - 10,
      { align: 'center' }
    );
  }
  
  doc.save(`nmap-scan-${result.target}-${new Date(result.startTime).toISOString().slice(0, 10)}.pdf`);
}
