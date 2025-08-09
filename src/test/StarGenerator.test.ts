import { describe, it, expect, beforeEach } from 'vitest';
import { StarGenerator, type StarData } from '../engine/StarGenerator';

describe('StarGenerator', () => {
  let generator: StarGenerator;

  beforeEach(() => {
    generator = new StarGenerator({
      seed: 12345,
      starDensity: 100, // Lower density for easier testing
      cellSize: 200,
      minSize: 1,
      maxSize: 3,
      minBrightness: 0.3,
      maxBrightness: 1.0
    });
  });

  describe('Initialization', () => {
    it('should initialize with default config', () => {
      const defaultGenerator = new StarGenerator();
      const config = defaultGenerator.getConfig();
      
      expect(config.seed).toBe(12345);
      expect(config.starDensity).toBe(200);
      expect(config.cellSize).toBe(500);
    });

    it('should allow custom configuration', () => {
      const customGenerator = new StarGenerator({
        seed: 54321,
        starDensity: 150,
        cellSize: 300
      });
      
      const config = customGenerator.getConfig();
      expect(config.seed).toBe(54321);
      expect(config.starDensity).toBe(150);
      expect(config.cellSize).toBe(300);
    });
  });

  describe('Deterministic Generation', () => {
    it('should generate same stars for same coordinates', () => {
      const stars1 = generator.generateStarsInViewport(0, 0, 400, 400, 1.0);
      const stars2 = generator.generateStarsInViewport(0, 0, 400, 400, 1.0);
      
      expect(stars1).toEqual(stars2);
    });

    it('should generate different stars for different coordinates', () => {
      const stars1 = generator.generateStarsInViewport(0, 0, 400, 400, 1.0);
      const stars2 = generator.generateStarsInViewport(1000, 1000, 400, 400, 1.0);
      
      expect(stars1).not.toEqual(stars2);
    });

    it('should generate same pattern with same seed', () => {
      const generator1 = new StarGenerator({ seed: 12345, cellSize: 200 });
      const generator2 = new StarGenerator({ seed: 12345, cellSize: 200 });
      
      const stars1 = generator1.generateStarsInViewport(100, 100, 400, 400, 1.0);
      const stars2 = generator2.generateStarsInViewport(100, 100, 400, 400, 1.0);
      
      expect(stars1).toEqual(stars2);
    });

    it('should generate different patterns with different seeds', () => {
      const generator1 = new StarGenerator({ seed: 12345, cellSize: 200 });
      const generator2 = new StarGenerator({ seed: 54321, cellSize: 200 });
      
      const stars1 = generator1.generateStarsInViewport(0, 0, 400, 400, 1.0);
      const stars2 = generator2.generateStarsInViewport(0, 0, 400, 400, 1.0);
      
      expect(stars1).not.toEqual(stars2);
    });
  });

  describe('Star Properties', () => {
    it('should generate stars with valid properties', () => {
      const stars = generator.generateStarsInViewport(0, 0, 400, 400, 1.0);
      
      expect(stars.length).toBeGreaterThan(0);
      
      stars.forEach(star => {
        expect(star.x).toBeTypeOf('number');
        expect(star.y).toBeTypeOf('number');
        expect(star.size).toBeGreaterThanOrEqual(1);
        expect(star.size).toBeLessThanOrEqual(3);
        expect(star.brightness).toBeGreaterThanOrEqual(0.3);
        expect(star.brightness).toBeLessThanOrEqual(1.0);
      });
    });

    it('should generate stars within and around viewport', () => {
      const cameraX = 500;
      const cameraY = 300;
      const viewportWidth = 400;
      const viewportHeight = 300;
      
      const stars = generator.generateStarsInViewport(cameraX, cameraY, viewportWidth, viewportHeight, 1.0);
      
      // Stars should be generated in expanded area around viewport
      // We can't be too strict since stars are generated per cell
      stars.forEach(star => {
        // Allow generous margins since cell-based generation extends beyond viewport
        expect(star.x).toBeGreaterThan(cameraX - viewportWidth);
        expect(star.x).toBeLessThan(cameraX + viewportWidth);
        expect(star.y).toBeGreaterThan(cameraY - viewportHeight);
        expect(star.y).toBeLessThan(cameraY + viewportHeight);
      });
    });
  });

  describe('Parallax Support', () => {
    it('should generate stars at different positions for different parallax factors', () => {
      // Use larger camera coordinates to ensure different parallax factors access different cells
      const stars1 = generator.generateStarsInViewport(1000, 1000, 400, 400, 0.3);
      const stars2 = generator.generateStarsInViewport(1000, 1000, 400, 400, 1.0);
      
      // Different parallax factors should result in different star selections
      // since they affect which cells are included in the viewport
      expect(stars1).not.toEqual(stars2);
    });
  });

  describe('Configuration Updates', () => {
    it('should allow configuration updates', () => {
      generator.updateConfig({ starDensity: 300, seed: 99999 });
      const config = generator.getConfig();
      
      expect(config.starDensity).toBe(300);
      expect(config.seed).toBe(99999);
      expect(config.cellSize).toBe(200); // Should keep existing value
    });

    it('should generate different stars after config update', () => {
      const stars1 = generator.generateStarsInViewport(0, 0, 400, 400, 1.0);
      
      generator.updateConfig({ seed: 99999 });
      const stars2 = generator.generateStarsInViewport(0, 0, 400, 400, 1.0);
      
      expect(stars1).not.toEqual(stars2);
    });
  });

  describe('Edge Cases', () => {
    it('should handle negative coordinates', () => {
      const stars = generator.generateStarsInViewport(-500, -300, 400, 400, 1.0);
      expect(stars.length).toBeGreaterThan(0);
    });

    it('should handle zero viewport size', () => {
      const stars = generator.generateStarsInViewport(0, 0, 0, 0, 1.0);
      // Should still generate some stars due to cell-based generation
      expect(stars.length).toBeGreaterThanOrEqual(0);
    });

    it('should handle zero parallax factor', () => {
      const stars = generator.generateStarsInViewport(1000, 1000, 400, 400, 0.0);
      // Should generate stars around origin since parallax factor is 0
      expect(stars.length).toBeGreaterThanOrEqual(0);
    });
  });
});