import { Vector2D, Vector3D } from '../types';
import { createLayeredPosition, to2D } from './coordinates';

/**
 * Universal Navigation System
 * 
 * This module provides standardized navigation mechanics that all actors
 * (player ships, NPCs, planets) can use for consistent positioning and rotation.
 * 
 * Key improvements:
 * - Fixed arrival radius issues for precise positioning
 * - Improved angle normalization handling edge cases
 * - Enhanced large movement handling
 * - Consistent movement physics across all actor types
 */

/**
 * Enhanced angle normalization that properly handles the ±π edge case
 */
export function normalizeAngleUniversal(angle: number): number {
  // Normalize to [0, 2π) first
  let normalized = ((angle % (2 * Math.PI)) + (2 * Math.PI)) % (2 * Math.PI);
  
  // Convert to [-π, π] range
  if (normalized > Math.PI) {
    normalized -= 2 * Math.PI;
  }
  
  // Handle the special case where π and -π are equivalent
  // Always prefer -π over π for consistency
  if (Math.abs(normalized - Math.PI) < 1e-10) {
    normalized = -Math.PI;
  }
  
  return normalized;
}

/**
 * Enhanced angular difference calculation with better wrap-around handling
 */
export function angleDifferenceUniversal(targetAngle: number, currentAngle: number): number {
  let diff = normalizeAngleUniversal(targetAngle) - normalizeAngleUniversal(currentAngle);
  
  // Ensure we take the shortest path
  if (diff > Math.PI) {
    diff -= 2 * Math.PI;
  } else if (diff < -Math.PI) {
    diff += 2 * Math.PI;
  }
  
  return diff;
}

/**
 * Enhanced rotate towards target with improved precision
 */
export function rotateTowardsUniversal(currentAngle: number, targetAngle: number, maxChange: number): number {
  const diff = angleDifferenceUniversal(targetAngle, currentAngle);
  const change = Math.sign(diff) * Math.min(Math.abs(diff), maxChange);
  return normalizeAngleUniversal(currentAngle + change);
}

/**
 * Enhanced movement physics configuration
 */
export interface UniversalMovementConfig {
  // Arrival radius - smaller for more precise positioning
  arrivalRadius: number;
  
  // Minimum movement distance - prevents infinite tiny movements
  minMovementDistance: number;
  
  // Maximum movement distance per update - prevents overshooting
  maxMovementPerUpdate: number;
  
  // Speed and acceleration settings
  baseSpeed: number;
  acceleration: number;
  
  // Turn rate for rotation
  turnSpeed: number;
}

/**
 * Default movement configuration optimized for precision
 */
export const DEFAULT_MOVEMENT_CONFIG: UniversalMovementConfig = {
  arrivalRadius: 2.0,          // Reduced from 5 for better precision
  minMovementDistance: 0.01,   // Minimum distance to consider movement
  maxMovementPerUpdate: 50.0,  // Prevent huge jumps in single update
  baseSpeed: 100,              // Base movement speed
  acceleration: 200,           // Reach max speed in 0.5 seconds
  turnSpeed: 15.0              // Radians per second
};

/**
 * Universal movement state that all actors can use
 */
export interface UniversalMovementState {
  isMoving: boolean;
  targetPosition: Vector3D | null;
  currentVelocity: Vector2D;
  config: UniversalMovementConfig;
  
  // State tracking
  lastUpdateTime: number;
  totalDistance: number;
  remainingDistance: number;
}

/**
 * Create a new movement state with default configuration
 */
export function createMovementState(config?: Partial<UniversalMovementConfig>): UniversalMovementState {
  return {
    isMoving: false,
    targetPosition: null,
    currentVelocity: { x: 0, y: 0 },
    config: { ...DEFAULT_MOVEMENT_CONFIG, ...config },
    lastUpdateTime: 0,
    totalDistance: 0,
    remainingDistance: 0
  };
}

/**
 * Set a movement target for universal movement state
 */
