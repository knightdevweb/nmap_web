import React, { useState } from 'react';
import { ScanConfig as ScanConfigType, ScanType, TimingTemplate } from '../types';
import { SCAN_FLAGS, SCAN_TYPE_FLAGS, TIMING_DESCRIPTIONS, buildNmapCommand, getScanTypeName } from '../scanData';
import {
  Target,
  Radar,
  Clock,
  Flag,
  Terminal,
  ChevronDown,
  ChevronUp,
  Zap,
  Shield,
  Search,
  Globe,
} from 'lucide-react';

interface Props {
  onStartScan: (config: ScanConfigType) => void;
  isScanning: boolean;
}

const SCAN_TYPES: { value: ScanType; label: string; icon: React.ReactNode; desc: string }[] = [
  { value: 'tcp_syn', label: 'TCP SYN', icon: <Zap size={16} />, desc: 'Stealth SYN scan' },
  { value: 'tcp_connect', label: 'TCP Connect', icon: <Shield size={16} />, desc: 'Full TCP connect' },
  { value: 'udp', label: 'UDP', icon: <Globe size={16} />, desc: 'UDP port scan' },
  { value: 'ping', label: 'Ping Sweep', icon: <Radar size={16} />, desc: 'Host discovery' },
  { value: 'service_version', label: 'Service Ver.', icon: <Search size={16} />, desc: 'Version detection' },
  { value: 'os_detection', label: 'OS Detect', icon: <Shield size={16} />, desc: 'OS fingerprinting' },
  { value: 'aggressive', label: 'Aggressive', icon: <Zap size={16} />, desc: 'Full aggressive scan' },
  { value: 'custom', label: 'Custom', icon: <Flag size={16} />, desc: 'Custom flags' },
];

