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

/**
 * Normalize angle to [-π, π] range for consistent rotation calculations
 */
export function normalizeAngle(angle: number): number {
  // Use modulo and adjust to ensure result is in [-π, π]
  let normalized = ((angle % (2 * Math.PI)) + (2 * Math.PI)) % (2 * Math.PI);
  if (normalized > Math.PI) {
    normalized -= 2 * Math.PI;
  }
  return normalized;
}

/**
 * Calculate the shortest angular distance between two angles
 * Returns a value in [-π, π] representing the shortest rotation direction
 */
export function angleDifference(targetAngle: number, currentAngle: number): number {
  let diff = targetAngle - currentAngle;
  // Normalize the difference to [-π, π]
  while (diff > Math.PI) diff -= 2 * Math.PI;
  while (diff < -Math.PI) diff += 2 * Math.PI;
  return diff;
}

/**
 * Calculate angle from one position to another (for rotation towards target)
 */
export function angleToTarget(from: Vector3D, to: Vector3D): number {
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  return Math.atan2(dy, dx);
}

/**
 * Rotate angle towards target by maximum amount, returns normalized angle
 */
export function rotateTowards(currentAngle: number, targetAngle: number, maxChange: number): number {
  const diff = angleDifference(targetAngle, currentAngle);
  const change = Math.sign(diff) * Math.min(Math.abs(diff), maxChange);
  return normalizeAngle(currentAngle + change);
}

/**
 * Coordinate interpolation utilities for smooth movement and animations
 */
export function lerp2D(from: Vector3D, to: Vector3D, t: number): Vector3D {
  const clampedT = Math.max(0, Math.min(1, t));
  return {
    x: from.x + (to.x - from.x) * clampedT,
    y: from.y + (to.y - from.y) * clampedT,
    z: from.z // Preserve layer during interpolation
  };
}

/**
 * Smooth interpolation with easing for more natural movement
 */
export function smoothStep2D(from: Vector3D, to: Vector3D, t: number): Vector3D {
  const clampedT = Math.max(0, Math.min(1, t));
  // Smooth step function: 3t² - 2t³
  const smoothT = clampedT * clampedT * (3 - 2 * clampedT);
  return lerp2D(from, to, smoothT);
}

/**
 * Calculate movement vector with maximum distance constraint
 */
export function moveTowards2D(from: Vector3D, to: Vector3D, maxDistance: number): Vector3D {
  const distance = distance2D(from, to);
  if (distance <= maxDistance) {
    return { ...to, z: from.z }; // Preserve original layer
  }
  
  const direction = {
    x: (to.x - from.x) / distance,
    y: (to.y - from.y) / distance
  };
  
  return {
    x: from.x + direction.x * maxDistance,
    y: from.y + direction.y * maxDistance,
    z: from.z
  };
}

/**
 * Spatial partitioning system for efficient collision detection and queries
 */
export class SpatialGrid {
  private cellSize: number;
  private cells: Map<string, Vector3D[]> = new Map();
  
  constructor(cellSize: number = 100) {
    this.cellSize = cellSize;
  }
  
  private getCellKey(x: number, y: number): string {
    const cellX = Math.floor(x / this.cellSize);
    const cellY = Math.floor(y / this.cellSize);
    return `${cellX},${cellY}`;
  }
  
  /**
   * Add a position to the spatial grid
   */
  insert(position: Vector3D): void {
    const key = this.getCellKey(position.x, position.y);
    if (!this.cells.has(key)) {
      this.cells.set(key, []);
    }
    this.cells.get(key)!.push(position);
  }
  
  /**
   * Remove a position from the spatial grid
   */
  remove(position: Vector3D): void {
    const key = this.getCellKey(position.x, position.y);
    const cell = this.cells.get(key);
    if (cell) {
      const index = cell.findIndex(pos => 
        positionsEqual2D(pos, position, 0.01)
      );
      if (index !== -1) {
        cell.splice(index, 1);
        if (cell.length === 0) {
          this.cells.delete(key);
        }
      }
    }
  }
  
