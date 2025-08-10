import { InputManager } from '../systems/InputManager';
import { WorldManager } from '../systems/WorldManager';
import { Camera } from './Renderer';

export interface ClickHandler {
  (worldX: number, worldY: number, action?: 'move' | 'command'): void;
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
    // Handle camera movement with keyboard
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

    // Handle zoom with keyboard
    if (inputManager.isKeyPressed('Equal') || inputManager.isKeyPressed('NumpadAdd')) {
      camera.zoom = Math.min(camera.zoom + deltaTime, 3);
    }
    if (inputManager.isKeyPressed('Minus') || inputManager.isKeyPressed('NumpadSubtract')) {
      camera.zoom = Math.max(camera.zoom - deltaTime, 0.1);
    }

    // Handle mouse wheel zoom with improved sensitivity
    const wheelDelta = inputManager.getWheelDelta();
    if (wheelDelta !== 0) {
      const zoomSpeed = 0.002; // Increased from 0.001 for better responsiveness
      const zoomChange = -wheelDelta * zoomSpeed; // Negative to make wheel up zoom in
      camera.zoom = Math.max(0.1, Math.min(3, camera.zoom + zoomChange));
    }

    // Handle drag for camera panning (middle-click or left-click when no object is clicked)
    const dragState = inputManager.getDragState();
    if (dragState.isDragging && (dragState.button === 1 || dragState.button === 0)) {
      // Apply drag movement to camera (inverted for natural feel)
      const dragSpeed = 1 / camera.zoom; // Slower drag when zoomed in
      camera.x -= dragState.deltaX * dragSpeed;
      camera.y -= dragState.deltaY * dragSpeed;
      
      // Reset drag start position for smooth continuous dragging
      inputManager.resetDragStartPosition();
    }

    // Handle click events for navigation
    const clickEvents = inputManager.getClickEvents();
    const currentDragState = inputManager.getDragState();
    
    for (const clickEvent of clickEvents) {
      // Skip processing click events if we were dragging (and it was a meaningful drag)
      if (currentDragState.isDragging && clickEvent.button === 0) {
        continue; // Left-click drag was used for map panning, don't process as ship command
      }
      
      // Left-click for ship movement (with 'move' action)
      if (clickEvent.button === 0) { 
        this.handleClick(clickEvent.position.x, clickEvent.position.y, camera, inputManager, 'move');
      }
      // Right-click for ship commands/navigation (with 'command' action)
      else if (clickEvent.button === 2) { 
        this.handleClick(clickEvent.position.x, clickEvent.position.y, camera, inputManager, 'command');
      }
    }

    // Handle touch events for navigation
    const touches = inputManager.getTouchPositions();
    if (touches.length === 1) {
      // Single touch for navigation (treated as move command)
      this.handleClick(touches[0].x, touches[0].y, camera, inputManager, 'move');
    }
  }

  /**
   * Handle click interactions with coordinate transformation
   */
  private handleClick(x: number, y: number, camera: Camera, inputManager?: InputManager, action: 'move' | 'command' = 'move'): void {
    if (!this.clickHandler) return;

    // Convert screen coordinates to world coordinates
    const worldX = (x - this.canvas.width / 2) / camera.zoom + camera.x;
    const worldY = (y - this.canvas.height / 2) / camera.zoom + camera.y;

    // If we have input manager and this is a left-click, cancel any ongoing drag
    // This ensures object interactions take priority over map dragging
    if (inputManager && action === 'move' && typeof inputManager.cancelDrag === 'function') {
      inputManager.cancelDrag();
    }

    this.clickHandler(worldX, worldY, action);
  }

  /**
   * Handle world object interactions based on click position
   */
  static handleWorldClick(worldX: number, worldY: number, worldManager: WorldManager, action: 'move' | 'command' = 'move'): void {
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
          if (action === 'command') {
            // Right-click: Navigate to station
            worldManager.navigateToTarget(obj.object.id);
            console.log(`Right-click command: Navigating to station ${obj.object.id}`);
          } else {
            // Left-click: Move to station coordinates  
            worldManager.moveShipToCoordinates(obj.position.x, obj.position.y);
            console.log(`Left-click: Moving to station coordinates (${obj.position.x}, ${obj.position.y})`);
          }
        } else {
          // For other objects, just move to their coordinates regardless of action type
          worldManager.moveShipToCoordinates(obj.position.x, obj.position.y);
        }
        break;
      }
    }
    
    // If no object was clicked, move ship to the clicked coordinates (both left and right click)
    if (!clickedOnObject) {
      worldManager.moveShipToCoordinates(worldX, worldY);
      console.log(`${action === 'command' ? 'Right' : 'Left'}-click: Moving ship to coordinates (${worldX}, ${worldY})`);
    }
  }
}