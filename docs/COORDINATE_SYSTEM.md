# Unified Coordinate System

This document describes the unified coordinate system implemented in the Space Game to provide consistent positioning, layering, and distance calculations across all game objects.

## Overview

The unified coordinate system uses a 3D coordinate space where:
- **X-Y Plane**: The 2D universe plane where all gameplay movement occurs
- **Z-Axis**: Represents visual layers for proper rendering depth
- **Camera**: Positioned at positive Z coordinate looking down at the X-Y plane

## Coordinate Layers

Different object types occupy different Z layers to ensure proper visual rendering:

| Object Type | Z Layer | Description |
|-------------|---------|-------------|
| Ships       | 50      | Player and NPC ships (closest to camera) |
| Stations     | 30      | Space stations and structures |
| Planets      | 0       | Planets and celestial bodies |
| Stars        | 0       | Stars and stellar objects |
| Camera       | 5000    | Camera position (far above all objects) |

## Core Types

### Vector3D
```typescript
interface Vector3D {
  x: number;  // Horizontal position
  y: number;  // Vertical position  
  z: number;  // Layer/depth
}
```

### Coordinates
```typescript
interface Coordinates extends Vector3D {
  // Unified coordinate system - all coordinates now have x, y, z
}
```

## Key Functions

### Distance Calculations

#### distance2D(pos1, pos2)
Calculates distance ignoring Z coordinate - **primary function for gameplay logic**:
- Collision detection
- Interaction range checking
- Movement calculations
- AI decision making

```typescript
// Ships at different layers can still interact
const ship = { x: 100, y: 200, z: 50 };
const station = { x: 100, y: 200, z: 30 };
const distance = distance2D(ship, station); // Returns 0 - same XY position
```

#### distance3D(pos1, pos2)
Calculates full 3D distance - **used for rendering and camera calculations**:
- Camera positioning
- 3D visual effects
- Depth sorting

### Position Comparison

#### positionsEqual2D(pos1, pos2, tolerance?)
Compares positions in XY plane only, ignoring Z coordinate:
```typescript
const ship = { x: 100, y: 200, z: 50 };
const station = { x: 100, y: 200, z: 30 };
const equal = positionsEqual2D(ship, station); // Returns true
```

### Layer Management

#### getLayerForObjectType(objectType)
Returns appropriate Z layer for object type:
```typescript
getLayerForObjectType('ship')     // Returns 50
getLayerForObjectType('station')  // Returns 30
getLayerForObjectType('planet')   // Returns 0
```

#### createLayeredPosition(x, y, objectType)
Creates 3D coordinates with correct layer:
```typescript
const shipPos = createLayeredPosition(100, 200, 'ship');
// Returns { x: 100, y: 200, z: 50 }
```

### Coordinate Conversion

#### to3D(coords2D, layer)
Converts 2D coordinates to 3D with specified layer:
```typescript
const coords2D = { x: 100, y: 200 };
const coords3D = to3D(coords2D, COORDINATE_LAYERS.SHIPS);
// Returns { x: 100, y: 200, z: 50 }
```

#### to2D(coords3D)
Extracts 2D coordinates from 3D (drops Z component):
```typescript
const coords3D = { x: 100, y: 200, z: 50 };
const coords2D = to2D(coords3D);
// Returns { x: 100, y: 200 }
```

## Integration Guidelines

### For Gameplay Systems

Use **2D distance calculations** for all gameplay logic:
```typescript
// Correct - ignores layers
const canInteract = distance2D(playerPos, stationPos) < interactionRange;

// Incorrect - would consider layer difference
const wrongDistance = distance3D(playerPos, stationPos);
```

### For Rendering Systems

Use actual Z coordinates for proper layering:
```typescript
// ThreeRenderer - uses actual Z from coordinate
mesh.position.set(obj.position.x, -obj.position.y, obj.position.z);

// 2D Renderer - can ignore Z or use for sorting
const sortedObjects = objects.sort((a, b) => b.position.z - a.position.z);
```

### For Movement and Physics

Movement occurs in XY plane only:
```typescript
// Ship movement - only affects X and Y
ship.location.coordinates = createLayeredPosition(newX, newY, 'ship');

// Velocity is always 2D
ship.velocity = { x: velocityX, y: velocityY };
```

## Migration from Old System

### Automatic Conversion
Legacy 2D coordinates are automatically converted:
```typescript
// Old format: { x: number, y: number }
// Automatically converted to: { x: number, y: number, z: appropriate_layer }
const converted = convertLegacyCoords(oldCoords, 'ship');
```

### Backward Compatibility
Systems can still work with XY coordinates:
- Distance calculations ignore Z by default
- Movement systems work in XY plane
- Rendering systems use Z for layering only

## Advanced Features

### Interpolation and Movement

#### lerp2D(from, to, t)
Linear interpolation between two coordinates:
```typescript
const from = { x: 0, y: 0, z: 50 };
const to = { x: 100, y: 200, z: 30 };
const midpoint = lerp2D(from, to, 0.5); // { x: 50, y: 100, z: 50 }
```

#### smoothStep2D(from, to, t)
Smooth interpolation with easing for natural movement:
```typescript
const position = smoothStep2D(startPos, endPos, progress);
// Uses smooth step function (3t² - 2t³) for easing
```

