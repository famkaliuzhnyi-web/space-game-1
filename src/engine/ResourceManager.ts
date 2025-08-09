/**
 * Resource Management System for Game Engine
 * 
 * Centralized asset loading, caching, and streaming system following
 * modern game engine patterns for efficient resource management.
 * 
 * **Industry Standards:**
 * - Unity: AssetDatabase and Resources system
 * - Unreal: Content Browser and Asset Manager
 * - Modern Web: Service Worker caching + streaming
 * 
 * **Features:**
 * - Asynchronous loading with progress tracking
 * - Automatic caching and memory management
 * - Resource dependencies and reference counting
 * - Texture/Audio streaming and compression
 * - Preloading and lazy loading strategies
 * 
 * @author Space Game Development Team
 * @version 1.0.0
 * @since 2024-01-01
 */

export type ResourceType = 'texture' | 'audio' | 'model' | 'shader' | 'json' | 'font' | 'video';

export interface ResourceDescriptor {
  id: string;
  url: string;
  type: ResourceType;
  priority: number; // 0 = highest priority
  size?: number; // Expected size in bytes
  dependencies?: string[]; // Other resource IDs this depends on
  preload?: boolean; // Should be loaded during init
  streaming?: boolean; // Can be loaded progressively
  compressed?: boolean; // Is compressed and needs decompression
  metadata?: Record<string, any>;
}

export interface LoadProgress {
  resourceId: string;
  loaded: number;
  total: number;
  percentage: number;
  stage: 'downloading' | 'processing' | 'complete' | 'error';
}

export interface ResourceStats {
  totalResources: number;
  loadedResources: number;
  failedResources: number;
  cachedSize: number; // bytes
  memoryUsage: number; // bytes
  cacheHitRate: number;
  averageLoadTime: number;
}

/**
 * Individual resource entry with metadata
 */
class ResourceEntry {
  public data: any = null;
  public loadPromise: Promise<any> | null = null;
  public refCount: number = 0;
  public lastAccessed: number = Date.now();
  public loadStartTime: number = 0;
  public loadEndTime: number = 0;
  public size: number = 0;
  public error: Error | null = null;
  public isLoading: boolean = false;

  constructor(public descriptor: ResourceDescriptor) {}

  get isLoaded(): boolean {
    return this.data !== null && !this.isLoading;
  }

  get loadTime(): number {
    return this.loadEndTime - this.loadStartTime;
  }

  addRef(): void {
    this.refCount++;
    this.lastAccessed = Date.now();
  }

  removeRef(): void {
    this.refCount = Math.max(0, this.refCount - 1);
  }
}

/**
 * Main Resource Manager
 */
export class ResourceManager {
  private resources: Map<string, ResourceEntry> = new Map();
  private loadQueue: ResourceDescriptor[] = [];
  private maxCacheSize: number = 100 * 1024 * 1024; // 100MB default
  private maxConcurrentLoads: number = 6; // Modern browser limit
  private currentLoads: number = 0;
  
  // Statistics
  private stats: ResourceStats = {
    totalResources: 0,
    loadedResources: 0,
    failedResources: 0,
    cachedSize: 0,
    memoryUsage: 0,
    cacheHitRate: 0,
    averageLoadTime: 0
  };
  
  private cacheHits: number = 0;
  private cacheMisses: number = 0;
  
  // Event callbacks
  private progressCallbacks: ((progress: LoadProgress) => void)[] = [];
  private errorCallbacks: ((resourceId: string, error: Error) => void)[] = [];

  constructor(maxCacheSize: number = 100 * 1024 * 1024) {
    this.maxCacheSize = maxCacheSize;
    
    // Set up automatic cache cleanup
    setInterval(() => this.cleanupCache(), 30000); // Every 30 seconds
  }

  /**
   * Register a resource for loading
   */
  register(descriptor: ResourceDescriptor): void {
    if (this.resources.has(descriptor.id)) {
      console.warn(`Resource ${descriptor.id} already registered`);
      return;
    }

    const entry = new ResourceEntry(descriptor);
    this.resources.set(descriptor.id, entry);
    this.stats.totalResources++;

    if (descriptor.preload) {
      this.loadQueue.push(descriptor);
    }
  }

  /**
   * Register multiple resources
   */
  registerBatch(descriptors: ResourceDescriptor[]): void {
    for (const descriptor of descriptors) {
      this.register(descriptor);
    }
  }