  /**
   * Find all positions within a radius (much faster than brute force)
   */
  findInRadius(center: Vector3D, radius: number): Vector3D[] {
    const results: Vector3D[] = [];
    
    // Calculate which cells to check
    const cellRadius = Math.ceil(radius / this.cellSize);
    const centerCellX = Math.floor(center.x / this.cellSize);
    const centerCellY = Math.floor(center.y / this.cellSize);
    
    for (let x = centerCellX - cellRadius; x <= centerCellX + cellRadius; x++) {
      for (let y = centerCellY - cellRadius; y <= centerCellY + cellRadius; y++) {
        const key = `${x},${y}`;
        const cell = this.cells.get(key);
        if (cell) {
          for (const pos of cell) {
            if (distance2D(center, pos) <= radius) {
              results.push(pos);
            }
          }
        }
      }
    }
    
    return results;
  }
  
  /**
   * Clear all positions from the grid
   */
  clear(): void {
    this.cells.clear();
  }
  
  /**
   * Get total number of positions in the grid
   */
  size(): number {
    return Array.from(this.cells.values()).reduce((sum, cell) => sum + cell.length, 0);
  }
}

/**
 * Coordinate region system for organizing game areas
 */
export interface CoordinateRegion {
  id: string;
  name: string;
  bounds: {
    min: Vector2D;
    max: Vector2D;
  };
  layer?: number; // Optional layer constraint
  metadata?: Record<string, unknown>;
}

export class RegionManager {
  private regions: Map<string, CoordinateRegion> = new Map();
  
  /**
   * Add a region to the manager
   */
  addRegion(region: CoordinateRegion): void {
    this.regions.set(region.id, region);
  }
  
  /**
   * Check if a coordinate is within a region
   */
  isInRegion(position: Vector3D, regionId: string): boolean {
    const region = this.regions.get(regionId);
    if (!region) return false;
    
    const inBounds = position.x >= region.bounds.min.x &&
                     position.x <= region.bounds.max.x &&
                     position.y >= region.bounds.min.y &&
                     position.y <= region.bounds.max.y;
    
    if (region.layer !== undefined) {
      return inBounds && position.z === region.layer;
    }
    
    return inBounds;
  }
  
  /**
   * Find all regions containing a coordinate
   */
  getRegionsAt(position: Vector3D): CoordinateRegion[] {
    return Array.from(this.regions.values()).filter(region => 
      this.isInRegion(position, region.id)
    );
  }
  
  /**
   * Get region by ID
   */
  getRegion(regionId: string): CoordinateRegion | undefined {
    return this.regions.get(regionId);
  }
}

/**
 * Coordinate caching system for frequently accessed positions
 */
export class CoordinateCache {
  private cache: Map<string, { coord: Vector3D; timestamp: number }> = new Map();
  private maxAge: number;
  
  constructor(maxAgeMs: number = 5000) {
    this.maxAge = maxAgeMs;
  }
  
  private generateKey(id: string, type: string): string {
    return `${type}:${id}`;
  }
  
  /**
   * Store a coordinate in the cache
   */
  set(id: string, type: string, coordinate: Vector3D): void {
    const key = this.generateKey(id, type);
    this.cache.set(key, {
      coord: { ...coordinate },
      timestamp: Date.now()
    });
  }
  
  /**
   * Retrieve a coordinate from the cache
   */
  get(id: string, type: string): Vector3D | null {
    const key = this.generateKey(id, type);
    const entry = this.cache.get(key);
    
    if (!entry) return null;
    
    // Check if entry is too old
    if (Date.now() - entry.timestamp > this.maxAge) {
      this.cache.delete(key);
      return null;
    }
    
    return { ...entry.coord };
  }
  
  /**
   * Clear expired entries
   */
  cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > this.maxAge) {
        this.cache.delete(key);
      }
    }
  }
  
  /**
   * Clear all cached coordinates
   */
  clear(): void {
    this.cache.clear();
  }
}

/**
 * Enhanced coordinate validation with detailed error reporting
 */
