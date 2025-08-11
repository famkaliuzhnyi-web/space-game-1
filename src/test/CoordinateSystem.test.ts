import { describe, test, expect, beforeEach, vi } from 'vitest';
import { 
  COORDINATE_LAYERS,
  to3D,
  to2D,
  distance2D,
  distance3D,
  positionsEqual2D,
  getLayerForObjectType,
  createLayeredPosition,
  normalizeCoordinates,
  isValidCoordinate,
  calculateBoundingBox2D,
  convertLegacyCoords,
  convertPlanetCoords,
  convertStationCoords,
  convertShipCoords,
  convertStarCoords,
  createSystemCoords,
  createShipCoords,
  lerp2D,
  smoothStep2D,
  moveTowards2D,
  SpatialGrid,
  RegionManager,
  CoordinateCache,
  validateCoordinateDetailed,
  snapToGrid,
  CoordinateDebugger
} from '../utils/coordinates';
import { Vector2D, Vector3D } from '../types';

describe('Unified Coordinate System', () => {
  describe('Layer Constants', () => {
    test('should have correct layer values', () => {
      expect(COORDINATE_LAYERS.SHIPS).toBe(50);
      expect(COORDINATE_LAYERS.STATIONS).toBe(30);
      expect(COORDINATE_LAYERS.PLANETS).toBe(0);
      expect(COORDINATE_LAYERS.STARS).toBe(0);
      expect(COORDINATE_LAYERS.CAMERA).toBe(5000);
    });
  });

  describe('Coordinate Conversion', () => {
    test('should convert 2D to 3D coordinates', () => {
      const coords2D: Vector2D = { x: 100, y: 200 };
      const coords3D = to3D(coords2D, 50);
      
      expect(coords3D).toEqual({ x: 100, y: 200, z: 50 });
    });

    test('should convert 3D to 2D coordinates', () => {
      const coords3D: Vector3D = { x: 100, y: 200, z: 50 };
      const coords2D = to2D(coords3D);
      
      expect(coords2D).toEqual({ x: 100, y: 200 });
    });

    test('should convert legacy coordinates with appropriate layer', () => {
      const legacyCoords = { x: 100, y: 200 };
      const shipCoords = convertLegacyCoords(legacyCoords, 'ship');
      const stationCoords = convertLegacyCoords(legacyCoords, 'station');
      
      expect(shipCoords).toEqual({ x: 100, y: 200, z: 50 });
      expect(stationCoords).toEqual({ x: 100, y: 200, z: 30 });
    });
  });

  describe('Type-Specific Coordinate Functions', () => {
    test('should convert planet coordinates to correct layer', () => {
      const coords = { x: 100, y: 200 };
      const result = convertPlanetCoords(coords);
      
      expect(result).toEqual({ x: 100, y: 200, z: COORDINATE_LAYERS.PLANETS });
      expect(result.z).toBe(0);
    });

    test('should convert station coordinates to correct layer', () => {
      const coords = { x: 150, y: 250 };
      const result = convertStationCoords(coords);
      
      expect(result).toEqual({ x: 150, y: 250, z: COORDINATE_LAYERS.STATIONS });
      expect(result.z).toBe(30);
    });

    test('should convert ship coordinates to correct layer', () => {
      const coords = { x: 75, y: 125 };
      const result = convertShipCoords(coords);
      
      expect(result).toEqual({ x: 75, y: 125, z: COORDINATE_LAYERS.SHIPS });
      expect(result.z).toBe(50);
    });

    test('should convert star coordinates to correct layer', () => {
      const coords = { x: 300, y: 400 };
      const result = convertStarCoords(coords);
      
      expect(result).toEqual({ x: 300, y: 400, z: COORDINATE_LAYERS.STARS });
      expect(result.z).toBe(0);
    });

    test('should create system coordinates with correct layer', () => {
      const result = createSystemCoords(500, 600);
      
      expect(result).toEqual({ x: 500, y: 600, z: COORDINATE_LAYERS.STARS });
      expect(result.z).toBe(0);
    });

    test('should create ship coordinates with correct layer', () => {
      const result = createShipCoords(25, 50);
      
      expect(result).toEqual({ x: 25, y: 50, z: COORDINATE_LAYERS.SHIPS });
      expect(result.z).toBe(50);
    });

    test('should maintain layer consistency between type-specific functions', () => {
      const coords = { x: 100, y: 200 };
      
      const legacyPlanet = convertLegacyCoords(coords, 'planet');
      const typedPlanet = convertPlanetCoords(coords);
      expect(legacyPlanet.z).toBe(typedPlanet.z);

      const legacyStation = convertLegacyCoords(coords, 'station');
      const typedStation = convertStationCoords(coords);
      expect(legacyStation.z).toBe(typedStation.z);

      const legacyShip = convertLegacyCoords(coords, 'ship');
      const typedShip = convertShipCoords(coords);
      expect(legacyShip.z).toBe(typedShip.z);
    });
  });

  describe('Distance Calculations', () => {
    test('should calculate 2D distance correctly', () => {
      const pos1: Vector3D = { x: 0, y: 0, z: 50 };
      const pos2: Vector3D = { x: 3, y: 4, z: 30 };
      const distance = distance2D(pos1, pos2);
      
      expect(distance).toBe(5); // 3-4-5 triangle
    });

    test('should calculate 3D distance correctly', () => {
      const pos1: Vector3D = { x: 0, y: 0, z: 0 };
      const pos2: Vector3D = { x: 1, y: 1, z: 1 };
      const distance = distance3D(pos1, pos2);
      
      expect(distance).toBeCloseTo(Math.sqrt(3));
    });

    test('should ignore Z coordinate in 2D distance', () => {
      const ship: Vector3D = { x: 0, y: 0, z: 50 };
      const station: Vector3D = { x: 0, y: 0, z: 30 };
      const distance = distance2D(ship, station);
      
      expect(distance).toBe(0); // Same XY position, different layers
    });
  });

  describe('Position Comparison', () => {
    test('should compare positions in XY plane only', () => {
      const ship: Vector3D = { x: 100, y: 200, z: 50 };
      const station: Vector3D = { x: 100, y: 200, z: 30 };
      
      expect(positionsEqual2D(ship, station)).toBe(true);
    });

    test('should respect tolerance in comparison', () => {
      const pos1: Vector3D = { x: 100, y: 200, z: 50 };
      const pos2: Vector3D = { x: 100.05, y: 200.05, z: 30 };
      
      expect(positionsEqual2D(pos1, pos2, 0.1)).toBe(true);
      expect(positionsEqual2D(pos1, pos2, 0.01)).toBe(false);
    });
  });

  describe('Layer Assignment', () => {
    test('should assign correct layers for object types', () => {
      expect(getLayerForObjectType('ship')).toBe(50);
      expect(getLayerForObjectType('npc-ship')).toBe(50);
      expect(getLayerForObjectType('station')).toBe(30);
      expect(getLayerForObjectType('planet')).toBe(0);
      expect(getLayerForObjectType('star')).toBe(0);
      expect(getLayerForObjectType('unknown')).toBe(30); // Default to station layer
    });

    test('should create layered positions correctly', () => {
      const shipPos = createLayeredPosition(100, 200, 'ship');
      const stationPos = createLayeredPosition(150, 250, 'station');
      const planetPos = createLayeredPosition(300, 400, 'planet');
      
      expect(shipPos).toEqual({ x: 100, y: 200, z: 50 });
      expect(stationPos).toEqual({ x: 150, y: 250, z: 30 });
      expect(planetPos).toEqual({ x: 300, y: 400, z: 0 });
    });
  });

  describe('Coordinate Validation', () => {
    test('should normalize coordinates to 3 decimal places', () => {
      const coords: Vector3D = { x: 100.123456, y: 200.987654, z: 50.555555 };
      const normalized = normalizeCoordinates(coords);
      
      expect(normalized).toEqual({ x: 100.123, y: 200.988, z: 50.556 });
    });

    test('should validate coordinate bounds', () => {
      const validCoords: Vector3D = { x: 1000, y: 2000, z: 50 };
      const invalidCoords: Vector3D = { x: 2000000, y: 200, z: 50 };
      
      expect(isValidCoordinate(validCoords)).toBe(true);
      expect(isValidCoordinate(invalidCoords)).toBe(false);
    });
  });

  describe('Bounding Box Calculation', () => {
    test('should calculate bounding box for multiple positions', () => {
      const positions: Vector3D[] = [
        { x: 0, y: 0, z: 50 },
        { x: 100, y: 200, z: 30 },
        { x: -50, y: 150, z: 0 }
      ];
      
      const bbox = calculateBoundingBox2D(positions);
      
      expect(bbox.min).toEqual({ x: -50, y: 0 });
      expect(bbox.max).toEqual({ x: 100, y: 200 });
      expect(bbox.center).toEqual({ x: 25, y: 100 });
    });

    test('should handle empty position array', () => {
      const bbox = calculateBoundingBox2D([]);
      
      expect(bbox.min).toEqual({ x: 0, y: 0 });
      expect(bbox.max).toEqual({ x: 0, y: 0 });
      expect(bbox.center).toEqual({ x: 0, y: 0 });
    });
  });

  describe('Game Integration', () => {
    test('should maintain layering for collision detection', () => {
      // Ships can collide with each other (same layer)
      const ship1 = createLayeredPosition(100, 100, 'ship');
      const ship2 = createLayeredPosition(105, 105, 'ship');
      
      // Ships and stations should interact despite different layers
      const station = createLayeredPosition(100, 100, 'station');
      
      expect(distance2D(ship1, ship2)).toBeLessThan(10);
      expect(distance2D(ship1, station)).toBe(0); // Same XY position
      expect(ship1.z).not.toBe(station.z); // Different layers
    });

    test('should work with camera positioning', () => {
      const ship = createLayeredPosition(100, 200, 'ship');
      const cameraZ = COORDINATE_LAYERS.CAMERA;
      
      // Camera should be far above all game objects
      expect(cameraZ).toBeGreaterThan(ship.z);
      expect(cameraZ).toBeGreaterThan(COORDINATE_LAYERS.STATIONS);
      expect(cameraZ).toBeGreaterThan(COORDINATE_LAYERS.PLANETS);
    });
  });

  describe('Interpolation and Movement', () => {
    test('should interpolate between two coordinates', () => {
      const from: Vector3D = { x: 0, y: 0, z: 50 };
      const to: Vector3D = { x: 100, y: 200, z: 30 };
      
      const midpoint = lerp2D(from, to, 0.5);
      expect(midpoint).toEqual({ x: 50, y: 100, z: 50 }); // Preserves original layer
      
      const start = lerp2D(from, to, 0);
      expect(start).toEqual(from);
      
      const end = lerp2D(from, to, 1);
      expect(end).toEqual({ x: 100, y: 200, z: 50 }); // Preserves original layer
    });

    test('should handle smooth interpolation with easing', () => {
      const from: Vector3D = { x: 0, y: 0, z: 50 };
      const to: Vector3D = { x: 100, y: 100, z: 30 };
      
      const quarter = smoothStep2D(from, to, 0.25);
      const half = smoothStep2D(from, to, 0.5);
      
      // Should be different from linear interpolation due to easing
      expect(quarter.x).toBeLessThan(25); // Less than linear at 0.25
      expect(half.x).toBe(50); // Same as linear at 0.5
    });

    test('should move towards target with distance constraint', () => {
      const from: Vector3D = { x: 0, y: 0, z: 50 };
      const to: Vector3D = { x: 100, y: 0, z: 30 };
      
      const moved = moveTowards2D(from, to, 50);
      expect(moved).toEqual({ x: 50, y: 0, z: 50 });
      
      // If already within range, should reach target
      const close = moveTowards2D(from, { x: 10, y: 0, z: 30 }, 50);
      expect(close).toEqual({ x: 10, y: 0, z: 50 });
    });
  });

  describe('Spatial Grid System', () => {
    let spatialGrid: SpatialGrid;

    beforeEach(() => {
      spatialGrid = new SpatialGrid(100);
    });

    test('should insert and find positions', () => {
      const pos1: Vector3D = { x: 50, y: 50, z: 50 };
      const pos2: Vector3D = { x: 150, y: 150, z: 30 };
      const pos3: Vector3D = { x: 250, y: 250, z: 0 };
      
      spatialGrid.insert(pos1);
      spatialGrid.insert(pos2);
      spatialGrid.insert(pos3);
      
      expect(spatialGrid.size()).toBe(3);
      
      // Find positions near pos1
      const nearby = spatialGrid.findInRadius(pos1, 100);
      expect(nearby).toContain(pos1);
      expect(nearby).not.toContain(pos3); // Too far away
    });

    test('should efficiently find objects in radius', () => {
      const positions: Vector3D[] = [];
      
      // Create a grid of positions
      for (let x = 0; x < 1000; x += 100) {
        for (let y = 0; y < 1000; y += 100) {
          const pos = { x, y, z: 50 };
          positions.push(pos);
          spatialGrid.insert(pos);
        }
      }
      
      const center = { x: 500, y: 500, z: 50 };
      const nearby = spatialGrid.findInRadius(center, 150);
      
      // Should find positions within 150 units
      expect(nearby.length).toBeGreaterThan(0);
      expect(nearby.length).toBeLessThan(positions.length); // Should be selective
    });

    test('should remove positions correctly', () => {
      const pos: Vector3D = { x: 50, y: 50, z: 50 };
      
      spatialGrid.insert(pos);
      expect(spatialGrid.size()).toBe(1);
      
      spatialGrid.remove(pos);
      expect(spatialGrid.size()).toBe(0);
    });
  });

  describe('Region Management', () => {
    let regionManager: RegionManager;

    beforeEach(() => {
      regionManager = new RegionManager();
    });

    test('should manage coordinate regions', () => {
      const region = {
        id: 'test-zone',
        name: 'Test Zone',
        bounds: {
          min: { x: 0, y: 0 },
          max: { x: 100, y: 100 }
        }
      };
      
      regionManager.addRegion(region);
      
      const insidePos: Vector3D = { x: 50, y: 50, z: 50 };
      const outsidePos: Vector3D = { x: 150, y: 150, z: 50 };
      
      expect(regionManager.isInRegion(insidePos, 'test-zone')).toBe(true);
      expect(regionManager.isInRegion(outsidePos, 'test-zone')).toBe(false);
    });

    test('should handle layer-specific regions', () => {
      const shipRegion = {
        id: 'ship-zone',
        name: 'Ship Zone',
        bounds: {
          min: { x: 0, y: 0 },
          max: { x: 100, y: 100 }
        },
        layer: COORDINATE_LAYERS.SHIPS
      };
      
      regionManager.addRegion(shipRegion);
      
      const shipPos: Vector3D = { x: 50, y: 50, z: 50 };
      const stationPos: Vector3D = { x: 50, y: 50, z: 30 };
      
      expect(regionManager.isInRegion(shipPos, 'ship-zone')).toBe(true);
      expect(regionManager.isInRegion(stationPos, 'ship-zone')).toBe(false); // Wrong layer
    });

    test('should find multiple regions at position', () => {
      regionManager.addRegion({
        id: 'region1',
        name: 'Region 1',
        bounds: { min: { x: 0, y: 0 }, max: { x: 100, y: 100 } }
      });
      
      regionManager.addRegion({
        id: 'region2',
        name: 'Region 2',
        bounds: { min: { x: 50, y: 50 }, max: { x: 150, y: 150 } }
      });
      
      const pos: Vector3D = { x: 75, y: 75, z: 50 };
      const regions = regionManager.getRegionsAt(pos);
      
      expect(regions).toHaveLength(2);
      expect(regions.map(r => r.id)).toContain('region1');
      expect(regions.map(r => r.id)).toContain('region2');
    });
  });

  describe('Coordinate Caching', () => {
    let cache: CoordinateCache;

    beforeEach(() => {
      cache = new CoordinateCache(1000); // 1 second TTL
      vi.useFakeTimers();
    });

    test('should cache and retrieve coordinates', () => {
      const coord: Vector3D = { x: 100, y: 200, z: 50 };
      
      cache.set('ship-1', 'ship', coord);
      const retrieved = cache.get('ship-1', 'ship');
      
      expect(retrieved).toEqual(coord);
      expect(retrieved).not.toBe(coord); // Should be a copy
    });

    test('should expire cached coordinates', () => {
      const coord: Vector3D = { x: 100, y: 200, z: 50 };
      
      cache.set('ship-1', 'ship', coord);
      
      // Fast forward time to expire cache
      vi.advanceTimersByTime(2000);
      
      const retrieved = cache.get('ship-1', 'ship');
      expect(retrieved).toBe(null);
    });

    test('should clean up expired entries', () => {
      const coord: Vector3D = { x: 100, y: 200, z: 50 };
      
      cache.set('ship-1', 'ship', coord);
      cache.set('ship-2', 'ship', coord);
      
      // Fast forward to expire first entry
      vi.advanceTimersByTime(500);
      cache.set('ship-3', 'ship', coord); // This should still be fresh
      vi.advanceTimersByTime(600); // Now ship-1 and ship-2 are expired
      
      cache.cleanup();
      
      expect(cache.get('ship-1', 'ship')).toBe(null);
      expect(cache.get('ship-2', 'ship')).toBe(null);
      expect(cache.get('ship-3', 'ship')).toEqual(coord);
    });
  });

  describe('Enhanced Validation and Debugging', () => {
    test('should provide detailed coordinate validation', () => {
      const validCoord: Vector3D = { x: 100, y: 200, z: 50 };
      const invalidCoord: Vector3D = { x: NaN, y: Infinity, z: 50 };
      
      const validResult = validateCoordinateDetailed(validCoord, 'test-ship');
      expect(validResult.isValid).toBe(true);
      expect(validResult.errors).toHaveLength(0);
      
      const invalidResult = validateCoordinateDetailed(invalidCoord, 'broken-ship');
      expect(invalidResult.isValid).toBe(false);
      expect(invalidResult.errors.length).toBeGreaterThan(0);
      expect(invalidResult.errors[0]).toContain('NaN');
      expect(invalidResult.errors[1]).toContain('infinite');
    });

    test('should snap coordinates to grid', () => {
      const coord: Vector3D = { x: 123.7, y: 456.2, z: 50 };
      const snapped = snapToGrid(coord, 10);
      
      expect(snapped).toEqual({ x: 120, y: 460, z: 50 });
    });

    test('should track coordinate history in debug mode', () => {
      const debugSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      
      // Clear any existing history first and enable debugging for test
      CoordinateDebugger.clear();
      CoordinateDebugger.setEnabled(true);
      
      const coord1: Vector3D = { x: 0, y: 0, z: 50 };
      const coord2: Vector3D = { x: 10, y: 10, z: 50 };
      const coord3: Vector3D = { x: 20, y: 20, z: 50 };
      
      CoordinateDebugger.trackPosition('ship-1', coord1);
      CoordinateDebugger.trackPosition('ship-1', coord2);
      CoordinateDebugger.trackPosition('ship-1', coord3);
      
      const history = CoordinateDebugger.getHistory('ship-1');
      expect(history).toHaveLength(3);
      expect(history).toEqual([coord1, coord2, coord3]);
      
      const stats = CoordinateDebugger.analyzeMovement('ship-1');
      expect(stats).toBeTruthy();
      expect(stats!.totalDistance).toBeCloseTo(28.28); // sqrt(200) + sqrt(200)
      
      debugSpy.mockRestore();
    });

    test('should validate coordinates and log issues', () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      
      const badCoord: Vector3D = { x: NaN, y: 100, z: 50 };
      const isValid = CoordinateDebugger.validateAndLog(badCoord, 'test-context');
      
      expect(isValid).toBe(false);
      expect(consoleSpy).toHaveBeenCalled();
      
      consoleSpy.mockRestore();
    });
  });
});