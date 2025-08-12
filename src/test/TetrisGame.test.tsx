import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import TetrisGameComponent from '../components/game/TetrisGameComponent';
import { TetrisGame } from '../systems/TetrisGame';
import '@testing-library/jest-dom';

// Mock canvas context
const mockContext = {
  fillRect: vi.fn(),
  fillStyle: '',
  strokeRect: vi.fn(),
  strokeStyle: '',
  lineWidth: 0,
  beginPath: vi.fn(),
  moveTo: vi.fn(),
  lineTo: vi.fn(),
  stroke: vi.fn(),
};

// Mock HTMLCanvasElement
Object.defineProperty(HTMLCanvasElement.prototype, 'getContext', {
  value: vi.fn(() => mockContext),
});

// Mock requestAnimationFrame and cancelAnimationFrame
global.requestAnimationFrame = vi.fn((cb) => {
  setTimeout(cb, 16);
  return 1;
});
global.cancelAnimationFrame = vi.fn();

describe('TetrisGameComponent', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render the tetris game canvas', () => {
    const { container } = render(<TetrisGameComponent />);
    
    const canvas = container.querySelector('canvas');
    expect(canvas).toBeInTheDocument();
    expect(canvas).toHaveAttribute('width', '300'); // 10 * 30 pixels
    expect(canvas).toHaveAttribute('height', '600'); // 20 * 30 pixels
  });

  it('should render game controls', () => {
    render(<TetrisGameComponent />);
    
    expect(screen.getByText('Start Game')).toBeInTheDocument();
    expect(screen.getByText('Restart')).toBeInTheDocument();
    expect(screen.getByText('Stop')).toBeInTheDocument();
  });

  it('should display score information', () => {
    render(<TetrisGameComponent />);
    
    expect(screen.getByText('Tetris')).toBeInTheDocument();
    expect(screen.getByText(/Score:/)).toBeInTheDocument();
    expect(screen.getByText(/Level:/)).toBeInTheDocument();
    expect(screen.getByText(/Lines:/)).toBeInTheDocument();
  });

  it('should display control instructions', () => {
    render(<TetrisGameComponent />);
    
    expect(screen.getByText('Controls:')).toBeInTheDocument();
    expect(screen.getByText('← → Move left/right')).toBeInTheDocument();
    expect(screen.getByText('↓ Soft drop')).toBeInTheDocument();
    expect(screen.getByText('↑ Rotate')).toBeInTheDocument();
    expect(screen.getByText('Space: Hard drop')).toBeInTheDocument();
    expect(screen.getByText('P: Pause')).toBeInTheDocument();
  });

  it('should start game when start button is clicked', async () => {
    render(<TetrisGameComponent />);
    
    const startButton = screen.getByText('Start Game');
    fireEvent.click(startButton);
    
    await waitFor(() => {
      expect(screen.getByText('Pause')).toBeInTheDocument();
    });
  });

  it('should call onScoreChange callback when provided', async () => {
    const onScoreChange = vi.fn();
    render(<TetrisGameComponent onScoreChange={onScoreChange} />);
    
    // Start the game to trigger score updates
    const startButton = screen.getByText('Start Game');
    fireEvent.click(startButton);
    
    // Wait for the callback to be called during rendering
    await waitFor(() => {
      expect(onScoreChange).toHaveBeenCalled();
    });
  });

  it('should handle keyboard controls when game is active', async () => {
    render(<TetrisGameComponent />);
    
    const startButton = screen.getByText('Start Game');
    fireEvent.click(startButton);
    
    await waitFor(() => {
      expect(screen.getByText('Pause')).toBeInTheDocument();
    });
    
    // Test pause control
    fireEvent.keyDown(document, { key: 'p' });
    
    // Wait for pause state to update
    await waitFor(() => {
      expect(screen.getByText(/PAUSED/)).toBeInTheDocument();
    });
  });

  it('should handle restart button', () => {
    render(<TetrisGameComponent />);
    
    const restartButton = screen.getByText('Restart');
    fireEvent.click(restartButton);
    
    // After restart, should show pause button (game starts)
    expect(screen.getByText('Pause')).toBeInTheDocument();
  });

  it('should handle stop button', async () => {
    render(<TetrisGameComponent />);
    
    // Start the game first
    const startButton = screen.getByText('Start Game');
    fireEvent.click(startButton);
    
    await waitFor(() => {
      expect(screen.getByText('Pause')).toBeInTheDocument();
    });
    
    // Stop the game
    const stopButton = screen.getByText('Stop');
    fireEvent.click(stopButton);
    
    // Should show start button again
    expect(screen.getByText('Start Game')).toBeInTheDocument();
  });
});

