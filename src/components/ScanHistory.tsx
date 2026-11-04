import { ScanResult } from '../types';
import { Clock, CheckCircle, XCircle, Trash2, Eye } from 'lucide-react';

interface Props {
  history: ScanResult[];
  onViewResult: (result: ScanResult) => void;
  onClearHistory: () => void;
}

export default function ScanHistoryPanel({ history, onViewResult, onClearHistory }: Props) {
  if (history.length === 0) {
    return (
      <div className="bg-gray-900/80 backdrop-blur-xl border border-gray-700/50 rounded-2xl p-6 shadow-2xl">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-purple-500/20 rounded-lg">
            <Clock size={20} className="text-purple-400" />
          </div>
          <h2 className="text-xl font-bold text-white">Scan History</h2>
        </div>
        <div className="text-center py-8">
          <Clock size={40} className="text-gray-600 mx-auto mb-3" />
          <p className="text-gray-500 text-sm">No scans yet</p>
          <p className="text-gray-600 text-xs mt-1">Your scan history will appear here</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-900/80 backdrop-blur-xl border border-gray-700/50 rounded-2xl p-6 shadow-2xl">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-purple-500/20 rounded-lg">
            <Clock size={20} className="text-purple-400" />
          </div>
          <h2 className="text-xl font-bold text-white">Scan History</h2>
          <span className="px-2 py-0.5 bg-purple-500/20 text-purple-300 text-xs rounded-full">
            {history.length}
          </span>
        </div>
        <button
          onClick={onClearHistory}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
        >
          <Trash2 size={12} />
          Clear
        </button>
      </div>

      <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
        {history.map((scan) => (
          <div
            key={scan.id}
            className="bg-gray-800/50 rounded-xl border border-gray-700/30 p-3 hover:bg-gray-800/70 transition-colors group"
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                {scan.status === 'completed' ? (
                  <CheckCircle size={14} className="text-green-400" />
                ) : (
                  <XCircle size={14} className="text-red-400" />
                )}
                <span className="font-mono text-sm text-white">{scan.target}</span>
              </div>
              <button
                onClick={() => onViewResult(scan)}
                className="opacity-0 group-hover:opacity-100 p-1.5 bg-blue-500/20 text-blue-400 rounded-lg transition-all hover:bg-blue-500/30"
              >
                <Eye size={12} />
              </button>
            </div>
            <div className="flex items-center gap-3 text-xs text-gray-500">
              <span className="font-mono">{scan.scanType}</span>
              <span>•</span>
              <span>{new Date(scan.startTime).toLocaleString()}</span>
              <span>•</span>
              <span>{(scan.duration / 1000).toFixed(1)}s</span>
            </div>
            <div className="flex items-center gap-2 mt-2">
              <span className="px-2 py-0.5 bg-green-500/10 text-green-400 text-[10px] rounded-full border border-green-500/20">
                {scan.summary.openPorts} open
              </span>
              <span className="px-2 py-0.5 bg-blue-500/10 text-blue-400 text-[10px] rounded-full border border-blue-500/20">
                {scan.summary.hostsUp} hosts
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
