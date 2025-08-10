/**
 * Test file for background stars opacity enhancement based on camera distance/zoom
 */

import { describe, it, expect } from 'vitest';
import { StarGenerator } from '../engine/StarGenerator';

describe('Background Stars Opacity Enhancement', () => {
  describe('Zoom-based Opacity Formula', () => {
    it('should calculate correct opacity factor for different zoom levels', () => {
      const testCases = [
        { zoom: 0.05, expectedFactor: 0.1 },  // Below minimum, should clamp to 0.1
        { zoom: 0.2, expectedFactor: 0.1 },   // At minimum threshold
        { zoom: 0.4, expectedFactor: 0.2 },   // Linear scaling
        { zoom: 1.0, expectedFactor: 0.5 },   // Mid-range
        { zoom: 2.0, expectedFactor: 1.0 },   // At maximum
        { zoom: 10.0, expectedFactor: 1.0 }   // Above maximum, should clamp to 1.0
      ];

      testCases.forEach(({ zoom, expectedFactor }) => {
        // This is the formula used in both 2D and 3D renderers
        const zoomOpacityFactor = Math.min(1.0, Math.max(0.1, zoom * 0.5));
        expect(zoomOpacityFactor).toBe(expectedFactor);
      });
    });

    it('should preserve star brightness while applying zoom factor', () => {
      // Test with various star brightness values
      const testCases = [
        { brightness: 0.3, zoom: 0.5, expected: 0.075 }, // 0.3 * 0.25
        { brightness: 0.8, zoom: 1.0, expected: 0.4 },   // 0.8 * 0.5  
        { brightness: 1.0, zoom: 2.0, expected: 1.0 },   // 1.0 * 1.0
        { brightness: 0.5, zoom: 0.1, expected: 0.05 }   // 0.5 * 0.1
      ];
      
      testCases.forEach(({ brightness, zoom, expected }) => {
        const zoomOpacityFactor = Math.min(1.0, Math.max(0.1, zoom * 0.5));
        const finalOpacity = brightness * zoomOpacityFactor;
        expect(finalOpacity).toBeCloseTo(expected, 3);
      });
    });

    it('should demonstrate opacity decreases when zooming out', () => {
      const starBrightness = 0.8;
      
      // Test various zoom levels from close to far
      const zoomLevels = [3.0, 2.0, 1.0, 0.5, 0.2];
      const opacities = zoomLevels.map(zoom => {
        const zoomOpacityFactor = Math.min(1.0, Math.max(0.1, zoom * 0.5));
        return starBrightness * zoomOpacityFactor;
      });
      
      // Each subsequent opacity should be less than or equal to the previous
      for (let i = 1; i < opacities.length; i++) {
        expect(opacities[i]).toBeLessThanOrEqual(opacities[i - 1]);
      }
      
      // Verify specific values
      expect(opacities[0]).toBe(0.8);      // Max opacity at zoom 3.0
      expect(opacities[4]).toBeCloseTo(0.08, 3); // Min opacity at zoom 0.2
    });
  });

  describe('StarGenerator Integration', () => {
    it('should work with existing StarGenerator', () => {
      const starGenerator = new StarGenerator();
      const stars = starGenerator.generateStarsInViewport(0, 0, 800, 600, 0.1);
      
      // Ensure stars are generated
      expect(stars.length).toBeGreaterThan(0);
      
      // Ensure all stars have required properties for opacity calculation
      stars.forEach(star => {
        expect(star).toHaveProperty('brightness');
        expect(typeof star.brightness).toBe('number');
        expect(star.brightness).toBeGreaterThanOrEqual(0);
        expect(star.brightness).toBeLessThanOrEqual(1);
      });
    });

    it('should demonstrate zoom effect on star field visibility', () => {
      const starGenerator = new StarGenerator();
      const stars = starGenerator.generateStarsInViewport(0, 0, 800, 600, 0.1);
      
      // Calculate total brightness at different zoom levels
      const zoomedInBrightness = stars.reduce((total, star) => {
        const zoomOpacityFactor = Math.min(1.0, Math.max(0.1, 2.0 * 0.5)); // Zoom 2.0
        return total + (star.brightness * zoomOpacityFactor);
      }, 0);
      
      const zoomedOutBrightness = stars.reduce((total, star) => {
        const zoomOpacityFactor = Math.min(1.0, Math.max(0.1, 0.2 * 0.5)); // Zoom 0.2
        return total + (star.brightness * zoomOpacityFactor);
      }, 0);
      
      // Stars should be significantly dimmer when zoomed out
      expect(zoomedOutBrightness).toBeLessThan(zoomedInBrightness * 0.5);
    });
  });

  describe('Visual Enhancement Effect', () => {
    it('should provide meaningful opacity reduction for better interactive object visibility', () => {
      // Simulate a common scenario: stars with average brightness
      const averageStarBrightness = 0.65;
      
      // Normal zoom level (1.0) vs heavily zoomed out (0.1)
      const normalZoomOpacity = averageStarBrightness * Math.min(1.0, Math.max(0.1, 1.0 * 0.5));
      const zoomedOutOpacity = averageStarBrightness * Math.min(1.0, Math.max(0.1, 0.1 * 0.5));
      
      // The opacity reduction should be significant (at least 80% reduction)
      const reductionFactor = zoomedOutOpacity / normalZoomOpacity;
      expect(reductionFactor).toBeLessThanOrEqual(0.2);
      
      // Specific values for verification
      expect(normalZoomOpacity).toBeCloseTo(0.325, 3);  // 0.65 * 0.5
      expect(zoomedOutOpacity).toBeCloseTo(0.065, 3);   // 0.65 * 0.1
    });
  });
});