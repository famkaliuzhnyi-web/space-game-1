import { InputManager } from '../systems/InputManager';
import { WorldManager } from '../systems/WorldManager';
import { Camera } from './Renderer';

export interface ClickHandler {
  (worldX: number, worldY: number): void;
}

/**
 * Dedicated input handling system for camera and world interaction.
 * Handles keyboard, mouse, and touch input with proper coordinate transformations.
 * Separated from main engine for better testability and focused responsibility.
 */
export class InputHandler {
  private canvas: HTMLCanvasElement;
  private clickHandler?: ClickHandler;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
  }

  /**
   * Set the click handler for world interactions
   */
  setClickHandler(handler: ClickHandler): void {
    this.clickHandler = handler;
  }

  /**
   * Update camera based on input and handle interactions
   */
  updateCamera(camera: Camera, deltaTime: number, inputManager: InputManager): void {
    // Handle camera movement
    if (inputManager.isKeyPressed('KeyW') || inputManager.isKeyPressed('ArrowUp')) {
      camera.y -= 100 * deltaTime;
    }
    if (inputManager.isKeyPressed('KeyS') || inputManager.isKeyPressed('ArrowDown')) {
      camera.y += 100 * deltaTime;
    }
    if (inputManager.isKeyPressed('KeyA') || inputManager.isKeyPressed('ArrowLeft')) {
      camera.x -= 100 * deltaTime;
    }
    if (inputManager.isKeyPressed('KeyD') || inputManager.isKeyPressed('ArrowRight')) {
      camera.x += 100 * deltaTime;
    }

    // Handle zoom
    if (inputManager.isKeyPressed('Equal') || inputManager.isKeyPressed('NumpadAdd')) {
      camera.zoom = Math.min(camera.zoom + deltaTime, 3);
    }
    if (inputManager.isKeyPressed('Minus') || inputManager.isKeyPressed('NumpadSubtract')) {
      camera.zoom = Math.max(camera.zoom - deltaTime, 0.1);
    }

    // Handle click events for navigation
    const clickEvents = inputManager.getClickEvents();
    for (const clickEvent of clickEvents) {
      if (clickEvent.button === 0) { // Left click
        this.handleClick(clickEvent.position.x, clickEvent.position.y, camera);
      }
    }

    // Handle touch events for navigation
    const touches = inputManager.getTouchPositions();
    if (touches.length === 1) {
      // Single touch for navigation
      this.handleClick(touches[0].x, touches[0].y, camera);
    }
  }

  /**
   * Handle click interactions with coordinate transformation
   */
  private handleClick(x: number, y: number, camera: Camera): void {
    if (!this.clickHandler) return;

    // Convert screen coordinates to world coordinates
    const worldX = (x - this.canvas.width / 2) / camera.zoom + camera.x;
    const worldY = (y - this.canvas.height / 2) / camera.zoom + camera.y;

    this.clickHandler(worldX, worldY);
  }

  /**
   * Handle world object interactions based on click position
   */
  static handleWorldClick(worldX: number, worldY: number, worldManager: WorldManager): void {
    // Check if click is on any navigable object
    const objects = worldManager.getAllVisibleObjects();
    let clickedOnObject = false;
    
    for (const obj of objects) {
      const distance = Math.sqrt(
        Math.pow(worldX - obj.position.x, 2) + 
        Math.pow(worldY - obj.position.y, 2)
      );

      // Check if click is within object bounds
      let clickRadius = 20; // Default click radius
      if (obj.type === 'station') clickRadius = 15;
      if (obj.type === 'planet' && 'radius' in obj.object) clickRadius = obj.object.radius || 25;
      if (obj.type === 'star') clickRadius = 30;
      if (obj.type === 'ship') clickRadius = 10; // Ship has smaller click radius

      if (distance <= clickRadius) {
        clickedOnObject = true;
        if (obj.type === 'station' && 'id' in obj.object) {
          worldManager.navigateToTarget(obj.object.id);
        }
        break;
      }
    }
    
    // If no object was clicked, move ship to the clicked coordinates
    if (!clickedOnObject) {
      worldManager.moveShipToCoordinates(worldX, worldY);
    }
  }
}