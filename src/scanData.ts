import { ScanFlag, ScanType, TimingTemplate, ScanConfig } from './types';

export const SCAN_FLAGS: ScanFlag[] = [
  // Scan Types
  { id: '1', flag: '-sS', description: 'TCP SYN scan (stealth)', category: 'Scan Type' },
  { id: '2', flag: '-sT', description: 'TCP connect scan', category: 'Scan Type' },
  { id: '3', flag: '-sU', description: 'UDP scan', category: 'Scan Type' },
  { id: '4', flag: '-sn', description: 'Ping scan (host discovery)', category: 'Scan Type' },
  { id: '5', flag: '-sV', description: 'Service version detection', category: 'Service' },
  { id: '6', flag: '-O', description: 'OS detection', category: 'Detection' },
  { id: '7', flag: '-A', description: 'Aggressive scan (OS, version, script, traceroute)', category: 'Scan Type' },
  { id: '8', flag: '-sC', description: 'Run default scripts', category: 'Script' },
  
  // Port Specification
  { id: '9', flag: '-p', description: 'Specify ports (e.g., -p 80,443 or -p 1-1000)', category: 'Port' },
  { id: '10', flag: '-p-', description: 'Scan all 65535 ports', category: 'Port' },
  { id: '11', flag: '--top-ports', description: 'Scan top N most common ports', category: 'Port' },
  { id: '12', flag: '-F', description: 'Fast scan (top 100 ports)', category: 'Port' },
  
  // Timing
  { id: '13', flag: '-T0', description: 'Paranoid timing ( IDS evasion)', category: 'Timing' },
  { id: '14', flag: '-T1', description: 'Sneaky timing (IDS evasion)', category: 'Timing' },
  { id: '15', flag: '-T2', description: 'Polite timing', category: 'Timing' },
  { id: '16', flag: '-T3', description: 'Normal timing (default)', category: 'Timing' },
  { id: '17', flag: '-T4', description: 'Aggressive timing', category: 'Timing' },
  { id: '18', flag: '-T5', description: 'Insane timing (fastest)', category: 'Timing' },
  
  // Host Discovery
  { id: '19', flag: '-Pn', description: 'Skip host discovery (treat all as up)', category: 'Discovery' },
  { id: '20', flag: '-PS', description: 'TCP SYN discovery', category: 'Discovery' },
  { id: '21', flag: '-PA', description: 'TCP ACK discovery', category: 'Discovery' },
  { id: '22', flag: '-PU', description: 'UDP discovery', category: 'Discovery' },
  { id: '23', flag: '-PE', description: 'ICMP echo discovery', category: 'Discovery' },
  
  // Output
  { id: '24', flag: '-oN', description: 'Normal output to file', category: 'Output' },
  { id: '25', flag: '-oX', description: 'XML output to file', category: 'Output' },
  { id: '26', flag: '-oG', description: 'Grepable output to file', category: 'Output' },
  { id: '27', flag: '-oA', description: 'All output formats', category: 'Output' },
  { id: '28', flag: '-v', description: 'Verbose output', category: 'Output' },
  { id: '29', flag: '-vv', description: 'Very verbose output', category: 'Output' },
  
  // Evasion
  { id: '30', flag: '-f', description: 'Fragment packets', category: 'Evasion' },
  { id: '31', flag: '-D', description: 'Decoy scan', category: 'Evasion' },
  { id: '32', flag: '-S', description: 'Spoof source address', category: 'Evasion' },
  { id: '33', flag: '--randomize-hosts', description: 'Randomize target host order', category: 'Evasion' },
  
  // Misc
  { id: '34', flag: '-6', description: 'Enable IPv6 scanning', category: 'Misc' },
  { id: '35', flag: '--traceroute', description: 'Trace route to host', category: 'Misc' },
  { id: '36', flag: '--script', description: 'Run specific NSE scripts', category: 'Script' },
  { id: '37', flag: '--script-args', description: 'Pass arguments to scripts', category: 'Script' },
];

export const SCAN_TYPE_FLAGS: Record<ScanType, string> = {
  tcp_syn: '-sS',
  tcp_connect: '-sT',
  udp: '-sU',
  ping: '-sn',
  service_version: '-sS -sV',
  os_detection: '-sS -O',
  aggressive: '-A',
  custom: '',
};

export const TIMING_DESCRIPTIONS: Record<TimingTemplate, string> = {
  T0: 'Paranoid - Serial, 5 min delay',
  T1: 'Sneaky - Serial, 15 sec delay',
  T2: 'Polite - Serial, 0.4 sec delay',
  T3: 'Normal - Parallel, default',
  T4: 'Aggressive - Parallel, faster',
  T5: 'Insane - Parallel, very fast',
};

export function buildNmapCommand(config: ScanConfig): string {
  const parts: string[] = ['nmap'];
  
  // Scan type
  if (config.scanType !== 'custom') {
    parts.push(SCAN_TYPE_FLAGS[config.scanType]);
  }
  
  // Timing
  parts.push(`-${config.timing}`);
  
  // Ports
  if (config.ports) {
    parts.push(`-p ${config.ports}`);
  }
  
  // Custom flags
  if (config.customFlags.trim()) {
    parts.push(config.customFlags.trim());
  }
  
  // Target
  parts.push(config.target);
  
  return parts.join(' ');
}

export function getScanTypeName(type: ScanType): string {
  const names: Record<ScanType, string> = {
    tcp_syn: 'TCP SYN Scan',
    tcp_connect: 'TCP Connect Scan',
    udp: 'UDP Scan',
    ping: 'Ping Sweep',
    service_version: 'Service Version Detection',
    os_detection: 'OS Detection',
    aggressive: 'Aggressive Scan',
    custom: 'Custom Scan',
  };
  return names[type];
}
