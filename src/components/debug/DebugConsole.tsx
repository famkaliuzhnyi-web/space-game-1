/**
 * Debug Console Component - Showcasing Industry-Standard Engine Features
 * 
 * Displays real-time performance metrics, object pool statistics, and resource
 * management information using the newly implemented engine systems.
 */
import React, { useState, useEffect } from 'react';
import { Engine, PerformanceMetrics } from '../../engine';

interface DebugConsoleProps {
  engine: Engine | null;
  isVisible: boolean;
  onToggle: () => void;
}

export const DebugConsole: React.FC<DebugConsoleProps> = ({ engine, isVisible, onToggle }) => {
  const [metrics, setMetrics] = useState<PerformanceMetrics | null>(null);
  const [poolStats, setPoolStats] = useState<Record<string, any>>({});
  const [resourceStats, setResourceStats] = useState<any>(null);
  const [audioStats, setAudioStats] = useState<any>(null);

  useEffect(() => {
    if (!engine || !isVisible) return;

    const updateStats = () => {
      try {
        // Get performance metrics
        const perfMetrics = engine.getPerformanceMonitor().getMetrics();
        setMetrics(perfMetrics);

        // Get pool statistics
        const pools = engine.getPoolManager().getAllStats();
        setPoolStats(pools);

        // Get resource statistics
        const resources = engine.getResourceManager().getStats();
        setResourceStats(resources);

        // Get audio statistics
        const audio = engine.getAudioEngine().getStats();
        setAudioStats(audio);
      } catch (error) {
        console.error('Error updating debug stats:', error);
      }
    };

    // Update every 100ms for smooth real-time display
    const interval = setInterval(updateStats, 100);
    updateStats(); // Initial update

    return () => clearInterval(interval);
  }, [engine, isVisible]);

  if (!isVisible) {
    return (
      <button
        onClick={onToggle}
        className="fixed top-4 right-4 z-50 bg-gray-800 text-white px-3 py-1 rounded text-sm hover:bg-gray-700"
      >
        Debug Console
      </button>
    );
  }

  const getPerformanceColor = (grade: string) => {
    switch (grade) {
      case 'S': return 'text-green-400';
      case 'A': return 'text-green-300';
      case 'B': return 'text-yellow-300';
      case 'C': return 'text-orange-300';
      case 'D': return 'text-red-300';
      case 'F': return 'text-red-400';
      default: return 'text-white';
    }
  };

  return (
    <div className="fixed top-4 right-4 z-50 bg-black bg-opacity-90 text-white p-4 rounded-lg max-w-md max-h-96 overflow-y-auto text-xs font-mono">
      <div className="flex justify-between items-center mb-3">
        <h3 className="text-lg font-bold text-green-400">🚀 Engine Debug Console</h3>
        <button
          onClick={onToggle}
          className="text-gray-400 hover:text-white text-lg"
        >
          ×
        </button>
      </div>

      {/* Performance Metrics */}
      <div className="mb-4">
        <h4 className="text-yellow-300 font-bold mb-2">⚡ Performance Monitor</h4>
        {metrics && (
          <div className="space-y-1">
            <div className="flex justify-between">
              <span>FPS:</span>
              <span className={metrics.fps >= 55 ? 'text-green-400' : metrics.fps >= 30 ? 'text-yellow-300' : 'text-red-400'}>
                {metrics.fps}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Frame Time:</span>
              <span>{metrics.frameTime.toFixed(2)}ms</span>
            </div>
            <div className="flex justify-between">
              <span>Grade:</span>
              <span className={getPerformanceColor(metrics.performance.grade)}>
                {metrics.performance.grade} ({metrics.performance.score}/100)
              </span>
            </div>
            <div className="flex justify-between">
              <span>Memory:</span>
              <span className={metrics.memoryUsage.percentage > 80 ? 'text-red-400' : 'text-green-400'}>
                {metrics.memoryUsage.used}MB ({metrics.memoryUsage.percentage}%)
              </span>
            </div>
            <div className="flex justify-between">
              <span>Frame Drops:</span>
              <span className={metrics.frameDrops > 5 ? 'text-red-400' : 'text-green-400'}>
                {metrics.frameDrops}
              </span>
            </div>
            {metrics.performance.recommendations.length > 0 && (
              <div className="mt-2">
                <div className="text-orange-300 font-semibold">Recommendations:</div>
                {metrics.performance.recommendations.map((rec: string, i: number) => (
                  <div key={i} className="text-orange-200 text-xs">• {rec}</div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Object Pool Statistics */}
      <div className="mb-4">
        <h4 className="text-blue-300 font-bold mb-2">🔄 Object Pools</h4>
        {Object.keys(poolStats).length > 0 ? (
          Object.entries(poolStats).map(([poolName, stats]) => (
            <div key={poolName} className="mb-2">
              <div className="text-blue-200 font-semibold">{poolName}:</div>
              <div className="pl-2 space-y-1">
                <div className="flex justify-between">
                  <span>Active:</span>
                  <span>{(stats as any).activeCount}</span>
                </div>
                <div className="flex justify-between">
                  <span>Pool Size:</span>
                  <span>{(stats as any).poolSize}</span>
                </div>
                <div className="flex justify-between">
                  <span>Reuse Ratio:</span>
                  <span className="text-green-300">
                    {((stats as any).reuseRatio * 100).toFixed(1)}%
                  </span>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="text-gray-400">No pools active</div>
        )}
      </div>

      {/* Resource Manager Statistics */}
      <div className="mb-4">
        <h4 className="text-purple-300 font-bold mb-2">📦 Resource Manager</h4>
        {resourceStats && (
          <div className="space-y-1">
            <div className="flex justify-between">
              <span>Total Resources:</span>
              <span>{resourceStats.totalResources}</span>
            </div>
            <div className="flex justify-between">
              <span>Loaded:</span>
              <span className="text-green-400">{resourceStats.loadedResources}</span>
            </div>
            <div className="flex justify-between">
              <span>Failed:</span>
              <span className={resourceStats.failedResources > 0 ? 'text-red-400' : 'text-green-400'}>
                {resourceStats.failedResources}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Cache Hit Rate:</span>
              <span className="text-green-300">
                {(resourceStats.cacheHitRate * 100).toFixed(1)}%
              </span>
            </div>
            <div className="flex justify-between">
              <span>Cache Size:</span>
              <span>{(resourceStats.cachedSize / 1024 / 1024).toFixed(1)}MB</span>
            </div>
            <div className="flex justify-between">
              <span>Avg Load Time:</span>
              <span>{resourceStats.averageLoadTime.toFixed(1)}ms</span>
            </div>
          </div>
        )}
      </div>

      {/* Audio Engine Statistics */}
      <div className="mb-4">
        <h4 className="text-green-300 font-bold mb-2">🎵 3D Audio Engine</h4>
        {audioStats && (
          <div className="space-y-1">
            <div className="flex justify-between">
              <span>Active Sources:</span>
              <span>{audioStats.activeSourceCount}/{audioStats.maxSources}</span>
            </div>
            <div className="flex justify-between">
              <span>Total Sources:</span>
              <span>{audioStats.totalSources}</span>
            </div>
            <div className="flex justify-between">
              <span>Context State:</span>
              <span className={audioStats.contextState === 'running' ? 'text-green-400' : 'text-yellow-400'}>
                {audioStats.contextState}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Sample Rate:</span>
              <span>{(audioStats.sampleRate / 1000).toFixed(1)}kHz</span>
            </div>
          </div>
        )}
      </div>

      <div className="text-gray-400 text-xs mt-4 pt-2 border-t border-gray-600">
        Industry-standard engine optimizations active ✨
      </div>
    </div>
  );
};