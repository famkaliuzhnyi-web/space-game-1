import { describe, test, expect } from 'vitest';
import { WorldManager } from '../systems/WorldManager';
import { createLayeredPosition, COORDINATE_LAYERS } from '../utils/coordinates';

describe('Unified Coordinate System Integration', () => {
  test('should assign correct Z layers to different object types', () => {
    // Test coordinate layer constants
    expect(COORDINATE_LAYERS.SHIPS).toBe(50);
    expect(COORDINATE_LAYERS.STATIONS).toBe(30);
    expect(COORDINATE_LAYERS.PLANETS).toBe(0);
    expect(COORDINATE_LAYERS.STARS).toBe(0);
  });

  test('should create layered positions correctly', () => {
    const shipPos = createLayeredPosition(100, 200, 'ship');
    expect(shipPos).toEqual({ x: 100, y: 200, z: 50 });

    const stationPos = createLayeredPosition(150, 250, 'station');
    expect(stationPos).toEqual({ x: 150, y: 250, z: 30 });

    const planetPos = createLayeredPosition(300, 400, 'planet');
    expect(planetPos).toEqual({ x: 300, y: 400, z: 0 });

    const starPos = createLayeredPosition(500, 600, 'star');
    expect(starPos).toEqual({ x: 500, y: 600, z: 0 });
  });

  test('should have planets at correct layer in world generation', () => {
    const worldManager = new WorldManager();
    
    // Access the galaxy to check planet coordinates
    const galaxy = (worldManager as any).galaxy;
    
    // Find a planet and verify its Z coordinate
    let planetFound = false;
    for (const sector of galaxy.sectors) {
      for (const system of sector.systems) {
        for (const planet of system.planets) {
          expect(planet.position.z).toBe(0); // Planets should be at layer 0
          planetFound = true;
          break;
        }
        if (planetFound) break;
      }
      if (planetFound) break;
    }
    
    expect(planetFound).toBe(true);
  });

  test('should have stations at correct layer in world generation', () => {
    const worldManager = new WorldManager();
    
    // Access the galaxy to check station coordinates
    const galaxy = (worldManager as any).galaxy;
    
    // Find a station and verify its Z coordinate
    let stationFound = false;
    for (const sector of galaxy.sectors) {
      for (const system of sector.systems) {
        for (const station of system.stations) {
          expect(station.position.z).toBe(30); // Stations should be at layer 30
          stationFound = true;
          break;
        }
        if (stationFound) break;
      }
      if (stationFound) break;
    }
    
    expect(stationFound).toBe(true);
  });

  test('should have star systems at correct layer', () => {
    const worldManager = new WorldManager();
    
    // Access the galaxy to check system coordinates
    const galaxy = (worldManager as any).galaxy;
    
    // Check a star system position
    const system = galaxy.sectors[0].systems[0];
    expect(system.position.z).toBe(0); // Star systems should be at layer 0 (same as stars)
  });

  test('should maintain coordinate consistency across layers', () => {
    // Test that objects at different layers can be properly compared in XY only
    const shipPos = createLayeredPosition(100, 200, 'ship');     // Z=50
    const stationPos = createLayeredPosition(100, 200, 'station'); // Z=30
    const planetPos = createLayeredPosition(100, 200, 'planet');   // Z=0
    
    // XY coordinates should be identical
    expect(shipPos.x).toBe(stationPos.x);
    expect(shipPos.y).toBe(stationPos.y);
    expect(stationPos.x).toBe(planetPos.x);
    expect(stationPos.y).toBe(planetPos.y);
    
    // But Z coordinates should differ
    expect(shipPos.z).toBe(50);
    expect(stationPos.z).toBe(30);
    expect(planetPos.z).toBe(0);
  });
});