export function setMovementTarget(
  state: UniversalMovementState, 
  currentPosition: Vector3D, 
  target: Vector2D | Vector3D
): boolean {
  // Convert target to 3D if needed, preserving current Z layer
  const target3D = 'z' in target ? 
    { ...target, z: currentPosition.z } : 
    { ...target, z: currentPosition.z };
  
  // Calculate distance to target
  const distance = Math.sqrt(
    Math.pow(target3D.x - currentPosition.x, 2) + 
    Math.pow(target3D.y - currentPosition.y, 2)
  );
  
  // Don't start movement if target is too close
  if (distance < state.config.minMovementDistance) {
    state.isMoving = false;
    state.targetPosition = null;
    state.currentVelocity = { x: 0, y: 0 };
    return false;
  }
  
  state.targetPosition = target3D;
  state.isMoving = true;
  state.totalDistance = distance;
  state.remainingDistance = distance;
  state.lastUpdateTime = performance.now();
  
  return true;
}

/**
 * Update movement state with enhanced physics
 */
export function updateMovementState(
  state: UniversalMovementState,
  currentPosition: Vector3D,
  deltaTime: number
): { newPosition: Vector3D; completed: boolean } {
  if (!state.isMoving || !state.targetPosition) {
    return { newPosition: currentPosition, completed: true };
  }
  
  const target = state.targetPosition;
  const config = state.config;
  
  // Calculate direction and distance to target
  const dx = target.x - currentPosition.x;
  const dy = target.y - currentPosition.y;
  const distance = Math.sqrt(dx * dx + dy * dy);
  
  // Check if we've arrived
  if (distance <= config.arrivalRadius) {
    state.isMoving = false;
    state.targetPosition = null;
    state.currentVelocity = { x: 0, y: 0 };
    
    // Snap to exact target position for precision
    const finalPosition = { x: target.x, y: target.y, z: currentPosition.z };
    return { newPosition: finalPosition, completed: true };
  }
  
  // Calculate normalized direction
  const directionX = dx / distance;
  const directionY = dy / distance;
  
  // Enhanced speed calculation with improved braking
  const currentSpeed = Math.sqrt(
    state.currentVelocity.x * state.currentVelocity.x + 
    state.currentVelocity.y * state.currentVelocity.y
  );
  
  // Calculate braking distance (distance needed to stop from current speed)
  const brakingDistance = (currentSpeed * currentSpeed) / (2 * config.acceleration);
  
  // Determine target speed based on distance and braking needs
  let targetSpeed = config.baseSpeed;
  
  if (distance < brakingDistance * 2) {
    // Start braking early for smooth arrival
    const brakingFactor = Math.max(0.1, distance / (brakingDistance * 2));
    targetSpeed = config.baseSpeed * brakingFactor;
  }
  
  // Apply acceleration/deceleration
  let newSpeed: number;
  if (currentSpeed < targetSpeed) {
    // Accelerate
    newSpeed = Math.min(currentSpeed + config.acceleration * deltaTime, targetSpeed);
  } else if (currentSpeed > targetSpeed) {
    // Decelerate
    newSpeed = Math.max(currentSpeed - config.acceleration * deltaTime, targetSpeed);
  } else {
    newSpeed = currentSpeed;
  }
  
  // Ensure we don't overshoot the target
  const maxDistanceThisFrame = Math.min(distance, config.maxMovementPerUpdate * deltaTime);
  const actualSpeed = Math.min(newSpeed, maxDistanceThisFrame / deltaTime);
  
  // Update velocity
  state.currentVelocity.x = directionX * actualSpeed;
  state.currentVelocity.y = directionY * actualSpeed;
  
  // Calculate new position
  const deltaX = state.currentVelocity.x * deltaTime;
  const deltaY = state.currentVelocity.y * deltaTime;
  
  const newPosition = {
    x: currentPosition.x + deltaX,
    y: currentPosition.y + deltaY,
    z: currentPosition.z
  };
  
  // Update state tracking
  state.remainingDistance = distance;
  state.lastUpdateTime = performance.now();
  
  return { newPosition, completed: false };
}

/**
 * Universal rotation update for consistent rotation across all actors
 */