  /**
   * Load a specific resource
   */
  async load<T = any>(resourceId: string): Promise<T> {
    const entry = this.resources.get(resourceId);
    if (!entry) {
      throw new Error(`Resource ${resourceId} not registered`);
    }

    // Return cached data if available
    if (entry.isLoaded) {
      entry.addRef();
      this.cacheHits++;
      return entry.data;
    }

    // Return existing promise if already loading
    if (entry.loadPromise) {
      return entry.loadPromise;
    }

    this.cacheMisses++;
    entry.loadPromise = this.loadResource(entry);
    
    try {
      const data = await entry.loadPromise;
      entry.addRef();
      return data;
    } catch (error) {
      entry.loadPromise = null;
      throw error;
    }
  }

  /**
   * Load multiple resources with progress tracking
   */
  async loadBatch(resourceIds: string[], onProgress?: (progress: number) => void): Promise<any[]> {
    let completed = 0;
    const results: any[] = [];

    const loadPromises = resourceIds.map(async (id, index) => {
      try {
        const data = await this.load(id);
        results[index] = data;
        completed++;
        if (onProgress) {
          onProgress(completed / resourceIds.length);
        }
        return data;
      } catch (error) {
        results[index] = null;
        completed++;
        if (onProgress) {
          onProgress(completed / resourceIds.length);
        }
        throw error;
      }
    });

    await Promise.allSettled(loadPromises);
    return results;
  }

  /**
   * Load all preload resources
   */
  async loadPreloadResources(onProgress?: (progress: number) => void): Promise<void> {
    const preloadIds = Array.from(this.resources.values())
      .filter(entry => entry.descriptor.preload)
      .map(entry => entry.descriptor.id);

    if (preloadIds.length === 0) return;

    console.log(`Loading ${preloadIds.length} preload resources...`);
    await this.loadBatch(preloadIds, onProgress);
  }

  /**
   * Internal resource loading implementation
   */
  private async loadResource(entry: ResourceEntry): Promise<any> {
    // Wait if we've hit concurrent load limit
    while (this.currentLoads >= this.maxConcurrentLoads) {
      await new Promise(resolve => setTimeout(resolve, 10));
    }

    this.currentLoads++;
    entry.isLoading = true;
    entry.loadStartTime = Date.now();

    try {
      // Load dependencies first
      if (entry.descriptor.dependencies) {
        await Promise.all(
          entry.descriptor.dependencies.map(depId => this.load(depId))
        );
      }

      const data = await this.loadByType(entry);
      
      entry.data = data;
      entry.loadEndTime = Date.now();
      entry.isLoading = false;
      entry.error = null;
      
      this.updateStats(entry);
      this.stats.loadedResources++;

      console.log(`Loaded resource: ${entry.descriptor.id} (${entry.loadTime}ms)`);
      return data;

    } catch (error) {
      entry.isLoading = false;
      entry.error = error as Error;
      entry.loadEndTime = Date.now();
      this.stats.failedResources++;
      
      this.errorCallbacks.forEach(callback => {
        try {
          callback(entry.descriptor.id, error as Error);
        } catch (callbackError) {
          console.error('Error in error callback:', callbackError);
        }
      });

      throw error;
    } finally {
      this.currentLoads--;
    }
  }

  /**
   * Load resource by type
   */
  private async loadByType(entry: ResourceEntry): Promise<any> {
    const { type, url } = entry.descriptor;

    switch (type) {
      case 'texture':
        return this.loadTexture(url);
      
      case 'audio':
        return this.loadAudio(url);
      
      case 'json':
        return this.loadJSON(url);
      
      case 'model':
        return this.loadModel(url);
      
      case 'shader':
        return this.loadShader(url);
      
      case 'font':
        return this.loadFont(url);
      
      case 'video':
        return this.loadVideo(url);
      
      default:
        throw new Error(`Unsupported resource type: ${type}`);
    }
  }

