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

    // Handle mouse wheel zoom with zoom-to-cursor functionality
    const wheelDelta = inputManager.getWheelDelta();
    if (wheelDelta !== 0) {
      const zoomSpeed = 0.002; // Increased from 0.001 for better responsiveness
      const zoomChange = -wheelDelta * zoomSpeed; // Negative to make wheel up zoom in
      const newZoom = Math.max(0.1, Math.min(3, camera.zoom + zoomChange));
      
      // Only apply zoom-to-cursor if zoom actually changes
      if (newZoom !== camera.zoom) {
        // Get mouse position for zoom-to-cursor behavior
        const mousePos = inputManager.getMousePosition();
        
        // Calculate world position under cursor BEFORE zoom change
        const worldXBeforeZoom = (mousePos.x - this.canvas.width / 2) / camera.zoom + camera.x;
        const worldYBeforeZoom = (mousePos.y - this.canvas.height / 2) / camera.zoom + camera.y;
        
        // Apply zoom change
        camera.zoom = newZoom;
        
        // Calculate world position under cursor AFTER zoom change
        const worldXAfterZoom = (mousePos.x - this.canvas.width / 2) / camera.zoom + camera.x;
        const worldYAfterZoom = (mousePos.y - this.canvas.height / 2) / camera.zoom + camera.y;
        
        // Adjust camera position to keep the same world position under cursor
        camera.x += worldXBeforeZoom - worldXAfterZoom;
        camera.y += worldYBeforeZoom - worldYAfterZoom;
      }
    }

    // Handle drag for camera panning (middle-click or left-click when no object is clicked)
    const dragState = inputManager.getDragState();
    if (dragState.isDragging && (dragState.button === 1 || dragState.button === 0)) {
      // Apply drag movement to camera (inverted for natural feel)
      // Use consistent drag speed that accounts for zoom level for smooth panning
      const dragSpeed = 1 / camera.zoom; // Slower drag when zoomed in for precision
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
      
      // Only right-click should trigger ship movement, not left-click
      if (clickEvent.button === 2) { // Right click for ship commands/navigation  
        this.handleClick(clickEvent.position.x, clickEvent.position.y, camera, inputManager, 'command');
      }
      // Left-click (button === 0) is reserved for UI interactions and should not move the ship
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
   * Uses ray-plane intersection for accurate camera-based coordinate transformation
   */
  private handleClick(x: number, y: number, camera: Camera, inputManager?: InputManager, action: 'move' | 'command' = 'move'): void {
    if (!this.clickHandler) return;

    // Convert screen coordinates to world coordinates using ray-plane intersection
    const worldCoords = this.screenToWorldRayIntersection(x, y, camera);
    const worldX = worldCoords.x;
    const worldY = worldCoords.y;

    // If we have input manager and this is a left-click, cancel any ongoing drag
    // This ensures object interactions take priority over map dragging
    if (inputManager && action === 'move' && typeof inputManager.cancelDrag === 'function') {
      inputManager.cancelDrag();
    }

    this.clickHandler(worldX, worldY, action);
  }

  /**
   * Convert screen coordinates to world coordinates using ray-plane intersection
   * This method traces a ray from the camera through the screen point and finds
   * where it intersects the XY plane (Z=0) in world space.
   */
  private screenToWorldRayIntersection(screenX: number, screenY: number, camera: Camera): { x: number; y: number } {
    // Convert screen coordinates to normalized device coordinates (-1 to +1)
    // Screen origin (0,0) is at top-left, NDC origin (0,0) is at center
    const ndcX = ((screenX - this.canvas.width / 2) / (this.canvas.width / 2));
    const ndcY = ((screenY - this.canvas.height / 2) / (this.canvas.height / 2)); // No Y flip - keep screen coordinate direction
    
    // For a top-down orthographic camera view:
    // - Camera is positioned at (camera.x, camera.y, cameraHeight) looking down at Z=0
    // - The camera's view frustum maps screen coordinates to world coordinates
    // - Zoom affects the scale of the view frustum
    
    // Calculate the world space dimensions of the viewport at Z=0
    const viewportWorldWidth = this.canvas.width / camera.zoom;
    const viewportWorldHeight = this.canvas.height / camera.zoom;
    
    // Calculate ray intersection with XY plane (Z=0)
    // For orthographic projection, the ray direction is parallel to Z-axis
    // The intersection point is simply the camera position plus the NDC offset scaled by viewport size
    const worldX = camera.x + (ndcX * viewportWorldWidth / 2);
    const worldY = camera.y + (ndcY * viewportWorldHeight / 2);
    
    return { x: worldX, y: worldY };
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