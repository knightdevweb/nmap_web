import { useState, useCallback, useRef } from 'react';
import { ScanConfig, ScanResult, ScanProgress } from './types';
import { buildNmapCommand, getScanTypeName } from './scanData';
import { generateMockScanResult, simulateScanProgress } from './mockEngine';
import ScanConfigPanel from './components/ScanConfig';
import ScanProgressPanel from './components/ScanProgress';
import ScanResultsPanel from './components/ScanResults';
import ScanHistoryPanel from './components/ScanHistory';
import { Shield, Activity, Wifi, Terminal } from 'lucide-react';

export default function App() {
  const [isScanning, setIsScanning] = useState(false);
  const [progress, setProgress] = useState<ScanProgress | null>(null);
  const [currentResult, setCurrentResult] = useState<ScanResult | null>(null);
  const [scanHistory, setScanHistory] = useState<ScanResult[]>([]);
  const [showResults, setShowResults] = useState(false);
  const cancelRef = useRef<{ cancel: () => void } | null>(null);

  const handleStartScan = useCallback((config: ScanConfig) => {
    setIsScanning(true);
    setShowResults(false);
    setCurrentResult(null);
    setProgress(null);

    const startTime = new Date();
    const command = buildNmapCommand(config);
    const scanType = getScanTypeName(config.scanType);

    // Simulate progress
    const totalHosts = Math.floor(Math.random() * 4) + 1;
    
    const { cancel } = simulateScanProgress(
      totalHosts,
      (p) => setProgress(p),
      () => {
        // Generate result
        const result = generateMockScanResult(config.target, scanType, command, startTime);
        setCurrentResult(result);
        setScanHistory(prev => [result, ...prev]);
        setIsScanning(false);
        setProgress(null);
        setShowResults(true);
      }
    );

    cancelRef.current = { cancel };
  }, []);

  const handleCancelScan = useCallback(() => {
    if (cancelRef.current) {
      cancelRef.current.cancel();
    }
    setIsScanning(false);
    setProgress(null);
  }, []);

  const handleViewResult = useCallback((result: ScanResult) => {
    setCurrentResult(result);
    setShowResults(true);
  }, []);

  const handleClearHistory = useCallback(() => {
    setScanHistory([]);
  }, []);

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      {/* Background Effects */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-cyan-500/5 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-purple-500/3 rounded-full blur-3xl" />
      </div>

      {/* Header */}
      <header className="relative z-10 border-b border-gray-800/50 bg-gray-950/80 backdrop-blur-xl sticky top-0">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl shadow-lg shadow-blue-500/20">
                <Shield size={24} className="text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
                  Nmap Web Scanner
                </h1>
                <p className="text-xs text-gray-500">Network Security Dashboard</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-gray-800/50 rounded-lg border border-gray-700/50">
                <Wifi size={14} className="text-green-400" />
                <span className="text-xs text-gray-400">Backend Ready</span>
              </div>
              <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-gray-800/50 rounded-lg border border-gray-700/50">
                <Terminal size={14} className="text-blue-400" />
                <span className="text-xs text-gray-400">Python + Flask</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 py-6">
        {/* Status Bar */}
        <div className="mb-6 flex items-center gap-3">
          <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium border ${
            isScanning
              ? 'bg-amber-500/10 border-amber-500/30 text-amber-400'
              : 'bg-green-500/10 border-green-500/30 text-green-400'
          }`}>
            <Activity size={12} className={isScanning ? 'animate-pulse' : ''} />
            {isScanning ? 'Scan In Progress' : 'Ready'}
          </div>
          {scanHistory.length > 0 && (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium bg-blue-500/10 border border-blue-500/30 text-blue-400">
              {scanHistory.length} scans completed
            </div>
          )}
        </div>

        {/* Layout Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column - Config & Progress */}
          <div className="lg:col-span-5 space-y-6">
            <ScanConfigPanel onStartScan={handleStartScan} isScanning={isScanning} />
            
            {isScanning && progress && (
              <ScanProgressPanel progress={progress} onCancel={handleCancelScan} />
            )}

            <ScanHistoryPanel
              history={scanHistory}
              onViewResult={handleViewResult}
              onClearHistory={handleClearHistory}
            />
          </div>

          {/* Right Column - Results */}
          <div className="lg:col-span-7">
            {showResults && currentResult ? (
              <ScanResultsPanel result={currentResult} />
            ) : (
              <div className="bg-gray-900/80 backdrop-blur-xl border border-gray-700/50 rounded-2xl p-8 shadow-2xl h-full flex flex-col items-center justify-center min-h-[400px]">
                <div className="relative mb-6">
                  <div className="w-24 h-24 bg-gradient-to-br from-blue-500/20 to-cyan-500/20 rounded-full flex items-center justify-center border border-blue-500/20">
                    <Shield size={40} className="text-blue-400/60" />
                  </div>
                  <div className="absolute -top-1 -right-1 w-6 h-6 bg-green-500/20 rounded-full flex items-center justify-center border border-green-500/30">
                    <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                  </div>
                </div>
                <h3 className="text-lg font-semibold text-gray-300 mb-2">Ready to Scan</h3>
                <p className="text-sm text-gray-500 text-center max-w-md mb-6">
                  Configure your scan parameters on the left panel and click "Start Scan" to begin.
                  Results will appear here with detailed port information, service versions, and OS detection.
                </p>
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div className="px-4 py-3 bg-gray-800/50 rounded-xl border border-gray-700/30">
                    <p className="text-lg font-bold text-blue-400">8+</p>
                    <p className="text-[10px] text-gray-500">Scan Types</p>
                  </div>
                  <div className="px-4 py-3 bg-gray-800/50 rounded-xl border border-gray-700/30">
                    <p className="text-lg font-bold text-cyan-400">37</p>
                    <p className="text-[10px] text-gray-500">Available Flags</p>
                  </div>
                  <div className="px-4 py-3 bg-gray-800/50 rounded-xl border border-gray-700/30">
                    <p className="text-lg font-bold text-green-400">PDF</p>
                    <p className="text-[10px] text-gray-500">Export Format</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer Info */}
        <div className="mt-8 text-center">
          <p className="text-xs text-gray-600">
            Nmap Web Scanner Dashboard • Python Flask Backend • React Frontend
          </p>
          <p className="text-xs text-gray-700 mt-1">
            Backend files available in <code className="text-gray-500 bg-gray-800/50 px-1.5 py-0.5 rounded">backend/</code> directory
          </p>
        </div>
      </main>
    </div>
  );
}
