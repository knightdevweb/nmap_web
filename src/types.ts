export interface ScanConfig {
  target: string;
  scanType: ScanType;
  customFlags: string;
  ports: string;
  timing: TimingTemplate;
  outputFormat: string[];
}

export type ScanType =
  | 'tcp_syn'
  | 'tcp_connect'
  | 'udp'
  | 'ping'
  | 'service_version'
  | 'os_detection'
  | 'aggressive'
  | 'custom';

export type TimingTemplate = 'T0' | 'T1' | 'T2' | 'T3' | 'T4' | 'T5';

export interface ScanFlag {
  id: string;
  flag: string;
  description: string;
  category: string;
}

export interface ScanResult {
  id: string;
  target: string;
  scanType: string;
  flags: string;
  startTime: string;
  endTime: string;
  duration: number;
  status: 'completed' | 'failed' | 'running';
  hosts: HostResult[];
  summary: ScanSummary;
}

export interface HostResult {
  ip: string;
  hostname: string;
  status: 'up' | 'down';
  os: string;
  ports: PortResult[];
}

export interface PortResult {
  port: number;
  protocol: string;
  state: string;
  service: string;
  version: string;
}

export interface ScanSummary {
  totalHosts: number;
  hostsUp: number;
  hostsDown: number;
  totalPorts: number;
  openPorts: number;
  filteredPorts: number;
  closedPorts: number;
}

export interface ScanProgress {
  percent: number;
  currentHost: string;
  currentPort: string;
  elapsedTime: number;
  remainingTime: number;
  hostsScanned: number;
  totalHosts: number;
}
