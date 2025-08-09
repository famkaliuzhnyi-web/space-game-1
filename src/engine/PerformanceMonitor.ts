/**
 * Performance Monitoring System for Game Engine Optimization
 * 
 * Industry-standard performance monitoring system that tracks key metrics
 * essential for maintaining 60fps gameplay and optimizing resource usage.
 * 
 * **Industry Standards:**
 * - Unity Profiler: Frame time, GC, memory usage
 * - Unreal Insights: CPU, GPU, memory profiling
 * - Chrome DevTools: Performance timeline
 * 
 * **Key Metrics Tracked:**
 * - Frame rate and frame time consistency
 * - Memory usage and garbage collection
 * - Render call batching and draw calls
 * - CPU usage per system
 * - GPU performance indicators
 * 
 * @author Space Game Development Team
 * @version 1.0.0
 * @since 2024-01-01
 */

export interface PerformanceMetrics {
  // Frame Performance
  fps: number;
  frameTime: number; // milliseconds
  frameTimeHistory: number[];
  avgFrameTime: number;
  minFrameTime: number;
  maxFrameTime: number;
  frameDrops: number;
  
  // Memory Usage
  memoryUsage: {
    used: number;
    total: number;
    percentage: number;
  };
  
  // Rendering
  renderStats: {
    drawCalls: number;
    triangles: number;
    vertices: number;
    textureMemory: number;
  };
  
  // System Performance
  systemTimes: Record<string, number>;
  
  // Quality Metrics
  performance: {
    grade: 'S' | 'A' | 'B' | 'C' | 'D' | 'F';
    score: number;
    recommendations: string[];
  };
}

export interface PerformanceConfig {
  historySize: number;
  targetFPS: number;
  criticalFrameTime: number;
  enableGPUProfiling: boolean;
  enableMemoryProfiling: boolean;
  autoAdjustQuality: boolean;
}

/**
 * Comprehensive Performance Monitor
 */
export class PerformanceMonitor {
  private config: PerformanceConfig;
  private metrics: PerformanceMetrics;
  private isRunning: boolean = false;
  
  // Frame tracking
  private frameCount: number = 0;
  private lastFrameTime: number = 0;
  private frameStartTime: number = 0;
  private frameTimeHistory: number[] = [];
  
  // Memory tracking
  private memoryCheckInterval: number = 0;
  private lastMemoryCheck: number = 0;
  
  // System profiling
  private systemProfilers: Map<string, {
    startTime: number;
    totalTime: number;
    callCount: number;
  }> = new Map();
  
  // GPU profiling (WebGL queries)
  private gl: WebGLRenderingContext | WebGL2RenderingContext | null = null;
  
  // Performance history for trending
  private performanceHistory: {
    timestamp: number;
    fps: number;
    frameTime: number;
    memoryUsage: number;
  }[] = [];

  constructor(config: Partial<PerformanceConfig> = {}) {
    this.config = {
      historySize: 120, // 2 seconds at 60fps
      targetFPS: 60,
      criticalFrameTime: 33, // milliseconds (30fps threshold)
      enableGPUProfiling: false, // Disabled by default for compatibility
      enableMemoryProfiling: true,
      autoAdjustQuality: false,
      ...config
    };

    this.metrics = this.initializeMetrics();
    this.setupMemoryProfiling();
  }

  private initializeMetrics(): PerformanceMetrics {
    return {
      fps: 0,
      frameTime: 0,
      frameTimeHistory: [],
      avgFrameTime: 0,
      minFrameTime: Infinity,
      maxFrameTime: 0,
      frameDrops: 0,
      memoryUsage: {
        used: 0,
        total: 0,
        percentage: 0
      },
      renderStats: {
        drawCalls: 0,
        triangles: 0,
        vertices: 0,
        textureMemory: 0
      },
      systemTimes: {},
      performance: {
        grade: 'A',
        score: 100,
        recommendations: []
      }
    };
  }