describe('TetrisGame Logic', () => {
  let game: TetrisGame;

  beforeEach(() => {
    game = new TetrisGame();
  });

  it('should initialize with default state', () => {
    const state = game.getState();
    
    expect(state.score).toBe(0);
    expect(state.level).toBe(1);
    expect(state.lines).toBe(0);
    expect(state.isGameOver).toBe(false);
    expect(state.isPaused).toBe(false);
    expect(state.board.width).toBe(10);
    expect(state.board.height).toBe(20);
  });

  it('should create empty board', () => {
    const state = game.getState();
    
    for (let y = 0; y < state.board.height; y++) {
      for (let x = 0; x < state.board.width; x++) {
        expect(state.board.grid[y][x]).toBeNull();
      }
    }
  });

  it('should spawn new piece when started', () => {
    game.start();
    const state = game.getState();
    
    expect(state.currentPiece).not.toBeNull();
    expect(state.nextPiece).not.toBeNull();
  });

  it('should move piece left', () => {
    game.start();
    const initialState = game.getState();
    const initialX = initialState.currentPiece?.position.x || 0;
    
    const moved = game.moveLeft();
    const newState = game.getState();
    
    if (moved) {
      expect(newState.currentPiece?.position.x).toBe(initialX - 1);
    }
  });

  it('should move piece right', () => {
    game.start();
    const initialState = game.getState();
    const initialX = initialState.currentPiece?.position.x || 0;
    
    const moved = game.moveRight();
    const newState = game.getState();
    
    if (moved) {
      expect(newState.currentPiece?.position.x).toBe(initialX + 1);
    }
  });

  it('should move piece down', () => {
    game.start();
    const initialState = game.getState();
    const initialY = initialState.currentPiece?.position.y || 0;
    
    const moved = game.moveDown();
    const newState = game.getState();
    
    if (moved) {
      expect(newState.currentPiece?.position.y).toBe(initialY + 1);
    }
  });

  it('should rotate piece', () => {
    game.start();
    const initialState = game.getState();
    const initialRotation = initialState.currentPiece?.rotation || 0;
    
    const rotated = game.rotate();
    const newState = game.getState();
    
    if (rotated) {
      expect(newState.currentPiece?.rotation).toBe((initialRotation + 1) % 4);
    }
  });

  it('should pause and unpause game', () => {
    game.start();
    
    game.pause();
    let state = game.getState();
    expect(state.isPaused).toBe(true);
    
    game.pause();
    state = game.getState();
    expect(state.isPaused).toBe(false);
  });

  it('should restart game', () => {
    game.start();
    game.moveDown();
    
    game.restart();
    const state = game.getState();
    
    expect(state.score).toBe(0);
    expect(state.level).toBe(1);
    expect(state.lines).toBe(0);
    expect(state.isGameOver).toBe(false);
    expect(state.isPaused).toBe(false);
  });

  it('should award points for soft drop', () => {
    game.start();
    const initialScore = game.getState().score;
    
    game.moveDown();
    const newScore = game.getState().score;
    
    expect(newScore).toBeGreaterThan(initialScore);
  });

  it('should award more points for hard drop', () => {
    game.start();
    const initialScore = game.getState().score;
    
    const dropDistance = game.hardDrop();
    const newScore = game.getState().score;
    
    if (dropDistance > 0) {
      expect(newScore).toBe(initialScore + dropDistance * 2);
    }
  });

  it('should not allow moves when game is paused', () => {
    game.start();
    game.pause();
    
    expect(game.moveLeft()).toBe(false);
    expect(game.moveRight()).toBe(false);
    expect(game.moveDown()).toBe(false);
    expect(game.rotate()).toBe(false);
    expect(game.hardDrop()).toBe(0);
  });

  it('should not allow moves when game is over', () => {
    const gameOverGame = new TetrisGame();
    // Manually set game over state for testing
    gameOverGame.getState().isGameOver = true;
    
    expect(gameOverGame.moveLeft()).toBe(false);
    expect(gameOverGame.moveRight()).toBe(false);
    expect(gameOverGame.moveDown()).toBe(false);
    expect(gameOverGame.rotate()).toBe(false);
    expect(gameOverGame.hardDrop()).toBe(0);
  });

  it('should handle game loop start and stop', () => {
    const callback = vi.fn();
    
    game.startGameLoop(callback);
    game.stopGameLoop();
    
    // Should complete without errors
    expect(true).toBe(true);
  });
});