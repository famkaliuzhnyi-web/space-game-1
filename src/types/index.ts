export interface GameEngine {
  canvas: HTMLCanvasElement;
  context: CanvasRenderingContext2D;
  isRunning: boolean;
  lastFrameTime: number;
  
  start(): void;
  stop(): void;
  update(deltaTime: number): void;
  render(): void;
}

export interface Vector2D {
  x: number;
  y: number;
}

export interface GameEntity {
  id: string;
  position: Vector2D;
  velocity: Vector2D;
  update(deltaTime: number): void;
  render(context: CanvasRenderingContext2D): void;
}

export interface InputState {
  keys: Record<string, boolean>;
  mouse: {
    position: Vector2D;
    buttons: Record<number, boolean>;
  };
  touch: {
    touches: Vector2D[];
  };
}

// Re-export world types
export * from './world';

// Re-export economy types
export * from './economy';

// Re-export player types
export * from './player';

// Re-export ship hub types
export * from './shipHubs';

// Re-export all types for easy importing
export * from './achievements';
export * from './character';
export * from './contacts';  
export * from './economy';
export * from './events';
export * from './player';
export * from './shipHubs';
export * from './skillTrees';
export * from './world';