  /**
   * Initialize GPU profiling if available
   */
  setupGPUProfiling(canvas?: HTMLCanvasElement): void {
    if (!this.config.enableGPUProfiling || !canvas) return;

    try {
      this.gl = canvas.getContext('webgl2') || canvas.getContext('webgl');
      if (this.gl) {
        // GPU timing extensions available but not used in this implementation
        // const gpuTimerExt = this.gl.getExtension('EXT_disjoint_timer_query_webgl2') 
        //                  || this.gl.getExtension('EXT_disjoint_timer_query');
      }
    } catch (error) {
      console.warn('GPU profiling not available:', error);
    }
  }

  /**
   * Setup memory profiling
   */
  private setupMemoryProfiling(): void {
    if (!this.config.enableMemoryProfiling) return;

    // Use performance.memory if available (Chrome/Edge)
    if ('memory' in performance) {
      this.memoryCheckInterval = 1000; // Check every second
    }
  }

  /**
   * Start performance monitoring
   */
  start(): void {
    if (this.isRunning) return;
    
    this.isRunning = true;
    this.lastFrameTime = performance.now();
    this.frameCount = 0;
    
    console.log('Performance Monitor started - targeting', this.config.targetFPS, 'FPS');
  }

  /**
   * Stop performance monitoring
   */
  stop(): void {
    this.isRunning = false;
    this.systemProfilers.clear();
  }

  /**
   * Begin frame measurement (call at start of game loop)
   */
  beginFrame(): void {
    if (!this.isRunning) return;
    
    this.frameStartTime = performance.now();
    this.systemProfilers.clear();
  }

  /**
   * End frame measurement (call at end of game loop)
   */
  endFrame(): void {
    if (!this.isRunning) return;
    
    const currentTime = performance.now();
    const frameTime = currentTime - this.frameStartTime;
    const deltaTime = currentTime - this.lastFrameTime;
    
    this.frameCount++;
    this.lastFrameTime = currentTime;
    
    // Update frame metrics
    this.updateFrameMetrics(frameTime, deltaTime);
    
    // Update memory metrics periodically
    if (currentTime - this.lastMemoryCheck > this.memoryCheckInterval) {
      this.updateMemoryMetrics();
      this.lastMemoryCheck = currentTime;
    }
    
    // Calculate performance grade
    this.updatePerformanceGrade();
    
    // Store history
    this.updatePerformanceHistory(currentTime);
  }

  /**
   * Profile a system's performance
   */
  profileSystem<T>(systemName: string, fn: () => T): T {
    if (!this.isRunning) return fn();
    
    const startTime = performance.now();
    const result = fn();
    const endTime = performance.now();
    
    const duration = endTime - startTime;
    
    if (!this.systemProfilers.has(systemName)) {
      this.systemProfilers.set(systemName, {
        startTime: 0,
        totalTime: 0,
        callCount: 0
      });
    }
    
    const profiler = this.systemProfilers.get(systemName)!;
    profiler.totalTime += duration;
    profiler.callCount++;
    
    this.metrics.systemTimes[systemName] = duration;
    
    return result;
  }

  private updateFrameMetrics(frameTime: number, deltaTime: number): void {
    this.metrics.frameTime = frameTime;
    this.metrics.fps = deltaTime > 0 ? Math.round(1000 / deltaTime) : 0;
    
    // Update frame time history
    this.frameTimeHistory.push(frameTime);
    if (this.frameTimeHistory.length > this.config.historySize) {
      this.frameTimeHistory.shift();
    }
    this.metrics.frameTimeHistory = [...this.frameTimeHistory];
    
    // Calculate statistics
    this.metrics.avgFrameTime = this.frameTimeHistory.reduce((a, b) => a + b, 0) / this.frameTimeHistory.length;
    this.metrics.minFrameTime = Math.min(this.metrics.minFrameTime, frameTime);
    this.metrics.maxFrameTime = Math.max(this.metrics.maxFrameTime, frameTime);
    
    // Count frame drops (frames that take longer than target)
    if (frameTime > this.config.criticalFrameTime) {
      this.metrics.frameDrops++;
    }
  }

  private updateMemoryMetrics(): void {
    if ('memory' in performance) {
      const memory = (performance as any).memory;
      this.metrics.memoryUsage = {
        used: Math.round(memory.usedJSHeapSize / 1024 / 1024), // MB
        total: Math.round(memory.totalJSHeapSize / 1024 / 1024), // MB
        percentage: Math.round((memory.usedJSHeapSize / memory.jsHeapSizeLimit) * 100)
      };
    }
  }

