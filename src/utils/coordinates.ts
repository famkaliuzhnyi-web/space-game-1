import { Vector2D, Vector3D } from '../types';

/**
 * Unified coordinate system layer definitions
 * The 2D universe plane is X-Y. All bodies rotate around Z axis.
 * Camera is "top-down" looking at X-Y space from positive Z coordinate.
 */

// Layer constants for different object types
export const COORDINATE_LAYERS = {
  SHIPS: 50,      // Ships fly closest to camera
  STATIONS: 30,   // Stations are behind ships
  PLANETS: 0,     // Planets and stars are furthest back
  STARS: 0,       // Same layer as planets
  CAMERA: 5000,   // Camera position (far above all objects)
} as const;

/**
 * Convert 2D coordinates to 3D coordinates with specified Z layer
 */
export function to3D(coords: Vector2D, layer: number): Vector3D {
  return {
    x: coords.x,
    y: coords.y,
    z: layer
  };
}

/**
 * Convert legacy coordinate object to 3D with appropriate layer
 */
export function convertLegacyCoords(coords: { x: number; y: number }, objectType: string): Vector3D {
  return {
    x: coords.x,
    y: coords.y,
    z: getLayerForObjectType(objectType)
  };
}

/**
 * Convert 3D coordinates to 2D coordinates (drops Z component)
 */
export function to2D(coords: Vector3D): Vector2D {
  return {
    x: coords.x,
    y: coords.y
  };
}

/**
 * Calculate 2D distance between two objects (ignores Z coordinate)
 * This is the primary distance function for gameplay logic
 */
export function distance2D(pos1: Vector3D, pos2: Vector3D): number {
  const dx = pos1.x - pos2.x;
  const dy = pos1.y - pos2.y;
  return Math.sqrt(dx * dx + dy * dy);
}

/**
 * Calculate 3D distance between two objects (includes Z coordinate)
 * This is mainly for rendering and camera calculations
 */
export function distance3D(pos1: Vector3D, pos2: Vector3D): number {
  const dx = pos1.x - pos2.x;
  const dy = pos1.y - pos2.y;
  const dz = pos1.z - pos2.z;
  return Math.sqrt(dx * dx + dy * dy + dz * dz);
}

/**
 * Compare positions for objects from different layers (XY-only comparison)
 * Returns true if positions are within tolerance in the XY plane
 */
export function positionsEqual2D(pos1: Vector3D, pos2: Vector3D, tolerance: number = 0.1): boolean {
  return distance2D(pos1, pos2) <= tolerance;
}

/**
 * Get the appropriate Z layer for an object type
 */
export function getLayerForObjectType(objectType: string): number {
  switch (objectType) {
    case 'ship':
    case 'npc-ship':
      return COORDINATE_LAYERS.SHIPS;
    case 'station':
      return COORDINATE_LAYERS.STATIONS;
    case 'planet':
      return COORDINATE_LAYERS.PLANETS;
    case 'star':
      return COORDINATE_LAYERS.STARS;
    default:
      // Unknown objects go to station layer by default
      return COORDINATE_LAYERS.STATIONS;
  }
}

/**
 * Create a 3D position with the appropriate layer for object type
 */
export function createLayeredPosition(x: number, y: number, objectType: string): Vector3D {
  return {
    x,
    y,
    z: getLayerForObjectType(objectType)
  };
}

/**
 * Normalize coordinates to ensure consistent formatting
 */
export function normalizeCoordinates(coords: Vector3D): Vector3D {
  return {
    x: Math.round(coords.x * 1000) / 1000, // Round to 3 decimal places
    y: Math.round(coords.y * 1000) / 1000,
    z: Math.round(coords.z * 1000) / 1000
  };
}

/**
 * Check if a coordinate is within the valid game bounds
 * The game world has reasonable limits to prevent infinite coordinates
 */
export function isValidCoordinate(coords: Vector3D): boolean {
  const MAX_COORDINATE = 1000000; // 1 million units max
  const MIN_COORDINATE = -1000000;
  
  return (
    coords.x >= MIN_COORDINATE && coords.x <= MAX_COORDINATE &&
    coords.y >= MIN_COORDINATE && coords.y <= MAX_COORDINATE &&
    coords.z >= MIN_COORDINATE && coords.z <= MAX_COORDINATE
  );
}

/**
 * Calculate the XY-only bounding box for a set of objects
 * Useful for camera positioning and viewport calculations
 */
export function calculateBoundingBox2D(positions: Vector3D[]): {
  min: Vector2D;
  max: Vector2D;
  center: Vector2D;
} {
  if (positions.length === 0) {
    return {
      min: { x: 0, y: 0 },
      max: { x: 0, y: 0 },
      center: { x: 0, y: 0 }
    };
  }

  let minX = positions[0].x;
  let maxX = positions[0].x;
  let minY = positions[0].y;
  let maxY = positions[0].y;

  for (const pos of positions) {
    minX = Math.min(minX, pos.x);
    maxX = Math.max(maxX, pos.x);
    minY = Math.min(minY, pos.y);
    maxY = Math.max(maxY, pos.y);
  }

  return {
    min: { x: minX, y: minY },
    max: { x: maxX, y: maxY },
    center: { x: (minX + maxX) / 2, y: (minY + maxY) / 2 }
  };
}