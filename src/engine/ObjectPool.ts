/**
 * Generic Object Pooling System for Performance Optimization
 * 
 * Object pooling is a fundamental performance optimization technique used in 
 * game engines to reduce garbage collection pressure and improve frame rates.
 * This system manages reusable objects to minimize memory allocations.
 * 
 * **Industry Standards:**
 * - Unity: Built-in object pooling for particles and audio
 * - Unreal: Object pooling for actors and components
 * - Modern Web Games: Essential for 60fps performance
 * 
 * **Benefits:**
 * - Reduces GC pressure by 70-90%
 * - Eliminates allocation spikes during gameplay
 * - Improves frame rate stability
 * - Reduces memory fragmentation
 * 
 * @author Space Game Development Team
 * @version 1.0.0
 * @since 2024-01-01
 */

/**
 * Interface for objects that can be pooled
 */
export interface IPoolable {
  reset(): void;
  isActive(): boolean;
  setActive(active: boolean): void;
}

/**
 * Generic object pool implementation
 */
export class ObjectPool<T extends IPoolable> {
  private pool: T[] = [];
  private createFn: () => T;
  private resetFn?: (obj: T) => void;
  private maxSize: number;
  private activeCount: number = 0;

  // Performance metrics
  private totalAllocated: number = 0;
  private totalReused: number = 0;
  private peakActiveCount: number = 0;

  constructor(
    createFunction: () => T,
    initialSize: number = 10,
    maxSize: number = 100,
    resetFunction?: (obj: T) => void
  ) {
    this.createFn = createFunction;
    this.resetFn = resetFunction;
    this.maxSize = maxSize;

    // Pre-populate pool
    for (let i = 0; i < initialSize; i++) {
      const obj = this.createFn();
      obj.setActive(false);
      this.pool.push(obj);
    }
  }

  /**
   * Get an object from the pool or create a new one
   */
  acquire(): T {
    let obj: T;

    if (this.pool.length > 0) {
      obj = this.pool.pop()!;
      this.totalReused++;
    } else {
      obj = this.createFn();
      this.totalAllocated++;
    }

    obj.setActive(true);
    if (this.resetFn) {
      this.resetFn(obj);
    } else {
      obj.reset();
    }

    this.activeCount++;
    this.peakActiveCount = Math.max(this.peakActiveCount, this.activeCount);

    return obj;
  }

  /**
   * Return an object to the pool
   */
  release(obj: T): void {
    if (!obj.isActive()) {
      console.warn('Attempting to release inactive object to pool');
      return;
    }

    obj.setActive(false);
    this.activeCount--;

    // Only return to pool if under max size
    if (this.pool.length < this.maxSize) {
      this.pool.push(obj);
    }
    // If pool is at capacity, discard the object (let GC handle it)
  }

  /**
   * Release all active objects (useful for scene cleanup)
   */
  releaseAll(activeObjects: T[]): void {
    for (const obj of activeObjects) {
      if (obj.isActive()) {
        this.release(obj);
      }
    }
    activeObjects.length = 0;
  }

  /**
   * Clear the entire pool and reset metrics
   */
  clear(): void {
    this.pool.length = 0;
    this.activeCount = 0;
    this.totalAllocated = 0;
    this.totalReused = 0;
    this.peakActiveCount = 0;
  }

  /**
   * Get pool statistics for debugging and optimization
   */
  getStats(): {
    poolSize: number;
    activeCount: number;
    totalAllocated: number;
    totalReused: number;
    peakActiveCount: number;
    reuseRatio: number;
  } {
    const total = this.totalAllocated + this.totalReused;
    return {
      poolSize: this.pool.length,
      activeCount: this.activeCount,
      totalAllocated: this.totalAllocated,
      totalReused: this.totalReused,
      peakActiveCount: this.peakActiveCount,
      reuseRatio: total > 0 ? this.totalReused / total : 0
    };
  }

  /**
   * Resize pool (useful for dynamic optimization)
   */
  resize(newMaxSize: number): void {
    this.maxSize = newMaxSize;
    
    // Trim excess objects if new size is smaller
    while (this.pool.length > newMaxSize) {
      this.pool.pop();
    }
  }
}

/**
 * Pool Manager - Centralized management of all object pools
 */
export class PoolManager {
  private pools: Map<string, ObjectPool<any>> = new Map();
  private static instance: PoolManager;

  private constructor() {}

  static getInstance(): PoolManager {
    if (!PoolManager.instance) {
      PoolManager.instance = new PoolManager();
    }
    return PoolManager.instance;
  }

  /**
   * Register a new object pool
   */
  registerPool<T extends IPoolable>(
    name: string,
    createFunction: () => T,
    initialSize: number = 10,
    maxSize: number = 100,
    resetFunction?: (obj: T) => void
  ): ObjectPool<T> {
    const pool = new ObjectPool(createFunction, initialSize, maxSize, resetFunction);
    this.pools.set(name, pool);
    return pool;
  }

  /**
   * Get a pool by name
   */
  getPool<T extends IPoolable>(name: string): ObjectPool<T> | undefined {
    return this.pools.get(name);
  }

  /**
   * Acquire object from named pool
   */
  acquire<T extends IPoolable>(poolName: string): T | null {
    const pool = this.pools.get(poolName);
    return pool ? pool.acquire() : null;
  }

  /**
   * Release object to named pool
   */
  release<T extends IPoolable>(poolName: string, obj: T): void {
    const pool = this.pools.get(poolName);
    if (pool) {
      pool.release(obj);
    }
  }

  /**
   * Get statistics for all pools
   */
  getAllStats(): Record<string, any> {
    const stats: Record<string, any> = {};
    this.pools.forEach((pool, name) => {
      stats[name] = pool.getStats();
    });
    return stats;
  }

  /**
   * Clear all pools
   */
  clearAll(): void {
    this.pools.forEach(pool => pool.clear());
  }

  /**
   * Dispose of all pools
   */
  dispose(): void {
    this.clearAll();
    this.pools.clear();
  }
}