export function validateCoordinateDetailed(coords: Vector3D, context: string = ''): {
  isValid: boolean;
  errors: string[];
  warnings: string[];
} {
  const errors: string[] = [];
  const warnings: string[] = [];
  
  // Check for NaN values
  if (isNaN(coords.x)) errors.push(`X coordinate is NaN${context ? ` (${context})` : ''}`);
  if (isNaN(coords.y)) errors.push(`Y coordinate is NaN${context ? ` (${context})` : ''}`);
  if (isNaN(coords.z)) errors.push(`Z coordinate is NaN${context ? ` (${context})` : ''}`);
  
  // Check for infinity
  if (!isFinite(coords.x)) errors.push(`X coordinate is infinite${context ? ` (${context})` : ''}`);
  if (!isFinite(coords.y)) errors.push(`Y coordinate is infinite${context ? ` (${context})` : ''}`);
  if (!isFinite(coords.z)) errors.push(`Z coordinate is infinite${context ? ` (${context})` : ''}`);
  
  // Check bounds
  if (!isValidCoordinate(coords)) {
    warnings.push(`Coordinate is outside valid bounds${context ? ` (${context})` : ''}`);
  }
  
  // Check layer validity
  const validLayers = Object.values(COORDINATE_LAYERS) as number[];
  if (!validLayers.includes(coords.z) && coords.z !== 0) {
    warnings.push(`Z coordinate (${coords.z}) is not a standard layer${context ? ` (${context})` : ''}`);
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
}

/**
 * Grid snapping utilities for alignment
 */
export function snapToGrid(coordinate: Vector3D, gridSize: number): Vector3D {
  return {
    x: Math.round(coordinate.x / gridSize) * gridSize,
    y: Math.round(coordinate.y / gridSize) * gridSize,
    z: coordinate.z // Don't snap Z coordinate
  };
}

/**
 * Coordinate debugging utilities
 */
export class CoordinateDebugger {
  private static isEnabled: boolean = process.env.NODE_ENV === 'development';
  private static history: Map<string, Vector3D[]> = new Map();
  
  /**
   * Enable or disable debugging (useful for testing)
   */
  static setEnabled(enabled: boolean): void {
    this.isEnabled = enabled;
  }
  
  /**
   * Log coordinate changes for debugging
   */
  static trackPosition(id: string, coordinate: Vector3D, maxHistory: number = 10): void {
    if (!this.isEnabled) return;
    
    if (!this.history.has(id)) {
      this.history.set(id, []);
    }
    
    const history = this.history.get(id)!;
    history.push({ ...coordinate });
    
    // Keep only recent history
    if (history.length > maxHistory) {
      history.splice(0, history.length - maxHistory);
    }
  }
  
  /**
   * Get position history for an object
   */
  static getHistory(id: string): Vector3D[] {
    return this.history.get(id) || [];
  }
  
  /**
   * Log coordinate validation issues
   */
  static validateAndLog(coords: Vector3D, context: string): boolean {
    const validation = validateCoordinateDetailed(coords, context);
    
    if (validation.errors.length > 0) {
      console.error('Coordinate validation errors:', validation.errors);
    }
    
    if (validation.warnings.length > 0) {
      console.warn('Coordinate validation warnings:', validation.warnings);
    }
    
    return validation.isValid;
  }
  
  /**
   * Calculate and log movement statistics
   */
  static analyzeMovement(id: string): {
    totalDistance: number;
    averageSpeed: number;
    maxDistance: number;
    bounds: { min: Vector2D; max: Vector2D };
  } | null {
    const history = this.getHistory(id);
    if (history.length < 2) return null;
    
    let totalDistance = 0;
    let maxDistance = 0;
    
    for (let i = 1; i < history.length; i++) {
      const dist = distance2D(history[i - 1], history[i]);
      totalDistance += dist;
      maxDistance = Math.max(maxDistance, dist);
    }
    
    const bounds = calculateBoundingBox2D(history);
    const averageSpeed = totalDistance / (history.length - 1);
    
    const stats = {
      totalDistance,
      averageSpeed,
      maxDistance,
      bounds
    };
    
    if (this.isEnabled) {
      console.log(`Movement analysis for ${id}:`, stats);
    }
    
    return stats;
  }
  
  /**
   * Clear all debugging data
   */
  static clear(): void {
    this.history.clear();
  }
}