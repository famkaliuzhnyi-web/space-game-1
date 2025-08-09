import { InputState, Vector2D } from '../types';

export class InputManager {
  private inputState: InputState;
  private canvas: HTMLCanvasElement;
  private clickEvents: Array<{ button: number; position: Vector2D }> = [];

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
  }

  private handleMouseUp(event: MouseEvent): void {
    // Detect click: mouse was down and is now up
    if (this.inputState.mouse.buttons[event.button]) {
      this.clickEvents.push({
        button: event.button,
        position: { ...this.inputState.mouse.position }
      });
    }
    
    this.inputState.mouse.buttons[event.button] = false;
  }

  private handleMouseMove(event: MouseEvent): void {
    const rect = this.canvas.getBoundingClientRect();
    this.inputState.mouse.position = {
      x: event.clientX - rect.left,
      y: event.clientY - rect.top,
    };
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

  dispose(): void {
    window.removeEventListener('keydown', this.handleKeyDown.bind(this));
    window.removeEventListener('keyup', this.handleKeyUp.bind(this));
    this.canvas.removeEventListener('mousedown', this.handleMouseDown.bind(this));
    this.canvas.removeEventListener('mouseup', this.handleMouseUp.bind(this));
    this.canvas.removeEventListener('mousemove', this.handleMouseMove.bind(this));
    this.canvas.removeEventListener('touchstart', this.handleTouchStart.bind(this));
    this.canvas.removeEventListener('touchend', this.handleTouchEnd.bind(this));
    this.canvas.removeEventListener('touchmove', this.handleTouchMove.bind(this));
  }
}