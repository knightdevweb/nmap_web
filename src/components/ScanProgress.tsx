import { ScanProgress as ScanProgressType } from '../types';
import { Activity, Clock, Server, Cpu } from 'lucide-react';

interface Props {
  progress: ScanProgressType;
  onCancel: () => void;
}

export default function ScanProgressPanel({ progress, onCancel }: Props) {
  const formatTime = (ms: number): string => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="bg-gray-900/80 backdrop-blur-xl border border-gray-700/50 rounded-2xl p-6 shadow-2xl">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-amber-500/20 rounded-lg">
            <Activity size={20} className="text-amber-400 animate-pulse" />
          </div>
          <h2 className="text-xl font-bold text-white">Scan Progress</h2>
        </div>
        <button
          onClick={onCancel}
          className="px-4 py-2 bg-red-500/20 border border-red-500/30 text-red-400 rounded-lg text-sm font-medium hover:bg-red-500/30 transition-all"
        >
          Cancel
        </button>
      </div>

      {/* Progress Bar */}
      <div className="mb-6">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm text-gray-400">Overall Progress</span>
          <span className="text-sm font-bold text-blue-400">{progress.percent}%</span>
        </div>
        <div className="w-full h-4 bg-gray-800 rounded-full overflow-hidden border border-gray-700/50">
          <div
            className="h-full bg-gradient-to-r from-blue-600 via-cyan-500 to-blue-400 rounded-full transition-all duration-300 relative"
            style={{ width: `${progress.percent}%` }}
          >
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-pulse" />
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-3 mb-5">
        <div className="bg-gray-800/50 rounded-xl p-4 border border-gray-700/30">
          <div className="flex items-center gap-2 mb-1">
            <Clock size={14} className="text-green-400" />
            <span className="text-xs text-gray-400">Elapsed</span>
          </div>
          <p className="text-lg font-bold text-white font-mono">{formatTime(progress.elapsedTime)}</p>
        </div>
        <div className="bg-gray-800/50 rounded-xl p-4 border border-gray-700/30">
          <div className="flex items-center gap-2 mb-1">
            <Clock size={14} className="text-amber-400" />
            <span className="text-xs text-gray-400">Remaining</span>
          </div>
          <p className="text-lg font-bold text-white font-mono">{formatTime(progress.remainingTime)}</p>
        </div>
        <div className="bg-gray-800/50 rounded-xl p-4 border border-gray-700/30">
          <div className="flex items-center gap-2 mb-1">
            <Server size={14} className="text-blue-400" />
            <span className="text-xs text-gray-400">Hosts Scanned</span>
          </div>
          <p className="text-lg font-bold text-white font-mono">
            {progress.hostsScanned}/{progress.totalHosts}
          </p>
        </div>
        <div className="bg-gray-800/50 rounded-xl p-4 border border-gray-700/30">
          <div className="flex items-center gap-2 mb-1">
            <Cpu size={14} className="text-purple-400" />
            <span className="text-xs text-gray-400">Current Port</span>
          </div>
          <p className="text-lg font-bold text-white font-mono text-sm">{progress.currentPort}</p>
        </div>
      </div>

      {/* Current Activity */}
      <div className="bg-gray-800/50 rounded-xl p-4 border border-gray-700/30">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
          <span className="text-xs text-gray-400">Currently scanning</span>
        </div>
        <p className="text-sm text-white font-mono">{progress.currentHost}</p>
        <div className="mt-2 flex gap-2">
          {[...Array(5)].map((_, i) => (
            <div
              key={i}
              className="h-1 flex-1 bg-gray-700 rounded-full overflow-hidden"
            >
              <div
                className="h-full bg-blue-500 rounded-full animate-pulse"
                style={{
                  width: `${Math.random() * 100}%`,
                  animationDelay: `${i * 0.2}s`,
                }}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