export function updateRotation(
  currentRotation: number,
  currentPosition: Vector3D,
  targetPosition: Vector3D,
  turnSpeed: number,
  deltaTime: number
): number {
  // Calculate angle to target
  const dx = targetPosition.x - currentPosition.x;
  const dy = targetPosition.y - currentPosition.y;
  
  // Don't rotate if we're too close to the target
  const distance = Math.sqrt(dx * dx + dy * dy);
  if (distance < 1.0) {
    return currentRotation;
  }
  
  const targetAngle = Math.atan2(dy, dx);
  const maxRotationChange = turnSpeed * deltaTime;
  
  return rotateTowardsUniversal(currentRotation, targetAngle, maxRotationChange);
}

/**
 * Universal coordinate transformation for consistent screen-to-world conversion
 */
export interface CameraState {
  x: number;
  y: number;
  zoom: number;
}

export interface CanvasInfo {
  width: number;
  height: number;
}

/**
 * Convert screen coordinates to world coordinates with high precision
 */
export function screenToWorld(
  screenX: number,
  screenY: number,
  camera: CameraState,
  canvas: CanvasInfo
): Vector2D {
  // Use precise floating-point arithmetic
  const halfWidth = canvas.width * 0.5;
  const halfHeight = canvas.height * 0.5;
  
  // Calculate viewport dimensions in world space
  const viewportWorldWidth = canvas.width / camera.zoom;
  const viewportWorldHeight = canvas.height / camera.zoom;
  
  // Convert screen coordinates to normalized device coordinates [-1, 1]
  const ndcX = (screenX - halfWidth) / halfWidth;
  const ndcY = (screenY - halfHeight) / halfHeight;
  
  // Transform to world coordinates
  const worldX = camera.x + (ndcX * viewportWorldWidth * 0.5);
  const worldY = camera.y + (ndcY * viewportWorldHeight * 0.5);
  
  return { x: worldX, y: worldY };
}

/**
 * Convert world coordinates to screen coordinates
 */
export function worldToScreen(
  worldX: number,
  worldY: number,
  camera: CameraState,
  canvas: CanvasInfo
): Vector2D {
  const halfWidth = canvas.width * 0.5;
  const halfHeight = canvas.height * 0.5;
  
  const viewportWorldWidth = canvas.width / camera.zoom;
  const viewportWorldHeight = canvas.height / camera.zoom;
  
  const relativeX = (worldX - camera.x) / (viewportWorldWidth * 0.5);
  const relativeY = (worldY - camera.y) / (viewportWorldHeight * 0.5);
  
  const screenX = relativeX * halfWidth + halfWidth;
  const screenY = relativeY * halfHeight + halfHeight;
  
  return { x: screenX, y: screenY };
}

/**
 * Utility functions for actor integration
 */

/**
 * Check if a position is within click radius of another position
 */
export function isWithinClickRadius(
  pos1: Vector2D | Vector3D,
  pos2: Vector2D | Vector3D,
  radius: number
): boolean {
  const p1 = 'z' in pos1 ? to2D(pos1) : pos1;
  const p2 = 'z' in pos2 ? to2D(pos2) : pos2;
  
  const dx = p2.x - p1.x;
  const dy = p2.y - p1.y;
  const distance = Math.sqrt(dx * dx + dy * dy);
  
  return distance <= radius;
}

/**
 * Calculate distance between two positions (2D only)
 */
export function calculateDistance2D(
  pos1: Vector2D | Vector3D,
  pos2: Vector2D | Vector3D
): number {
  const p1 = 'z' in pos1 ? to2D(pos1) : pos1;
  const p2 = 'z' in pos2 ? to2D(pos2) : pos2;
  
  const dx = p2.x - p1.x;
  const dy = p2.y - p1.y;
  return Math.sqrt(dx * dx + dy * dy);
}

/**
 * Create a navigation target from coordinates
 */
export function createNavigationTarget(
  x: number,
  y: number,
  objectType: string = 'ship'
): Vector3D {
  return createLayeredPosition(x, y, objectType);
}