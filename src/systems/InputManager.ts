import { InputState, Vector2D } from '../types';

export class InputManager {
  private inputState: InputState;
  private canvas: HTMLCanvasElement;
  private clickEvents: Array<{ button: number; position: Vector2D }> = [];
  private wheelDelta = 0;
  private dragState = {
    isDragging: false,
    button: -1,
    startPosition: { x: 0, y: 0 },
    currentPosition: { x: 0, y: 0 }
  };

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.inputState = {
      keys: {},
      mouse: {
        position: { x: 0, y: 0 },
        buttons: {},
      },
      touch: {
        touches: [],
      },
    };

    this.setupEventListeners();
  }

  private setupEventListeners(): void {
    // Keyboard events
    window.addEventListener('keydown', this.handleKeyDown.bind(this));
    window.addEventListener('keyup', this.handleKeyUp.bind(this));

    // Mouse events
    this.canvas.addEventListener('mousedown', this.handleMouseDown.bind(this));
    this.canvas.addEventListener('mouseup', this.handleMouseUp.bind(this));
    this.canvas.addEventListener('mousemove', this.handleMouseMove.bind(this));
    this.canvas.addEventListener('wheel', this.handleWheel.bind(this));
    
    // Prevent context menu on right-click
    this.canvas.addEventListener('contextmenu', (e) => e.preventDefault());

    // Touch events for mobile
    this.canvas.addEventListener('touchstart', this.handleTouchStart.bind(this));
    this.canvas.addEventListener('touchend', this.handleTouchEnd.bind(this));
    this.canvas.addEventListener('touchmove', this.handleTouchMove.bind(this));
  }

  private handleKeyDown(event: KeyboardEvent): void {
    this.inputState.keys[event.code] = true;
  }

  private handleKeyUp(event: KeyboardEvent): void {
    this.inputState.keys[event.code] = false;
  }

  private handleMouseDown(event: MouseEvent): void {
    this.inputState.mouse.buttons[event.button] = true;
    
    // Start drag tracking for right-click (button 2)
    if (event.button === 2) {
      this.dragState.isDragging = true;
      this.dragState.button = event.button;
      this.dragState.startPosition = { ...this.inputState.mouse.position };
      this.dragState.currentPosition = { ...this.inputState.mouse.position };
    }
  }

  private handleMouseUp(event: MouseEvent): void {
    // Detect click: mouse was down and is now up
    if (this.inputState.mouse.buttons[event.button]) {
      // Only register clicks if not dragging (to prevent click after drag)
      if (!this.dragState.isDragging || event.button !== 2) {
        this.clickEvents.push({
          button: event.button,
          position: { ...this.inputState.mouse.position }
        });
      }
    }
    
    // End drag tracking
    if (this.dragState.isDragging && event.button === this.dragState.button) {
      this.dragState.isDragging = false;
      this.dragState.button = -1;
    }
    
    this.inputState.mouse.buttons[event.button] = false;
  }

  private handleMouseMove(event: MouseEvent): void {
    const rect = this.canvas.getBoundingClientRect();
    this.inputState.mouse.position = {
      x: event.clientX - rect.left,
      y: event.clientY - rect.top,
    };
    
    // Update drag position if dragging
    if (this.dragState.isDragging) {
      this.dragState.currentPosition = { ...this.inputState.mouse.position };
    }
  }

  private handleTouchStart(event: TouchEvent): void {
    event.preventDefault();
    this.updateTouchPositions(event);
  }

  private handleTouchEnd(event: TouchEvent): void {
    event.preventDefault();
    this.updateTouchPositions(event);
  }

  private handleTouchMove(event: TouchEvent): void {
    event.preventDefault();
    this.updateTouchPositions(event);
  }

  private updateTouchPositions(event: TouchEvent): void {
    const rect = this.canvas.getBoundingClientRect();
    this.inputState.touch.touches = Array.from(event.touches).map(touch => ({
      x: touch.clientX - rect.left,
      y: touch.clientY - rect.top,
    }));
  }

  private handleWheel(event: WheelEvent): void {
    event.preventDefault();
    this.wheelDelta += event.deltaY;
  }

  getInputState(): InputState {
    return { ...this.inputState };
  }

  isKeyPressed(key: string): boolean {
    return !!this.inputState.keys[key];
  }

  isMouseButtonPressed(button: number): boolean {
    return !!this.inputState.mouse.buttons[button];
  }

  getMousePosition(): Vector2D {
    return { ...this.inputState.mouse.position };
  }

  getTouchPositions(): Vector2D[] {
    return [...this.inputState.touch.touches];
  }

  /**
   * Get and clear click events since last frame
   */
  getClickEvents(): Array<{ button: number; position: Vector2D }> {
    const events = [...this.clickEvents];
    this.clickEvents = []; // Clear after reading
    return events;
  }

  /**
   * Get and clear wheel delta since last frame
   */
  getWheelDelta(): number {
    const delta = this.wheelDelta;
    this.wheelDelta = 0; // Clear after reading
    return delta;
  }

  /**
   * Get current drag state
   */
  getDragState() {
    return {
      isDragging: this.dragState.isDragging,
      button: this.dragState.button,
      startPosition: { ...this.dragState.startPosition },
      currentPosition: { ...this.dragState.currentPosition },
      deltaX: this.dragState.currentPosition.x - this.dragState.startPosition.x,
      deltaY: this.dragState.currentPosition.y - this.dragState.startPosition.y
    };
  }

  /**
   * Reset drag start position for continuous dragging
   */
  resetDragStartPosition(): void {
    if (this.dragState.isDragging) {
      this.dragState.startPosition = { ...this.dragState.currentPosition };
    }
  }

  dispose(): void {
    window.removeEventListener('keydown', this.handleKeyDown.bind(this));
    window.removeEventListener('keyup', this.handleKeyUp.bind(this));
    this.canvas.removeEventListener('mousedown', this.handleMouseDown.bind(this));
    this.canvas.removeEventListener('mouseup', this.handleMouseUp.bind(this));
    this.canvas.removeEventListener('mousemove', this.handleMouseMove.bind(this));
    this.canvas.removeEventListener('wheel', this.handleWheel.bind(this));
    this.canvas.removeEventListener('contextmenu', (e) => e.preventDefault());
    this.canvas.removeEventListener('touchstart', this.handleTouchStart.bind(this));
    this.canvas.removeEventListener('touchend', this.handleTouchEnd.bind(this));
    this.canvas.removeEventListener('touchmove', this.handleTouchMove.bind(this));
  }
}