export default function ScanConfigPanel({ onStartScan, isScanning }: Props) {
  const [config, setConfig] = useState<ScanConfigType>({
    target: '',
    scanType: 'tcp_syn',
    customFlags: '',
    ports: '',
    timing: 'T3',
    outputFormat: ['normal'],
  });
  const [showFlags, setShowFlags] = useState(false);
  const [selectedFlags, setSelectedFlags] = useState<string[]>([]);

  const command = buildNmapCommand(config);

  const toggleFlag = (flag: string) => {
    setSelectedFlags(prev =>
      prev.includes(flag)
        ? prev.filter(f => f !== flag)
        : [...prev, flag]
    );
    setConfig(prev => ({
      ...prev,
      customFlags: [...selectedFlags.filter(f => f !== flag), ...(selectedFlags.includes(flag) ? [] : [flag])].join(' '),
    }));
  };

  const handleStart = () => {
    if (!config.target.trim()) return;
    onStartScan(config);
  };

  return (
    <div className="bg-gray-900/80 backdrop-blur-xl border border-gray-700/50 rounded-2xl p-6 shadow-2xl">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-blue-500/20 rounded-lg">
          <Terminal size={20} className="text-blue-400" />
        </div>
        <h2 className="text-xl font-bold text-white">Scan Configuration</h2>
      </div>

      {/* Target Input */}
      <div className="mb-5">
        <label className="block text-sm font-medium text-gray-300 mb-2">
          <Target size={14} className="inline mr-1" />
          Target (IP, CIDR, or hostname)
        </label>
        <input
          type="text"
          value={config.target}
          onChange={e => setConfig(prev => ({ ...prev, target: e.target.value }))}
          placeholder="e.g., 192.168.1.0/24, scanme.nmap.org, 10.0.0.1-50"
          className="w-full px-4 py-3 bg-gray-800/80 border border-gray-600/50 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all font-mono text-sm"
          disabled={isScanning}
        />
      </div>

      {/* Scan Type */}
      <div className="mb-5">
        <label className="block text-sm font-medium text-gray-300 mb-2">Scan Type</label>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {SCAN_TYPES.map(type => (
            <button
              key={type.value}
              onClick={() => setConfig(prev => ({ ...prev, scanType: type.value }))}
              disabled={isScanning}
              className={`p-3 rounded-xl border text-left transition-all ${
                config.scanType === type.value
                  ? 'bg-blue-500/20 border-blue-500/50 text-blue-300'
                  : 'bg-gray-800/50 border-gray-700/50 text-gray-400 hover:border-gray-500/50 hover:text-gray-300'
              } ${isScanning ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <div className="flex items-center gap-1.5 mb-1">
                {type.icon}
                <span className="text-xs font-semibold">{type.label}</span>
              </div>
              <p className="text-[10px] opacity-70">{type.desc}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Timing & Ports Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-5">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            <Clock size={14} className="inline mr-1" />
            Timing Template
          </label>
          <select
            value={config.timing}
            onChange={e => setConfig(prev => ({ ...prev, timing: e.target.value as TimingTemplate }))}
            disabled={isScanning}
            className="w-full px-4 py-3 bg-gray-800/80 border border-gray-600/50 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all text-sm"
          >
            {Object.entries(TIMING_DESCRIPTIONS).map(([key, desc]) => (
              <option key={key} value={key}>
                {key} - {desc}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Ports (optional)
          </label>
          <input
            type="text"
            value={config.ports}
            onChange={e => setConfig(prev => ({ ...prev, ports: e.target.value }))}
            placeholder="e.g., 80,443 or 1-1000"
            disabled={isScanning}
            className="w-full px-4 py-3 bg-gray-800/80 border border-gray-600/50 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all font-mono text-sm"
          />
        </div>
      </div>

      {/* Custom Flags Section */}
      {config.scanType === 'custom' && (
        <div className="mb-5">
          <label className="block text-sm font-medium text-gray-300 mb-2">
            <Flag size={14} className="inline mr-1" />
            Custom Nmap Flags
          </label>
          <input
            type="text"
            value={config.customFlags}
            onChange={e => setConfig(prev => ({ ...prev, customFlags: e.target.value }))}
            placeholder="e.g., -sS -sV -O -p 1-1000"
            disabled={isScanning}
            className="w-full px-4 py-3 bg-gray-800/80 border border-gray-600/50 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all font-mono text-sm"
          />
        </div>
      )}

      {/* Flags Reference */}
      <div className="mb-5">
        <button
          onClick={() => setShowFlags(!showFlags)}
          className="flex items-center gap-2 text-sm text-gray-400 hover:text-blue-400 transition-colors"
        >
          <Flag size={14} />
          <span>Scan Flags Reference</span>
          {showFlags ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </button>
        
        {showFlags && (
          <div className="mt-3 max-h-64 overflow-y-auto bg-gray-800/50 rounded-xl border border-gray-700/50 p-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
              {SCAN_FLAGS.map(f => (
                <button
                  key={f.id}
                  onClick={() => toggleFlag(f.flag)}
                  className={`text-left px-2 py-1.5 rounded-lg text-xs transition-all ${
                    selectedFlags.includes(f.flag)
                      ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                      : 'text-gray-400 hover:bg-gray-700/50 hover:text-gray-300'
                  }`}
                >
                  <span className="font-mono font-bold text-blue-400">{f.flag}</span>
                  <span className="ml-2 opacity-80">{f.description}</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Command Preview */}
      <div className="mb-5">
        <label className="block text-sm font-medium text-gray-300 mb-2">Command Preview</label>
        <div className="bg-black/50 rounded-xl border border-gray-700/50 p-3 font-mono text-sm">
          <span className="text-green-400">$</span>{' '}
          <span className="text-gray-300">{command}</span>
        </div>
      </div>

      {/* Start Button */}
      <button
        onClick={handleStart}
        disabled={!config.target.trim() || isScanning}
        className={`w-full py-3.5 rounded-xl font-semibold text-sm transition-all ${
          !config.target.trim() || isScanning
            ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
            : 'bg-gradient-to-r from-blue-600 to-cyan-600 text-white hover:from-blue-500 hover:to-cyan-500 shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40'
        }`}
      >
        {isScanning ? (
          <span className="flex items-center justify-center gap-2">
            <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            Scanning...
          </span>
        ) : (
          'Start Scan'
        )}
      </button>
    </div>
  );
}
