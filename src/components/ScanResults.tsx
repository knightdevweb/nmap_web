import { useState } from 'react';
import { ScanResult } from '../types';
import { exportScanToPDF } from '../pdfExport';
import {
  FileDown,
  Server,
  Globe,
  Shield,
  ChevronDown,
  ChevronRight,
  Monitor,
  Network,
  BarChart3,
} from 'lucide-react';

interface Props {
  result: ScanResult;
}

export default function ScanResultsPanel({ result }: Props) {
  const [expandedHost, setExpandedHost] = useState<string | null>(null);

  const handleExportPDF = () => {
    exportScanToPDF(result);
  };

  const getStateColor = (state: string) => {
    switch (state) {
      case 'open': return 'text-green-400 bg-green-500/10 border-green-500/30';
      case 'filtered': return 'text-amber-400 bg-amber-500/10 border-amber-500/30';
      case 'closed': return 'text-red-400 bg-red-500/10 border-red-500/30';
      default: return 'text-gray-400 bg-gray-500/10 border-gray-500/30';
    }
  };

  const getHostStatusColor = (status: string) => {
    return status === 'up' ? 'text-green-400' : 'text-red-400';
  };

  return (
    <div className="bg-gray-900/80 backdrop-blur-xl border border-gray-700/50 rounded-2xl p-6 shadow-2xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-green-500/20 rounded-lg">
            <BarChart3 size={20} className="text-green-400" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">Scan Results</h2>
            <p className="text-xs text-gray-400 font-mono">{result.target}</p>
          </div>
        </div>
        <button
          onClick={handleExportPDF}
          className="flex items-center gap-2 px-4 py-2 bg-blue-500/20 border border-blue-500/30 text-blue-400 rounded-lg text-sm font-medium hover:bg-blue-500/30 transition-all"
        >
          <FileDown size={16} />
          Export PDF
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        <div className="bg-gray-800/50 rounded-xl p-4 border border-gray-700/30 text-center">
          <Server size={18} className="text-blue-400 mx-auto mb-1" />
          <p className="text-2xl font-bold text-white">{result.summary.hostsUp}</p>
          <p className="text-xs text-gray-400">Hosts Up</p>
        </div>
        <div className="bg-gray-800/50 rounded-xl p-4 border border-gray-700/30 text-center">
          <Network size={18} className="text-green-400 mx-auto mb-1" />
          <p className="text-2xl font-bold text-white">{result.summary.openPorts}</p>
          <p className="text-xs text-gray-400">Open Ports</p>
        </div>
        <div className="bg-gray-800/50 rounded-xl p-4 border border-gray-700/30 text-center">
          <Shield size={18} className="text-amber-400 mx-auto mb-1" />
          <p className="text-2xl font-bold text-white">{result.summary.filteredPorts}</p>
          <p className="text-xs text-gray-400">Filtered</p>
        </div>
        <div className="bg-gray-800/50 rounded-xl p-4 border border-gray-700/30 text-center">
          <Monitor size={18} className="text-red-400 mx-auto mb-1" />
          <p className="text-2xl font-bold text-white">{result.summary.closedPorts}</p>
          <p className="text-xs text-gray-400">Closed</p>
        </div>
      </div>

      {/* Scan Info Bar */}
      <div className="bg-gray-800/30 rounded-xl p-3 mb-5 flex flex-wrap gap-4 text-xs">
        <span className="text-gray-400">
          <span className="text-gray-500">Duration:</span>{' '}
          <span className="text-white font-mono">{(result.duration / 1000).toFixed(1)}s</span>
        </span>
        <span className="text-gray-400">
          <span className="text-gray-500">Type:</span>{' '}
          <span className="text-blue-300">{result.scanType}</span>
        </span>
        <span className="text-gray-400">
          <span className="text-gray-500">Flags:</span>{' '}
          <span className="text-gray-300 font-mono">{result.flags}</span>
        </span>
      </div>

      {/* Host Results */}
      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-gray-300 flex items-center gap-2">
          <Globe size={14} />
          Discovered Hosts ({result.hosts.length})
        </h3>
        
        {result.hosts.map((host, idx) => (
          <div
            key={idx}
            className="bg-gray-800/50 rounded-xl border border-gray-700/30 overflow-hidden"
          >
            <button
              onClick={() => setExpandedHost(expandedHost === host.ip ? null : host.ip)}
              className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-700/30 transition-colors"
            >
              <div className="flex items-center gap-3">
                {expandedHost === host.ip ? (
                  <ChevronDown size={16} className="text-gray-400" />
                ) : (
                  <ChevronRight size={16} className="text-gray-400" />
                )}
                <span className="font-mono text-sm text-white">{host.ip}</span>
                <span className="text-xs text-gray-500">({host.hostname})</span>
              </div>
              <div className="flex items-center gap-3">
                <span className={`text-xs font-medium ${getHostStatusColor(host.status)}`}>
                  {host.status.toUpperCase()}
                </span>
                <span className="text-xs text-gray-500">{host.ports.length} ports</span>
              </div>
            </button>

            {expandedHost === host.ip && (
              <div className="px-4 pb-4 border-t border-gray-700/30">
                {/* OS Info */}
                <div className="mt-3 mb-3 flex items-center gap-2">
                  <Monitor size={14} className="text-purple-400" />
                  <span className="text-xs text-gray-400">OS:</span>
                  <span className="text-xs text-white">{host.os}</span>
                </div>

                {/* Ports Table */}
                {host.ports.length > 0 && (
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="border-b border-gray-700/50">
                          <th className="text-left py-2 px-2 text-gray-400 font-medium">PORT</th>
                          <th className="text-left py-2 px-2 text-gray-400 font-medium">STATE</th>
                          <th className="text-left py-2 px-2 text-gray-400 font-medium">SERVICE</th>
                          <th className="text-left py-2 px-2 text-gray-400 font-medium">VERSION</th>
                        </tr>
                      </thead>
                      <tbody>
                        {host.ports.map((port, pidx) => (
                          <tr key={pidx} className="border-b border-gray-800/50 hover:bg-gray-700/20">
                            <td className="py-2 px-2 font-mono text-white">{port.port}/{port.protocol}</td>
                            <td className="py-2 px-2">
                              <span className={`px-2 py-0.5 rounded-full border text-[10px] font-bold ${getStateColor(port.state)}`}>
                                {port.state}
                              </span>
                            </td>
                            <td className="py-2 px-2 text-blue-300">{port.service}</td>
                            <td className="py-2 px-2 text-gray-400">{port.version}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
