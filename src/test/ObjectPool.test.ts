/**
 * Tests for Object Pool System
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { ObjectPool, PoolManager, IPoolable } from '../engine/ObjectPool';

// Test poolable object
class TestPoolable implements IPoolable {
  public active: boolean = false;
  public value: number = 0;

  reset(): void {
    this.value = 0;
  }

  isActive(): boolean {
    return this.active;
  }

  setActive(active: boolean): void {
    this.active = active;
  }

  setValue(value: number): void {
    this.value = value;
  }
}

describe('ObjectPool', () => {
  let pool: ObjectPool<TestPoolable>;

  beforeEach(() => {
    pool = new ObjectPool<TestPoolable>(
      () => new TestPoolable(),
      5, // initial size
      20, // max size
      (obj) => obj.setValue(42) // custom reset
    );
  });

  afterEach(() => {
    pool.clear();
  });

  describe('Basic Functionality', () => {
    it('should pre-populate pool with initial objects', () => {
      const stats = pool.getStats();
      expect(stats.poolSize).toBe(5);
      expect(stats.totalAllocated).toBe(0);
      expect(stats.totalReused).toBe(0);
    });

    it('should acquire object from pool', () => {
      const obj = pool.acquire();
      expect(obj).toBeDefined();
      expect(obj.isActive()).toBe(true);
      expect(obj.value).toBe(42); // Custom reset applied
      
      const stats = pool.getStats();
      expect(stats.activeCount).toBe(1);
      expect(stats.totalReused).toBe(1);
    });

    it('should release object back to pool', () => {
      const obj = pool.acquire();
      pool.release(obj);
      
      expect(obj.isActive()).toBe(false);
      const stats = pool.getStats();
      expect(stats.activeCount).toBe(0);
      expect(stats.poolSize).toBe(5);
    });

    it('should create new objects when pool is empty', () => {
      // Acquire all pre-populated objects
      const objects = [];
      for (let i = 0; i < 6; i++) {
        objects.push(pool.acquire());
      }
      
      const stats = pool.getStats();
      expect(stats.totalAllocated).toBe(1); // One new object created
      expect(stats.totalReused).toBe(5); // Five from pool
      expect(stats.activeCount).toBe(6);
    });

    it('should respect max pool size', () => {
      const objects = [];
      // Create many objects beyond max size
      for (let i = 0; i < 25; i++) {
        objects.push(pool.acquire());
      }
      
      // Release all objects
      for (const obj of objects) {
        pool.release(obj);
      }
      
      const stats = pool.getStats();
      expect(stats.poolSize).toBeLessThanOrEqual(20); // Max size respected
    });
  });

  describe('Performance Metrics', () => {
    it('should track reuse ratio correctly', () => {
      // Use objects from pool
      const obj1 = pool.acquire();
      pool.release(obj1);
      
      const obj2 = pool.acquire(); // Should reuse obj1
      pool.release(obj2);
      
      const stats = pool.getStats();
      expect(stats.reuseRatio).toBeGreaterThan(0.5); // At least 50% reuse
    });

    it('should track peak active count', () => {
      const objects = [];
      for (let i = 0; i < 10; i++) {
        objects.push(pool.acquire());
      }
      
      const stats = pool.getStats();
      expect(stats.peakActiveCount).toBe(10);
      
      // Release half
      for (let i = 0; i < 5; i++) {
        pool.release(objects[i]);
      }
      
      const statsAfter = pool.getStats();
      expect(statsAfter.peakActiveCount).toBe(10); // Peak should remain
      expect(statsAfter.activeCount).toBe(5);
    });
  });

  describe('Batch Operations', () => {
    it('should release all objects in batch', () => {
      const objects = [];
      for (let i = 0; i < 5; i++) {
        objects.push(pool.acquire());
      }
      
      pool.releaseAll(objects);
      
      expect(objects.length).toBe(0); // Array should be cleared
      const stats = pool.getStats();
      expect(stats.activeCount).toBe(0);
    });
  });

  describe('Memory Management', () => {
    it('should clear pool and reset metrics', () => {
      const obj = pool.acquire();
      pool.clear();
      
      const stats = pool.getStats();
      expect(stats.poolSize).toBe(0);
      expect(stats.activeCount).toBe(0);
      expect(stats.totalAllocated).toBe(0);
      expect(stats.totalReused).toBe(0);
    });

    it('should resize pool dynamically', () => {
      pool.resize(10);
      
      // Fill pool beyond new size
      const objects = [];
      for (let i = 0; i < 15; i++) {
        objects.push(pool.acquire());
      }
      
      // Release all
      for (const obj of objects) {
        pool.release(obj);
      }
      
      const stats = pool.getStats();
      expect(stats.poolSize).toBeLessThanOrEqual(10);
    });
  });
});

describe('PoolManager', () => {
  let poolManager: PoolManager;

  beforeEach(() => {
    poolManager = PoolManager.getInstance();
    poolManager.clearAll(); // Ensure clean state
  });

  describe('Pool Registration', () => {
    it('should register and manage multiple pools', () => {
      const pool1 = poolManager.registerPool<TestPoolable>(
        'test1',
        () => new TestPoolable(),
        3,
        10
      );
      
      const pool2 = poolManager.registerPool<TestPoolable>(
        'test2',
        () => new TestPoolable(),
        5,
        15
      );
      
      expect(pool1).toBeDefined();
      expect(pool2).toBeDefined();
      expect(pool1).not.toBe(pool2);
    });

    it('should acquire and release through manager', () => {
      poolManager.registerPool<TestPoolable>(
        'managed',
        () => new TestPoolable()
      );
      
      const obj = poolManager.acquire<TestPoolable>('managed');
      expect(obj).toBeDefined();
      expect(obj?.isActive()).toBe(true);
      
      if (obj) {
        poolManager.release('managed', obj);
        expect(obj.isActive()).toBe(false);
      }
    });

    it('should return null for unknown pool', () => {
      const obj = poolManager.acquire<TestPoolable>('unknown');
      expect(obj).toBeNull();
    });
  });

  describe('Statistics', () => {
    it('should aggregate statistics from all pools', () => {
      poolManager.registerPool<TestPoolable>('pool1', () => new TestPoolable());
      poolManager.registerPool<TestPoolable>('pool2', () => new TestPoolable());
      
      // Use some objects
      const obj1 = poolManager.acquire<TestPoolable>('pool1');
      const obj2 = poolManager.acquire<TestPoolable>('pool2');
      
      const stats = poolManager.getAllStats();
      expect(stats).toHaveProperty('pool1');
      expect(stats).toHaveProperty('pool2');
      expect(stats.pool1.activeCount).toBe(1);
      expect(stats.pool2.activeCount).toBe(1);
    });
  });

  describe('Cleanup', () => {
    it('should clear all pools', () => {
      poolManager.registerPool<TestPoolable>('test', () => new TestPoolable());
      const obj = poolManager.acquire<TestPoolable>('test');
      
      poolManager.clearAll();
      
      const stats = poolManager.getAllStats();
      expect(stats.test.poolSize).toBe(0);
      expect(stats.test.activeCount).toBe(0);
    });

    it('should dispose all pools', () => {
      poolManager.registerPool<TestPoolable>('test', () => new TestPoolable());
      poolManager.dispose();
      
      const pool = poolManager.getPool('test');
      expect(pool).toBeUndefined();
    });
  });
});

describe('Integration Scenarios', () => {
  it('should handle high-frequency allocation/deallocation', () => {
    const pool = new ObjectPool<TestPoolable>(
      () => new TestPoolable(),
      10,
      50
    );
    
    // Simulate rapid object usage (like particles or bullets)
    for (let frame = 0; frame < 100; frame++) {
      const objects = [];
      
      // Acquire objects for this frame
      for (let i = 0; i < 20; i++) {
        objects.push(pool.acquire());
      }
      
      // Release all objects at end of frame
      for (const obj of objects) {
        pool.release(obj);
      }
    }
    
    const stats = pool.getStats();
    expect(stats.reuseRatio).toBeGreaterThan(0.8); // High reuse ratio
    expect(stats.activeCount).toBe(0); // All objects released
  });

  it('should handle memory pressure gracefully', () => {
    const pool = new ObjectPool<TestPoolable>(
      () => new TestPoolable(),
      5,
      10 // Small max size to trigger pressure
    );
    
    const objects = [];
    
    // Allocate many objects
    for (let i = 0; i < 20; i++) {
      objects.push(pool.acquire());
    }
    
    // Release all
    for (const obj of objects) {
      pool.release(obj);
    }
    
    const stats = pool.getStats();
    expect(stats.poolSize).toBeLessThanOrEqual(10); // Didn't exceed max
    expect(stats.totalAllocated).toBeGreaterThan(5); // Had to create new objects
  });
});