  private updatePerformanceGrade(): void {
    let score = 100;
    const recommendations: string[] = [];
    
    // Frame rate penalty
    if (this.metrics.fps < this.config.targetFPS * 0.5) {
      score -= 40;
      recommendations.push(`Low FPS: ${this.metrics.fps}/${this.config.targetFPS}`);
    } else if (this.metrics.fps < this.config.targetFPS * 0.8) {
      score -= 20;
      recommendations.push(`Below target FPS: ${this.metrics.fps}/${this.config.targetFPS}`);
    }
    
    // Frame time consistency penalty
    const frameTimeVariance = this.metrics.maxFrameTime - this.metrics.minFrameTime;
    if (frameTimeVariance > 20) {
      score -= 15;
      recommendations.push(`Inconsistent frame times (${frameTimeVariance.toFixed(1)}ms variance)`);
    }
    
    // Memory usage penalty
    if (this.metrics.memoryUsage.percentage > 80) {
      score -= 20;
      recommendations.push(`High memory usage: ${this.metrics.memoryUsage.percentage}%`);
    }
    
    // Frame drop penalty
    if (this.metrics.frameDrops > 10) {
      score -= 10;
      recommendations.push(`${this.metrics.frameDrops} frame drops detected`);
    }
    
    // Assign grade
    let grade: 'S' | 'A' | 'B' | 'C' | 'D' | 'F';
    if (score >= 95) grade = 'S';
    else if (score >= 85) grade = 'A';
    else if (score >= 75) grade = 'B';
    else if (score >= 65) grade = 'C';
    else if (score >= 50) grade = 'D';
    else grade = 'F';
    
    this.metrics.performance = {
      grade,
      score: Math.max(0, score),
      recommendations
    };
  }

  private updatePerformanceHistory(timestamp: number): void {
    this.performanceHistory.push({
      timestamp,
      fps: this.metrics.fps,
      frameTime: this.metrics.frameTime,
      memoryUsage: this.metrics.memoryUsage.used
    });
    
    // Keep only last 5 minutes of history
    const maxAge = 5 * 60 * 1000; // 5 minutes
    this.performanceHistory = this.performanceHistory.filter(
      entry => timestamp - entry.timestamp < maxAge
    );
  }

  /**
   * Update render statistics (called by renderer)
   */
  updateRenderStats(stats: Partial<PerformanceMetrics['renderStats']>): void {
    Object.assign(this.metrics.renderStats, stats);
  }

  /**
   * Get current metrics
   */
  getMetrics(): PerformanceMetrics {
    return { ...this.metrics };
  }

  /**
   * Get performance history
   */
  getHistory(): typeof this.performanceHistory {
    return [...this.performanceHistory];
  }

  /**
   * Get system profiling summary
   */
  getSystemProfilingSummary(): Record<string, { avgTime: number; totalTime: number; callCount: number }> {
    const summary: Record<string, any> = {};
    
    this.systemProfilers.forEach((profiler, systemName) => {
      summary[systemName] = {
        avgTime: profiler.callCount > 0 ? profiler.totalTime / profiler.callCount : 0,
        totalTime: profiler.totalTime,
        callCount: profiler.callCount
      };
    });
    
    return summary;
  }

  /**
   * Check if performance is below acceptable thresholds
   */
  isPerformanceCritical(): boolean {
    return this.metrics.fps < this.config.targetFPS * 0.5 || 
           this.metrics.performance.grade === 'F';
  }

  /**
   * Get optimization recommendations
   */
  getOptimizationRecommendations(): string[] {
    return [...this.metrics.performance.recommendations];
  }

  /**
   * Reset all metrics
   */
  reset(): void {
    this.metrics = this.initializeMetrics();
    this.frameTimeHistory = [];
    this.frameCount = 0;
    this.performanceHistory = [];
    this.systemProfilers.clear();
  }

  /**
   * Dispose of the performance monitor
   */
  dispose(): void {
    this.stop();
    this.reset();
  }
}

/**
 * Singleton performance monitor instance
 */
export const performanceMonitor = new PerformanceMonitor();