  private async loadTexture(url: string): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error(`Failed to load texture: ${url}`));
      img.src = url;
    });
  }

  private async loadAudio(url: string): Promise<AudioBuffer> {
    const response = await fetch(url);
    const arrayBuffer = await response.arrayBuffer();
    
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    return audioContext.decodeAudioData(arrayBuffer);
  }

  private async loadJSON(url: string): Promise<any> {
    const response = await fetch(url);
    return response.json();
  }

  private async loadModel(url: string): Promise<any> {
    const response = await fetch(url);
    return response.arrayBuffer(); // For binary formats like glTF
  }

  private async loadShader(url: string): Promise<string> {
    const response = await fetch(url);
    return response.text();
  }

  private async loadFont(url: string): Promise<FontFace> {
    const fontFace = new FontFace('GameFont', `url(${url})`);
    await fontFace.load();
    document.fonts.add(fontFace);
    return fontFace;
  }

  private async loadVideo(url: string): Promise<HTMLVideoElement> {
    return new Promise((resolve, reject) => {
      const video = document.createElement('video');
      video.preload = 'auto';
      video.oncanplaythrough = () => resolve(video);
      video.onerror = () => reject(new Error(`Failed to load video: ${url}`));
      video.src = url;
    });
  }

  /**
   * Release a resource reference
   */
  release(resourceId: string): void {
    const entry = this.resources.get(resourceId);
    if (entry) {
      entry.removeRef();
    }
  }

  /**
   * Get resource data if loaded
   */
  get<T = any>(resourceId: string): T | null {
    const entry = this.resources.get(resourceId);
    if (entry?.isLoaded) {
      entry.addRef();
      return entry.data;
    }
    return null;
  }

  /**
   * Check if resource is loaded
   */
  isLoaded(resourceId: string): boolean {
    const entry = this.resources.get(resourceId);
    return entry?.isLoaded ?? false;
  }

  /**
   * Cleanup unused resources
   */
  private cleanupCache(): void {
    const now = Date.now();
    const maxAge = 5 * 60 * 1000; // 5 minutes
    let freedBytes = 0;

    // Sort by last accessed time (oldest first)
    const entries = Array.from(this.resources.values())
      .filter(entry => entry.refCount === 0 && entry.isLoaded)
      .sort((a, b) => a.lastAccessed - b.lastAccessed);

    for (const entry of entries) {
      // Remove old unused resources
      if (now - entry.lastAccessed > maxAge || this.stats.cachedSize > this.maxCacheSize) {
        freedBytes += entry.size;
        entry.data = null;
        this.stats.cachedSize -= entry.size;
        this.stats.loadedResources--;
        
        if (this.stats.cachedSize <= this.maxCacheSize * 0.8) {
          break; // Keep 20% headroom
        }
      }
    }

    if (freedBytes > 0) {
      console.log(`Cache cleanup: freed ${(freedBytes / 1024 / 1024).toFixed(1)}MB`);
    }
  }

  /**
   * Update statistics
   */
  private updateStats(entry: ResourceEntry): void {
    if (entry.data) {
      // Estimate size for different types
      let size = 0;
      if (entry.data instanceof HTMLImageElement) {
        size = entry.data.width * entry.data.height * 4; // RGBA
      } else if (entry.data instanceof AudioBuffer) {
        size = entry.data.length * entry.data.numberOfChannels * 4; // Float32
      } else if (typeof entry.data === 'string') {
        size = entry.data.length * 2; // UTF-16
      } else if (entry.data instanceof ArrayBuffer) {
        size = entry.data.byteLength;
      }
      
      entry.size = size;
      this.stats.cachedSize += size;
    }

    // Update cache hit rate
    const total = this.cacheHits + this.cacheMisses;
    this.stats.cacheHitRate = total > 0 ? this.cacheHits / total : 0;

    // Update average load time
    const loadTimes = Array.from(this.resources.values())
      .filter(e => e.isLoaded && e.loadTime > 0)
      .map(e => e.loadTime);
    
    this.stats.averageLoadTime = loadTimes.length > 0 
      ? loadTimes.reduce((a, b) => a + b, 0) / loadTimes.length 
      : 0;
  }

  /**
   * Get current statistics
   */
  getStats(): ResourceStats {
    return { ...this.stats };
  }

  /**
   * Add progress callback
   */
  onProgress(callback: (progress: LoadProgress) => void): void {
    this.progressCallbacks.push(callback);
  }

  /**
   * Add error callback
   */
  onError(callback: (resourceId: string, error: Error) => void): void {
    this.errorCallbacks.push(callback);
  }

  /**
   * Clear all cached resources
   */
  clearCache(): void {
    for (const entry of this.resources.values()) {
      if (entry.isLoaded) {
        entry.data = null;
        entry.refCount = 0;
      }
    }
    
    this.stats.cachedSize = 0;
    this.stats.loadedResources = 0;
    this.cacheHits = 0;
    this.cacheMisses = 0;
  }

  /**
   * Dispose of the resource manager
   */
  dispose(): void {
    this.clearCache();
    this.resources.clear();
    this.loadQueue = [];
    this.progressCallbacks = [];
    this.errorCallbacks = [];
  }
}

/**
 * Singleton resource manager instance
 */
export const resourceManager = new ResourceManager();