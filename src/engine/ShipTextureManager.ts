/**
 * Ship Texture Manager
 * 
 * Manages loading and caching of ship component textures.
 * Integrates with the ResourceManager to provide texture assets for ship rendering.
 */

import { resourceManager, ResourceDescriptor } from './ResourceManager';

export interface ShipTextureSpec {
  width: number;
  height: number;
  type: 'hull' | 'engine' | 'weapon' | 'cockpit';
  description: string;
}

export interface ShipTextureManifest {
  version: string;
  generated: string;
  textures: Record<string, ShipTextureSpec>;
  format: string;
  description: string;
}

/**
 * Ship Texture Manager - handles ship component textures
 */
export class ShipTextureManager {
  private manifest: ShipTextureManifest | null = null;
  private initialized = false;
  private baseUrl = '/textures/ships/components/';

  /**
   * Initialize the texture manager by loading the manifest
   */
  async initialize(): Promise<void> {
    if (this.initialized) return;

    try {
      // Load the texture manifest
      const manifestDescriptor: ResourceDescriptor = {
        id: 'ship-texture-manifest',
        url: `${this.baseUrl}manifest.json`,
        type: 'json',
        priority: 0,
        preload: true
      };

      resourceManager.register(manifestDescriptor);
      this.manifest = await resourceManager.load<ShipTextureManifest>('ship-texture-manifest');

      if (this.manifest && this.manifest.textures) {
        // Register all textures with the resource manager
        for (const [textureId, spec] of Object.entries(this.manifest.textures)) {
          const descriptor: ResourceDescriptor = {
            id: `ship-texture-${textureId}`,
            url: `${this.baseUrl}${textureId}.${this.manifest.format}`,
            type: 'texture',
            priority: 1,
            preload: false, // Load textures on demand
            metadata: {
              spec,
              component: true
            }
          };

          resourceManager.register(descriptor);
        }

        console.log(`Ship Texture Manager: Registered ${Object.keys(this.manifest.textures).length} textures`);
      }

      this.initialized = true;
    } catch (error) {
      console.error('Failed to initialize Ship Texture Manager:', error);
      throw error;
    }
  }

  /**
   * Load a specific ship texture
   */
  async loadTexture(textureId: string): Promise<HTMLImageElement | null> {
    if (!this.initialized) {
      await this.initialize();
    }

    try {
      const resourceId = `ship-texture-${textureId}`;
      return await resourceManager.load<HTMLImageElement>(resourceId);
    } catch (error) {
      console.warn(`Failed to load ship texture ${textureId}:`, error);
      return null;
    }
  }

  /**
   * Load multiple textures
   */
  async loadTextures(textureIds: string[]): Promise<(HTMLImageElement | null)[]> {
    if (!this.initialized) {
      await this.initialize();
    }

    const promises = textureIds.map(id => this.loadTexture(id));
    return Promise.all(promises);
  }

  /**
   * Get texture synchronously if already loaded
   */
  getTexture(textureId: string): HTMLImageElement | null {
    if (!this.initialized) return null;

    const resourceId = `ship-texture-${textureId}`;
    return resourceManager.get<HTMLImageElement>(resourceId);
  }

  /**
   * Check if a texture is loaded
   */
  isTextureLoaded(textureId: string): boolean {
    if (!this.initialized) return false;

    const resourceId = `ship-texture-${textureId}`;
    return resourceManager.isLoaded(resourceId);
  }

  /**
   * Get texture specification
   */
  getTextureSpec(textureId: string): ShipTextureSpec | null {
    if (!this.manifest) return null;
    return this.manifest.textures[textureId] || null;
  }

  /**
   * Get all available texture IDs
   */
  getAvailableTextures(): string[] {
    if (!this.manifest) return [];
    return Object.keys(this.manifest.textures);
  }

  /**
   * Get textures by type
   */
  getTexturesByType(type: 'hull' | 'engine' | 'weapon' | 'cockpit'): string[] {
    if (!this.manifest) return [];
    
    return Object.entries(this.manifest.textures)
      .filter(([_, spec]) => spec.type === type)
      .map(([id]) => id);
  }

  /**
   * Preload essential textures for better performance
   */
  async preloadEssentialTextures(): Promise<void> {
    const essentialTextures = [
      'hull-panel-small',
      'hull-panel-medium', 
      'engine-thruster-small',
      'cockpit-small'
    ];

    console.log('Preloading essential ship textures...');
    await this.loadTextures(essentialTextures);
    console.log('Essential ship textures loaded');
  }

  /**
   * Create a texture atlas for performance (future enhancement)
   */
  createTextureAtlas(): Promise<HTMLCanvasElement> {
    // This could be implemented later to combine multiple textures into a single atlas
    // for better rendering performance
    return Promise.reject(new Error('Texture atlas not yet implemented'));
  }

  /**
   * Release texture resources
   */
  releaseTexture(textureId: string): void {
    const resourceId = `ship-texture-${textureId}`;
    resourceManager.release(resourceId);
  }

  /**
   * Get texture manager statistics
   */
  getStats() {
    if (!this.manifest) {
      return {
        initialized: false,
        totalTextures: 0,
        loadedTextures: 0
      };
    }

    const textureIds = Object.keys(this.manifest.textures);
    const loadedCount = textureIds.filter(id => this.isTextureLoaded(id)).length;

    return {
      initialized: this.initialized,
      totalTextures: textureIds.length,
      loadedTextures: loadedCount,
      textureTypes: {
        hull: this.getTexturesByType('hull').length,
        engine: this.getTexturesByType('engine').length,
        weapon: this.getTexturesByType('weapon').length,
        cockpit: this.getTexturesByType('cockpit').length
      }
    };
  }
}

/**
 * Singleton instance of the ship texture manager
 */
export const shipTextureManager = new ShipTextureManager();