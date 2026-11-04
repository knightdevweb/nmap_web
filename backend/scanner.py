"""
Nmap Scanner Module
===================
Provides a Python wrapper around the Nmap command-line tool.
Handles scan execution, parsing, and progress tracking.
"""

import os
import re
import subprocess
import xml.etree.ElementTree as ET
from datetime import datetime
from typing import Dict, List, Optional, Callable


class NmapScanner:
    """Wrapper class for Nmap scanning functionality."""
    
    # Scan type to Nmap flag mapping
    SCAN_TYPE_FLAGS = {
        'tcp_syn': '-sS',
        'tcp_connect': '-sT',
        'udp': '-sU',
        'ping': '-sn',
        'service_version': '-sS -sV',
        'os_detection': '-sS -O',
        'aggressive': '-A',
    }
    
    def __init__(self):
        self.active_processes = {}  # scan_id -> subprocess.Popen
        self.nmap_path = self._find_nmap()
    
    def _find_nmap(self) -> str:
        """Find the nmap binary on the system."""
        # Check common locations
        paths = [
            '/usr/bin/nmap',
            '/usr/local/bin/nmap',
            '/opt/homebrew/bin/nmap',
            'C:\\Program Files (x86)\\Nmap\\nmap.exe',
            'C:\\Program Files\\Nmap\\nmap.exe',
        ]
        
        for path in paths:
            if os.path.exists(path):
                return path
        
        # Try to find in PATH
        try:
            result = subprocess.run(
                ['which', 'nmap'],
                capture_output=True,
                text=True,
                timeout=5
            )
            if result.returncode == 0:
                return result.stdout.strip()
        except (subprocess.TimeoutExpired, FileNotFoundError):
            pass
        
        return 'nmap'  # Hope it's in PATH
    
    def is_nmap_installed(self) -> bool:
        """Check if Nmap is installed and accessible."""
        try:
            result = subprocess.run(
                [self.nmap_path, '--version'],
                capture_output=True,
                text=True,
                timeout=10
            )
            return result.returncode == 0
        except (subprocess.TimeoutExpired, FileNotFoundError):
            return False
    
    def get_nmap_version(self) -> Optional[str]:
        """Get the installed Nmap version."""
        try:
            result = subprocess.run(
                [self.nmap_path, '--version'],
                capture_output=True,
                text=True,
                timeout=10
            )
            if result.returncode == 0:
                # Parse version from output like "Nmap version 7.94 ( https://nmap.org )"
                match = re.search(r'Nmap version ([\d.]+)', result.stdout)
                if match:
                    return match.group(1)
        except (subprocess.TimeoutExpired, FileNotFoundError):
            pass
        return None
    
    def build_command(self, target: str, scan_type: str = 'tcp_syn',
                      ports: str = '', timing: str = 'T3',
                      custom_flags: str = '', output_file: str = '') -> List[str]:
        """Build the Nmap command arguments."""
        cmd = [self.nmap_path]
        
        # Scan type
        if scan_type in self.SCAN_TYPE_FLAGS:
            cmd.extend(self.SCAN_TYPE_FLAGS[scan_type].split())
        
        # Timing
        cmd.append(f'-{timing}')
        
        # Ports
        if ports:
            cmd.extend(['-p', ports])
        
        # Custom flags
        if custom_flags:
            cmd.extend(custom_flags.split())
        
        # Output
        if output_file:
            cmd.extend(['-oX', output_file])
        else:
            cmd.extend(['-oX', '-'])  # Output XML to stdout
        
        # Verbose
        cmd.append('-v')
        
        # Target
        cmd.append(target)
        
        return cmd
    
    def run_scan(self, target: str, scan_type: str = 'tcp_syn',
                 ports: str = '', timing: str = 'T3',
                 custom_flags: str = '', progress_callback: Optional[Callable] = None,
                 scan_id: str = '') -> Dict:
        """
        Execute an Nmap scan and return parsed results.
        
        Args:
            target: Target IP/hostname/CIDR
            scan_type: Type of scan to perform
            ports: Port specification (e.g., "80,443" or "1-1000")
            timing: Timing template (T0-T5)
            custom_flags: Additional Nmap flags
            progress_callback: Function called with progress updates
            scan_id: Unique scan identifier
        
        Returns:
            Dictionary containing parsed scan results
        """
        # Build command
        cmd = self.build_command(target, scan_type, ports, timing, custom_flags)
        
        # Start process
        process = subprocess.Popen(
            cmd,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            text=True
        )
        
        if scan_id:
            self.active_processes[scan_id] = process
        
        try:
            # Monitor progress
            if progress_callback:
                progress_callback({
                    'percent': 5,
                    'status': 'Initializing scan...',
                    'target': target,
                })
            
            # Wait for completion
            stdout, stderr = process.communicate(timeout=300)  # 5 min timeout
            
            if progress_callback:
                progress_callback({
                    'percent': 90,
                    'status': 'Parsing results...',
                    'target': target,
                })
            
            # Parse XML output
            result = self._parse_xml_output(stdout)
            
            if progress_callback:
                progress_callback({
                    'percent': 100,
                    'status': 'Complete',
                    'target': target,
                })
            
            return result
            
        except subprocess.TimeoutExpired:
            process.kill()
            raise Exception(f"Scan timed out after 300 seconds")
        except Exception as e:
            process.kill()
            raise Exception(f"Scan failed: {str(e)}")
        finally:
            if scan_id and scan_id in self.active_processes:
                del self.active_processes[scan_id]
    
    def cancel_scan(self, scan_id: str) -> bool:
        """Cancel an active scan."""
        if scan_id in self.active_processes:
            process = self.active_processes[scan_id]
            process.terminate()
            try:
                process.wait(timeout=5)
            except subprocess.TimeoutExpired:
                process.kill()
            del self.active_processes[scan_id]
            return True
        return False
    
    def _parse_xml_output(self, xml_output: str) -> Dict:
        """Parse Nmap XML output into a structured dictionary."""
        result = {
            'target': '',
            'hosts': [],
            'summary': {
                'totalHosts': 0,
                'hostsUp': 0,
                'hostsDown': 0,
                'totalPorts': 0,
                'openPorts': 0,
                'filteredPorts': 0,
                'closedPorts': 0,
            }
        }
        
        try:
            root = ET.fromstring(xml_output)
        except ET.ParseError:
            # If XML parsing fails, try to extract basic info from text output
            return self._parse_text_output(xml_output)
        
        # Parse hosts
        for host_elem in root.findall('.//host'):
            host = self._parse_host(host_elem)
            result['hosts'].append(host)
            
            # Update summary
            result['summary']['totalHosts'] += 1
            if host['status'] == 'up':
                result['summary']['hostsUp'] += 1
            else:
                result['summary']['hostsDown'] += 1
            
            for port in host['ports']:
                result['summary']['totalPorts'] += 1
                if port['state'] == 'open':
                    result['summary']['openPorts'] += 1
                elif port['state'] == 'filtered':
                    result['summary']['filteredPorts'] += 1
                elif port['state'] == 'closed':
                    result['summary']['closedPorts'] += 1
        
        return result
    
    def _parse_host(self, host_elem) -> Dict:
        """Parse a single host element from XML."""
        host = {
            'ip': '',
            'hostname': '',
            'status': 'unknown',
            'os': '',
            'ports': [],
        }
        
        # Get IP address
        for addr in host_elem.findall('address'):
            if addr.get('addrtype') == 'ipv4':
                host['ip'] = addr.get('addr', '')
                break
        
        # Get hostname
        hostnames = host_elem.find('hostnames')
        if hostnames is not None:
            hostname_elem = hostnames.find('hostname')
            if hostname_elem is not None:
                host['hostname'] = hostname_elem.get('name', '')
        
        # Get status
        status_elem = host_elem.find('status')
        if status_elem is not None:
            host['status'] = status_elem.get('state', 'unknown')
        
        # Get OS
        os_elem = host_elem.find('.//osmatch')
        if os_elem is not None:
            host['os'] = os_elem.get('name', '')
        
        # Get ports
        ports_elem = host_elem.find('ports')
        if ports_elem is not None:
            for port_elem in ports_elem.findall('port'):
                port = self._parse_port(port_elem)
                host['ports'].append(port)
        
        return host
    
    def _parse_port(self, port_elem) -> Dict:
        """Parse a single port element from XML."""
        port = {
            'port': int(port_elem.get('portid', 0)),
            'protocol': port_elem.get('protocol', 'tcp'),
            'state': '',
            'service': '',
            'version': '',
        }
        
        # Get state
        state_elem = port_elem.find('state')
        if state_elem is not None:
            port['state'] = state_elem.get('state', '')
        
        # Get service info
        service_elem = port_elem.find('service')
        if service_elem is not None:
            port['service'] = service_elem.get('name', '')
            product = service_elem.get('product', '')
            version = service_elem.get('version', '')
            if product:
                port['version'] = f"{product} {version}".strip()
        
        return port
    
    def _parse_text_output(self, output: str) -> Dict:
        """Fallback parser for text output when XML fails."""
        result = {
            'target': '',
            'hosts': [],
            'summary': {
                'totalHosts': 0,
                'hostsUp': 0,
                'hostsDown': 0,
                'totalPorts': 0,
                'openPorts': 0,
                'filteredPorts': 0,
                'closedPorts': 0,
            }
        }
        
        # Try to extract port info from text
        port_pattern = re.compile(r'(\d+)/(\w+)\s+(\w+)\s+(\w+)(.*)')
        
        for line in output.split('\n'):
            match = port_pattern.match(line.strip())
            if match:
                port_num = int(match.group(1))
                protocol = match.group(2)
                state = match.group(3)
                service = match.group(4)
                version = match.group(5).strip()
                
                if not result['hosts']:
                    result['hosts'].append({
                        'ip': 'unknown',
                        'hostname': '',
                        'status': 'up',
                        'os': '',
                        'ports': []
                    })
                
                result['hosts'][0]['ports'].append({
                    'port': port_num,
                    'protocol': protocol,
                    'state': state,
                    'service': service,
                    'version': version
                })
                
                result['summary']['totalPorts'] += 1
                if state == 'open':
                    result['summary']['openPorts'] += 1
                elif state == 'filtered':
                    result['summary']['filteredPorts'] += 1
                elif state == 'closed':
                    result['summary']['closedPorts'] += 1
        
        if result['hosts']:
            result['summary']['totalHosts'] = 1
            result['summary']['hostsUp'] = 1
        
        return result
    
    def get_available_flags(self) -> List[Dict]:
        """Return a list of commonly used Nmap flags with descriptions."""
        return [
            # Scan Types
            {'flag': '-sS', 'description': 'TCP SYN scan (stealth)', 'category': 'Scan Type'},
            {'flag': '-sT', 'description': 'TCP connect scan', 'category': 'Scan Type'},
            {'flag': '-sU', 'description': 'UDP scan', 'category': 'Scan Type'},
            {'flag': '-sn', 'description': 'Ping scan (host discovery)', 'category': 'Scan Type'},
            {'flag': '-sV', 'description': 'Service version detection', 'category': 'Service'},
            {'flag': '-O', 'description': 'OS detection', 'category': 'Detection'},
            {'flag': '-A', 'description': 'Aggressive scan', 'category': 'Scan Type'},
            {'flag': '-sC', 'description': 'Run default scripts', 'category': 'Script'},
            
            # Port Specification
            {'flag': '-p', 'description': 'Specify ports', 'category': 'Port'},
            {'flag': '-p-', 'description': 'Scan all 65535 ports', 'category': 'Port'},
            {'flag': '--top-ports', 'description': 'Scan top N ports', 'category': 'Port'},
            {'flag': '-F', 'description': 'Fast scan (top 100)', 'category': 'Port'},
            
            # Timing
            {'flag': '-T0', 'description': 'Paranoid timing', 'category': 'Timing'},
            {'flag': '-T1', 'description': 'Sneaky timing', 'category': 'Timing'},
            {'flag': '-T2', 'description': 'Polite timing', 'category': 'Timing'},
            {'flag': '-T3', 'description': 'Normal timing', 'category': 'Timing'},
            {'flag': '-T4', 'description': 'Aggressive timing', 'category': 'Timing'},
            {'flag': '-T5', 'description': 'Insane timing', 'category': 'Timing'},
            
            # Host Discovery
            {'flag': '-Pn', 'description': 'Skip host discovery', 'category': 'Discovery'},
            {'flag': '-PS', 'description': 'TCP SYN discovery', 'category': 'Discovery'},
            {'flag': '-PA', 'description': 'TCP ACK discovery', 'category': 'Discovery'},
            {'flag': '-PE', 'description': 'ICMP echo discovery', 'category': 'Discovery'},
            
            # Output
            {'flag': '-oN', 'description': 'Normal output', 'category': 'Output'},
            {'flag': '-oX', 'description': 'XML output', 'category': 'Output'},
            {'flag': '-oG', 'description': 'Grepable output', 'category': 'Output'},
            {'flag': '-oA', 'description': 'All formats', 'category': 'Output'},
            {'flag': '-v', 'description': 'Verbose', 'category': 'Output'},
            
            # Evasion
            {'flag': '-f', 'description': 'Fragment packets', 'category': 'Evasion'},
            {'flag': '-D', 'description': 'Decoy scan', 'category': 'Evasion'},
            {'flag': '--randomize-hosts', 'description': 'Randomize order', 'category': 'Evasion'},
            
            # Misc
            {'flag': '-6', 'description': 'IPv6 scanning', 'category': 'Misc'},
            {'flag': '--traceroute', 'description': 'Trace route', 'category': 'Misc'},
            {'flag': '--script', 'description': 'NSE scripts', 'category': 'Script'},
        ]
