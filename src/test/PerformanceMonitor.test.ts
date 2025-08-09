/**
 * Tests for Performance Monitor System
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { PerformanceMonitor } from '../engine/PerformanceMonitor';

// Mock performance.now for consistent testing
const mockPerformanceNow = vi.fn();
Object.defineProperty(globalThis, 'performance', {
  value: {
    now: mockPerformanceNow,
    memory: {
      usedJSHeapSize: 50 * 1024 * 1024, // 50MB
      totalJSHeapSize: 100 * 1024 * 1024, // 100MB
      jsHeapSizeLimit: 100 * 1024 * 1024 // 100MB limit for 50% usage
    }
  },
  writable: true
});

describe('PerformanceMonitor', () => {
  let monitor: PerformanceMonitor;
  let currentTime = 0;

  beforeEach(() => {
    currentTime = 0;
    mockPerformanceNow.mockImplementation(() => currentTime);
    
    monitor = new PerformanceMonitor({
      historySize: 10,
      targetFPS: 60,
      criticalFrameTime: 33,
      enableMemoryProfiling: true,
      enableGPUProfiling: false
    });
  });

  afterEach(() => {
    monitor.dispose();
    vi.resetAllMocks();
  });

  describe('Basic Functionality', () => {
    it('should initialize with default metrics', () => {
      const metrics = monitor.getMetrics();
      expect(metrics.fps).toBe(0);
      expect(metrics.frameTime).toBe(0);
      expect(metrics.frameTimeHistory).toHaveLength(0);
      expect(metrics.performance.grade).toBe('A');
      expect(metrics.performance.score).toBe(100);
    });

    it('should start and stop monitoring', () => {
      expect(monitor['isRunning']).toBe(false);
      
      monitor.start();
      expect(monitor['isRunning']).toBe(true);
      
      monitor.stop();
      expect(monitor['isRunning']).toBe(false);
    });

    it('should measure frame performance', () => {
      monitor.start();
      
      // Simulate first frame
      currentTime = 0;
      monitor.beginFrame();
      
      currentTime = 16.67; // ~60 FPS frame time
      monitor.endFrame();
      
      const metrics = monitor.getMetrics();
      expect(metrics.frameTime).toBeCloseTo(16.67, 1);
      expect(metrics.fps).toBeCloseTo(60, 0);
      expect(metrics.frameTimeHistory).toHaveLength(1);
    });

    it('should track frame time history', () => {
      monitor.start();
      
      // Simulate multiple frames
      for (let i = 0; i < 5; i++) {
        currentTime = i * 16.67;
        monitor.beginFrame();
        
        currentTime = (i + 1) * 16.67;
        monitor.endFrame();
      }
      
      const metrics = monitor.getMetrics();
      expect(metrics.frameTimeHistory).toHaveLength(5);
      expect(metrics.avgFrameTime).toBeCloseTo(16.67, 1);
    });

    it('should limit frame history size', () => {
      monitor.start();
      
      // Generate more frames than history size (10)
      for (let i = 0; i < 15; i++) {
        currentTime = i * 16.67;
        monitor.beginFrame();
        
        currentTime = (i + 1) * 16.67;
        monitor.endFrame();
      }
      
      const metrics = monitor.getMetrics();
      expect(metrics.frameTimeHistory).toHaveLength(10); // Capped at history size
    });
  });

  describe('System Profiling', () => {
    it('should profile system execution time', () => {
      monitor.start();
      monitor.beginFrame();
      
      // Profile a mock system
      const result = monitor.profileSystem('TestSystem', () => {
        currentTime += 5; // Simulate 5ms execution
        return 'test result';
      });
      
      expect(result).toBe('test result');
      
      const metrics = monitor.getMetrics();
      expect(metrics.systemTimes.TestSystem).toBe(5);
    });

    it('should handle nested profiling', () => {
      monitor.start();
      monitor.beginFrame();
      
      monitor.profileSystem('OuterSystem', () => {
        currentTime += 2;
        
        monitor.profileSystem('InnerSystem', () => {
          currentTime += 3;
        });
        
        currentTime += 1;
      });
      
      const summary = monitor.getSystemProfilingSummary();
      expect(summary.OuterSystem.totalTime).toBe(6); // 2 + 3 + 1
      expect(summary.InnerSystem.totalTime).toBe(3);
    });

    it('should calculate average times for repeated calls', () => {
      monitor.start();
      monitor.beginFrame();
      
      // Profile same system multiple times
      monitor.profileSystem('RepeatedSystem', () => { currentTime += 5; });
      monitor.profileSystem('RepeatedSystem', () => { currentTime += 10; });
      monitor.profileSystem('RepeatedSystem', () => { currentTime += 15; });
      
      const summary = monitor.getSystemProfilingSummary();
      expect(summary.RepeatedSystem.callCount).toBe(3);
      expect(summary.RepeatedSystem.avgTime).toBe(10); // (5 + 10 + 15) / 3
      expect(summary.RepeatedSystem.totalTime).toBe(30);
    });
  });

  describe('Performance Grading', () => {
    it('should assign grade S for excellent performance', () => {
      monitor.start();
      
      // Simulate perfect 60fps performance
      for (let i = 0; i < 5; i++) {
        currentTime = i * 16.67;
        monitor.beginFrame();
        currentTime = (i + 1) * 16.67;
        monitor.endFrame();
      }
      
      const metrics = monitor.getMetrics();
      expect(metrics.performance.grade).toBe('S');
      expect(metrics.performance.score).toBeGreaterThanOrEqual(95);
    });

    it('should penalize low FPS performance', () => {
      monitor.start();
      
      // Simulate poor 20fps performance
      for (let i = 0; i < 5; i++) {
        currentTime = i * 50; // 20 FPS
        monitor.beginFrame();
        currentTime = (i + 1) * 50;
        monitor.endFrame();
      }
      
      const metrics = monitor.getMetrics();
      expect(metrics.performance.grade).not.toBe('S');
      expect(metrics.performance.score).toBeLessThan(80);
      expect(metrics.performance.recommendations).toContain(
        'Low FPS: 20/60'
      );
    });

    it('should penalize frame time inconsistency', () => {
      monitor.start();
      
      // Simulate inconsistent frame times
      const frameTimes = [16.67, 50, 16.67, 100, 16.67]; // Variable performance
      
      for (let i = 0; i < frameTimes.length; i++) {
        monitor.beginFrame();
        currentTime += frameTimes[i];
        monitor.endFrame();
      }
      
      const metrics = monitor.getMetrics();
      console.log('Frame time inconsistency recommendations:', metrics.performance.recommendations);
      expect(metrics.performance.recommendations.length).toBeGreaterThan(0);
      // Check that there's a recommendation about frame time variance
      expect(metrics.performance.recommendations.some(rec => 
        rec.includes('frame times') || rec.includes('variance')
      )).toBe(true);
    });

    it('should count frame drops correctly', () => {
      monitor.start();
      
      // Simulate frames with drops (>33ms = frame drop)
      const frameTimes = [16.67, 16.67, 50, 16.67, 100]; // 2 frame drops
      
      for (let i = 0; i < frameTimes.length; i++) {
        monitor.beginFrame();
        currentTime += frameTimes[i];
        monitor.endFrame();
      }
      
      const metrics = monitor.getMetrics();
      expect(metrics.frameDrops).toBe(2);
    });
  });

  describe('Memory Profiling', () => {
    it('should track memory usage when available', () => {
      monitor = new PerformanceMonitor({
        enableMemoryProfiling: true
      });
      monitor.start();
      monitor.beginFrame();
      
      // Force memory check by setting lastMemoryCheck to past
      currentTime = 2000; // 2 seconds later
      monitor['lastMemoryCheck'] = 0;
      monitor.endFrame();
      
      const metrics = monitor.getMetrics();
      expect(metrics.memoryUsage.used).toBe(50); // 50MB from mock
      expect(metrics.memoryUsage.total).toBe(100); // 100MB from mock
      expect(metrics.memoryUsage.percentage).toBe(50); // 50% usage
    });

    it('should penalize high memory usage', () => {
      // Mock high memory usage
      Object.defineProperty(globalThis.performance, 'memory', {
        value: {
          usedJSHeapSize: 1700 * 1024 * 1024, // 1.7GB
          totalJSHeapSize: 2000 * 1024 * 1024, // 2GB
          jsHeapSizeLimit: 2048 * 1024 * 1024 // 2GB limit
        }
      });
      
      const highMemMonitor = new PerformanceMonitor();
      highMemMonitor.start();
      
      // Force memory check
      currentTime = 2000;
      highMemMonitor['lastMemoryCheck'] = 0; // Force memory check
      highMemMonitor.beginFrame();
      highMemMonitor.endFrame();
      
      const metrics = highMemMonitor.getMetrics();
      console.log('High memory recommendations:', metrics.performance.recommendations);
      expect(metrics.performance.recommendations.some(rec => 
        rec.includes('memory') || rec.includes('Memory')
      )).toBe(true);
      
      highMemMonitor.dispose();
    });
  });

  describe('Performance History', () => {
    it('should maintain performance history', () => {
      monitor.start();
      
      // Generate several frames
      for (let i = 0; i < 3; i++) {
        currentTime = i * 16.67;
        monitor.beginFrame();
        currentTime = (i + 1) * 16.67;
        monitor.endFrame();
      }
      
      const history = monitor.getHistory();
      expect(history).toHaveLength(3);
      
      history.forEach(entry => {
        expect(entry).toHaveProperty('timestamp');
        expect(entry).toHaveProperty('fps');
        expect(entry).toHaveProperty('frameTime');
        expect(entry).toHaveProperty('memoryUsage');
      });
    });

    it('should clean old history entries', () => {
      monitor.start();
      
      // Generate entry older than 5 minutes
      const oldTime = currentTime;
      monitor.beginFrame();
      monitor.endFrame();
      
      // Jump forward 6 minutes
      currentTime = oldTime + (6 * 60 * 1000);
      monitor.beginFrame();
      monitor.endFrame();
      
      const history = monitor.getHistory();
      expect(history).toHaveLength(1); // Old entry removed
    });
  });

  describe('Error Handling', () => {
    it('should handle profiling when not running', () => {
      // Don't start monitor
      const result = monitor.profileSystem('TestSystem', () => {
        return 'result';
      });
      
      expect(result).toBe('result'); // Function still executes
      const metrics = monitor.getMetrics();
      expect(metrics.systemTimes.TestSystem).toBeUndefined();
    });

    it('should handle frame measurement when not running', () => {
      // Don't start monitor
      monitor.beginFrame();
      monitor.endFrame();
      
      const metrics = monitor.getMetrics();
      expect(metrics.frameTime).toBe(0);
      expect(metrics.fps).toBe(0);
    });
  });

  describe('Utility Methods', () => {
    it('should detect critical performance', () => {
      monitor.start();
      
      // Simulate critical performance (15 FPS)
      for (let i = 0; i < 3; i++) {
        currentTime = i * 66.67; // 15 FPS
        monitor.beginFrame();
        currentTime = (i + 1) * 66.67;
        monitor.endFrame();
      }
      
      expect(monitor.isPerformanceCritical()).toBe(true);
    });

    it('should provide optimization recommendations', () => {
      monitor.start();
      
      // Simulate poor performance
      currentTime = 0;
      monitor.beginFrame();
      currentTime = 100; // Very slow frame
      monitor.endFrame();
      
      const recommendations = monitor.getOptimizationRecommendations();
      expect(recommendations.length).toBeGreaterThan(0);
      expect(recommendations[0]).toContain('FPS');
    });

    it('should reset all metrics', () => {
      monitor.start();
      
      // Generate some data
      monitor.beginFrame();
      currentTime += 16.67;
      monitor.endFrame();
      
      monitor.reset();
      
      const metrics = monitor.getMetrics();
      expect(metrics.frameTimeHistory).toHaveLength(0);
      expect(metrics.frameTime).toBe(0);
      expect(metrics.performance.grade).toBe('A');
      
      const history = monitor.getHistory();
      expect(history).toHaveLength(0);
    });
  });
});