#### moveTowards2D(from, to, maxDistance)
Move towards target with maximum distance constraint:
```typescript
const newPos = moveTowards2D(shipPos, targetPos, maxSpeed * deltaTime);
```

### Performance Optimization

#### SpatialGrid
Efficient spatial partitioning for collision detection and proximity queries:
```typescript
const grid = new SpatialGrid(100); // 100 unit cell size

// Insert objects
grid.insert(shipPosition);
grid.insert(stationPosition);

// Find objects within radius (much faster than brute force)
const nearbyObjects = grid.findInRadius(playerPos, 200);
```

#### CoordinateCache
Cache frequently accessed coordinates with automatic expiration:
```typescript
const cache = new CoordinateCache(5000); // 5 second TTL

// Cache coordinates
cache.set('ship-1', 'ship', shipPosition);

// Retrieve (returns null if expired)
const cachedPos = cache.get('ship-1', 'ship');
```

### Region Management

#### RegionManager
Organize game areas into named regions with bounds checking:
```typescript
const regionManager = new RegionManager();

regionManager.addRegion({
  id: 'safe-zone',
  name: 'Safe Trading Zone',
  bounds: { min: { x: 0, y: 0 }, max: { x: 500, y: 500 } },
  layer: COORDINATE_LAYERS.SHIPS, // Optional layer constraint
  metadata: { securityLevel: 10 }
});

// Check if position is in region
const isInSafeZone = regionManager.isInRegion(shipPos, 'safe-zone');

// Find all regions at position
const regions = regionManager.getRegionsAt(shipPos);
```

### Development and Debugging Tools

#### Enhanced Validation
Detailed coordinate validation with specific error reporting:
```typescript
const validation = validateCoordinateDetailed(coordinate, 'player-ship');
if (!validation.isValid) {
  console.error('Coordinate errors:', validation.errors);
}
if (validation.warnings.length > 0) {
  console.warn('Coordinate warnings:', validation.warnings);
}
```

#### Grid Snapping
Align coordinates to a grid for consistent positioning:
```typescript
const snappedPos = snapToGrid(mousePosition, 10); // Snap to 10-unit grid
```

#### CoordinateDebugger
Development-time debugging utilities:
```typescript
// Track position changes (development mode only)
CoordinateDebugger.trackPosition('player', playerPosition);

// Analyze movement patterns
const stats = CoordinateDebugger.analyzeMovement('player');
console.log('Total distance traveled:', stats.totalDistance);

// Validate and log issues
CoordinateDebugger.validateAndLog(suspiciousCoordinate, 'NPC-AI');
```

## Best Practices

1. **Use distance2D() for gameplay**: All collision detection, interaction ranges, and AI decisions
2. **Use distance3D() for rendering**: Camera positioning and 3D effects only  
3. **Assign correct layers**: Use `createLayeredPosition()` or `getLayerForObjectType()`
4. **Movement in XY only**: Never modify Z coordinates during gameplay movement
5. **Layer consistency**: Objects of same type should use same Z layer
6. **Use SpatialGrid for performance**: When dealing with many objects and proximity queries
7. **Cache frequently accessed coordinates**: Use CoordinateCache for positions accessed multiple times per frame
8. **Validate coordinates in development**: Use CoordinateDebugger and validateCoordinateDetailed during development

## Performance Considerations

### Spatial Partitioning
For games with many objects, use SpatialGrid for O(1) proximity queries instead of O(n) brute force:
```typescript
// Slow: Check all objects
objects.forEach(obj => {
  if (distance2D(player.position, obj.position) < radius) {
    // Handle collision
  }
});

// Fast: Use spatial grid
const nearbyObjects = spatialGrid.findInRadius(player.position, radius);
nearbyObjects.forEach(obj => {
  // Handle collision - much fewer objects to check
});
```

### Coordinate Caching
Cache coordinates that don't change frequently:
```typescript
const cache = new CoordinateCache(1000); // 1 second cache

function getStationPosition(stationId: string): Vector3D {
  let pos = cache.get(stationId, 'station');
  if (!pos) {
    pos = calculateStationPosition(stationId); // Expensive calculation
    cache.set(stationId, 'station', pos);
  }
  return pos;
}
```

## Examples

### Ship-to-Station Docking
```typescript
// Check if ship is close enough to dock (XY distance only)
const ship = { x: 100, y: 200, z: 50 };
const station = { x: 102, y: 201, z: 30 };

if (distance2D(ship, station) < dockingRange) {
  // Ship can dock - layer difference doesn't matter
  dock(ship, station);
}
```

### Object Rendering
```typescript
// Objects render at their assigned layers
const objects = [
  { type: 'ship', position: { x: 100, y: 100, z: 50 } },    // Front layer
  { type: 'station', position: { x: 100, y: 100, z: 30 } }, // Middle layer  
  { type: 'planet', position: { x: 100, y: 100, z: 0 } }    // Back layer
];

// ThreeRenderer automatically uses Z for depth
objects.forEach(obj => {
  mesh.position.set(obj.position.x, obj.position.y, obj.position.z);
});
```

### Camera Positioning
```typescript
// Camera positioned far above all objects
const cameraPosition = {
  x: player.position.x,
  y: player.position.y, 
  z: COORDINATE_LAYERS.CAMERA // 5000 - far above all game objects
};
```

This unified system provides consistent, predictable coordinate handling while maintaining the visual layering required for proper game rendering.