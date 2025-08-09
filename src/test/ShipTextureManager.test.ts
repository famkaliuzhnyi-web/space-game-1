/**
 * Ship Texture Manager Tests
 * 
 * Tests for the ship texture loading and management system
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ShipTextureManager } from '../engine/ShipTextureManager';
import { resourceManager } from '../engine/ResourceManager';

// Mock resource manager
vi.mock('../engine/ResourceManager', () => ({
  resourceManager: {
    register: vi.fn(),
    load: vi.fn(),
    get: vi.fn(),
    isLoaded: vi.fn(),
    release: vi.fn()
  }
}));

describe('ShipTextureManager', () => {
  let textureManager: ShipTextureManager;

  beforeEach(() => {
    textureManager = new ShipTextureManager();
    vi.clearAllMocks();
  });

  describe('Initialization', () => {
    it('should initialize successfully with valid manifest', async () => {
      const mockManifest = {
        version: '1.0.0',
        generated: new Date().toISOString(),
        textures: {
          'hull-panel-small': {
            width: 64,
            height: 64,
            type: 'hull' as const,
            description: 'Small hull panel'
          },
          'engine-thruster-small': {
            width: 32,
            height: 64,
            type: 'engine' as const,
            description: 'Small thruster'
          }
        },
        format: 'svg',
        description: 'Ship textures'
      };

      vi.mocked(resourceManager.load).mockResolvedValueOnce(mockManifest);

      await textureManager.initialize();

      expect(resourceManager.register).toHaveBeenCalled();
      expect(resourceManager.load).toHaveBeenCalledWith('ship-texture-manifest');
    });

    it('should handle initialization failure gracefully', async () => {
      vi.mocked(resourceManager.load).mockRejectedValueOnce(new Error('Network error'));

      await expect(textureManager.initialize()).rejects.toThrow('Network error');
    });
  });

  describe('Texture Loading', () => {
    beforeEach(async () => {
      const mockManifest = {
        version: '1.0.0',
        generated: new Date().toISOString(),
        textures: {
          'hull-panel-small': {
            width: 64,
            height: 64,
            type: 'hull' as const,
            description: 'Small hull panel'
          }
        },
        format: 'svg',
        description: 'Ship textures'
      };

      vi.mocked(resourceManager.load).mockResolvedValueOnce(mockManifest);
      await textureManager.initialize();
    });

    it('should load individual textures', async () => {
      const mockImage = new Image();
      vi.mocked(resourceManager.load).mockResolvedValueOnce(mockImage);

      const result = await textureManager.loadTexture('hull-panel-small');

      expect(result).toBe(mockImage);
      expect(resourceManager.load).toHaveBeenCalledWith('ship-texture-hull-panel-small');
    });

    it('should load multiple textures', async () => {
      const mockImage1 = new Image();
      const mockImage2 = new Image();
      
      vi.mocked(resourceManager.load)
        .mockResolvedValueOnce(mockImage1)
        .mockResolvedValueOnce(mockImage2);

      const results = await textureManager.loadTextures(['hull-panel-small', 'hull-panel-small']);

      expect(results).toHaveLength(2);
      expect(results[0]).toBe(mockImage1);
      expect(results[1]).toBe(mockImage2);
    });

    it('should handle texture loading failure', async () => {
      vi.mocked(resourceManager.load).mockRejectedValueOnce(new Error('Texture not found'));

      const result = await textureManager.loadTexture('nonexistent-texture');

      expect(result).toBeNull();
    });
  });

  describe('Synchronous Operations', () => {
    beforeEach(async () => {
      const mockManifest = {
        version: '1.0.0',
        generated: new Date().toISOString(),
        textures: {
          'hull-panel-small': {
            width: 64,
            height: 64,
            type: 'hull' as const,
            description: 'Small hull panel'
          },
          'engine-thruster-small': {
            width: 32,
            height: 64,
            type: 'engine' as const,
            description: 'Small thruster'
          }
        },
        format: 'svg',
        description: 'Ship textures'
      };

      vi.mocked(resourceManager.load).mockResolvedValueOnce(mockManifest);
      await textureManager.initialize();
    });

    it('should get loaded textures synchronously', () => {
      const mockImage = new Image();
      vi.mocked(resourceManager.get).mockReturnValueOnce(mockImage);

      const result = textureManager.getTexture('hull-panel-small');

      expect(result).toBe(mockImage);
    });

    it('should check if textures are loaded', () => {
      vi.mocked(resourceManager.isLoaded).mockReturnValueOnce(true);

      const result = textureManager.isTextureLoaded('hull-panel-small');

      expect(result).toBe(true);
    });

    it('should get texture specifications', () => {
      const spec = textureManager.getTextureSpec('hull-panel-small');

      expect(spec).toEqual({
        width: 64,
        height: 64,
        type: 'hull',
        description: 'Small hull panel'
      });
    });

    it('should get textures by type', () => {
      const hullTextures = textureManager.getTexturesByType('hull');
      const engineTextures = textureManager.getTexturesByType('engine');

      expect(hullTextures).toEqual(['hull-panel-small']);
      expect(engineTextures).toEqual(['engine-thruster-small']);
    });

    it('should get available textures', () => {
      const available = textureManager.getAvailableTextures();

      expect(available).toEqual(['hull-panel-small', 'engine-thruster-small']);
    });
  });

  describe('Statistics', () => {
    it('should provide statistics when not initialized', () => {
      const stats = textureManager.getStats();

      expect(stats.initialized).toBe(false);
      expect(stats.totalTextures).toBe(0);
    });

    it('should provide statistics when initialized', async () => {
      const mockManifest = {
        version: '1.0.0',
        generated: new Date().toISOString(),
        textures: {
          'hull-panel-small': {
            width: 64,
            height: 64,
            type: 'hull' as const,
            description: 'Small hull panel'
          },
          'engine-thruster-small': {
            width: 32,
            height: 64,
            type: 'engine' as const,
            description: 'Small thruster'
          }
        },
        format: 'svg',
        description: 'Ship textures'
      };

      vi.mocked(resourceManager.load).mockResolvedValueOnce(mockManifest);
      vi.mocked(resourceManager.isLoaded).mockReturnValue(false);

      await textureManager.initialize();
      
      const stats = textureManager.getStats();

      expect(stats.initialized).toBe(true);
      expect(stats.totalTextures).toBe(2);
      expect(stats.textureTypes.hull).toBe(1);
      expect(stats.textureTypes.engine).toBe(1);
      expect(stats.textureTypes.weapon).toBe(0);
      expect(stats.textureTypes.cockpit).toBe(0);
    });
  });
});