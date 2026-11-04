import { ScanResult, ScanProgress, HostResult, PortResult, ScanSummary } from './types';
import { v4 as uuidv4 } from 'uuid';

const SERVICES = [
  { port: 22, service: 'ssh', version: 'OpenSSH 8.9p1' },
  { port: 80, service: 'http', version: 'Apache 2.4.54' },
  { port: 443, service: 'https', version: 'nginx 1.24.0' },
  { port: 3306, service: 'mysql', version: 'MySQL 8.0.33' },
  { port: 5432, service: 'postgresql', version: 'PostgreSQL 15.3' },
  { port: 8080, service: 'http-proxy', version: 'Squid 5.7' },
  { port: 21, service: 'ftp', version: 'vsftpd 3.0.5' },
  { port: 25, service: 'smtp', version: 'Postfix smtpd' },
  { port: 53, service: 'dns', version: 'BIND 9.18.12' },
  { port: 110, service: 'pop3', version: 'Dovecot pop3d' },
  { port: 143, service: 'imap', version: 'Dovecot imapd' },
  { port: 993, service: 'imaps', version: 'Dovecot imapd' },
  { port: 995, service: 'pop3s', version: 'Dovecot pop3d' },
  { port: 3389, service: 'ms-wbt-server', version: 'Microsoft Terminal Services' },
  { port: 8443, service: 'https-alt', version: 'Apache Tomcat 9.0.75' },
  { port: 6379, service: 'redis', version: 'Redis 7.0.11' },
  { port: 27017, service: 'mongodb', version: 'MongoDB 6.0.6' },
  { port: 9200, service: 'elasticsearch', version: 'Elasticsearch 8.8.0' },
  { port: 5672, service: 'amqp', version: 'RabbitMQ 3.12.0' },
  { port: 1433, service: 'ms-sql-s', version: 'Microsoft SQL Server 2022' },
];

const OS_LIST = [
  'Linux 5.15 (Ubuntu 22.04)',
  'Linux 5.4 (Debian 11)',
  'Linux 6.1 (Fedora 38)',
  'Windows Server 2022',
  'Windows 10 Pro',
  'macOS Ventura 13.4',
  'FreeBSD 13.2',
  'Cisco IOS 15.7',
];

const HOSTNAMES = [
  'web-server.local',
  'db-primary.local',
  'mail-server.local',
  'api-gateway.local',
  'file-server.local',
  'dns-server.local',
  'proxy.local',
  'backup.local',
];

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomChoice<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function generateIP(): string {
  return `${randomInt(10, 192)}.${randomInt(0, 255)}.${randomInt(0, 255)}.${randomInt(1, 254)}`;
}

function generatePorts(numPorts: number): PortResult[] {
  const ports: PortResult[] = [];
  const usedPorts = new Set<number>();
  
  for (let i = 0; i < numPorts; i++) {
    const svc = randomChoice(SERVICES);
    if (usedPorts.has(svc.port)) continue;
    usedPorts.add(svc.port);
    
    const states = ['open', 'open', 'open', 'filtered', 'closed'];
    ports.push({
      port: svc.port,
      protocol: 'tcp',
      state: randomChoice(states),
      service: svc.service,
      version: svc.version,
    });
  }
  
  return ports.sort((a, b) => a.port - b.port);
}

function generateHosts(numHosts: number): HostResult[] {
  const hosts: HostResult[] = [];
  
  for (let i = 0; i < numHosts; i++) {
    const isUp = Math.random() > 0.15;
    hosts.push({
      ip: generateIP(),
      hostname: randomChoice(HOSTNAMES),
      status: isUp ? 'up' : 'down',
      os: isUp ? randomChoice(OS_LIST) : 'Unknown',
      ports: isUp ? generatePorts(randomInt(2, 8)) : [],
    });
  }
  
  return hosts;
}

function generateSummary(hosts: HostResult[]): ScanSummary {
  const hostsUp = hosts.filter(h => h.status === 'up').length;
  const hostsDown = hosts.length - hostsUp;
  const allPorts = hosts.flatMap(h => h.ports);
  
  return {
    totalHosts: hosts.length,
    hostsUp,
    hostsDown,
    totalPorts: allPorts.length,
    openPorts: allPorts.filter(p => p.state === 'open').length,
    filteredPorts: allPorts.filter(p => p.state === 'filtered').length,
    closedPorts: allPorts.filter(p => p.state === 'closed').length,
  };
}

export function generateMockScanResult(
  target: string,
  scanType: string,
  flags: string,
  startTime: Date
): ScanResult {
  const numHosts = randomInt(1, 5);
  const hosts = generateHosts(numHosts);
  const endTime = new Date(startTime.getTime() + randomInt(5000, 45000));
  
  return {
    id: uuidv4(),
    target,
    scanType,
    flags,
    startTime: startTime.toISOString(),
    endTime: endTime.toISOString(),
    duration: endTime.getTime() - startTime.getTime(),
    status: 'completed',
    hosts,
    summary: generateSummary(hosts),
  };
}

export function simulateScanProgress(
  totalHosts: number,
  onProgress: (progress: ScanProgress) => void,
  onComplete: () => void
): { cancel: () => void } {
  let cancelled = false;
  let percent = 0;
  let hostsScanned = 0;
  const startTime = Date.now();
  const totalDuration = randomInt(8000, 20000);
  
  const interval = setInterval(() => {
    if (cancelled) {
      clearInterval(interval);
      return;
    }
    
    percent = Math.min(100, percent + randomInt(2, 8));
    hostsScanned = Math.min(totalHosts, Math.floor((percent / 100) * totalHosts));
    
    const elapsed = Date.now() - startTime;
    const remaining = percent > 0 ? (elapsed / percent) * (100 - percent) : 0;
    
    onProgress({
      percent,
      currentHost: generateIP(),
      currentPort: `${randomInt(1, 65535)}/tcp`,
      elapsedTime: elapsed,
      remainingTime: remaining,
      hostsScanned,
      totalHosts,
    });
    
    if (percent >= 100) {
      clearInterval(interval);
      onComplete();
    }
  }, 300);
  
  return {
    cancel: () => {
      cancelled = true;
      clearInterval(interval);
    },
  };
}
