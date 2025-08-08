import { render, screen } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import '@testing-library/jest-dom';
import GameCanvas from '../components/game/GameCanvas';

// Mock the Engine class
vi.mock('../engine', () => ({
  Engine: vi.fn().mockImplementation(() => ({
    start: vi.fn(),
    stop: vi.fn(),
    dispose: vi.fn(),
    resizeCanvas: vi.fn(),
    getPlayerManager: vi.fn(() => ({
      getCredits: () => 10000,
      getCargoManifest: () => [],
      getCargoUsed: () => 0,
      getCargoCapacity: () => 100,
      getShip: () => null,
      getOwnedShips: () => [],
      getCurrentShipId: () => '',
      getPlayerReputation: () => new Map(),
    })),
    getEventManager: vi.fn(() => ({
      getActiveEvents: () => [],
    })),
    getCharacterManager: vi.fn(() => ({
      getCharacter: () => null,
    })),
  })),
}));

describe('GameCanvas Full Screen Implementation', () => {
  beforeEach(() => {
    // Mock canvas getContext
    HTMLCanvasElement.prototype.getContext = vi.fn(() => ({
      fillStyle: '',
      fillRect: vi.fn(),
      clearRect: vi.fn(),
    })) as any;
  });

  it('should render canvas with full screen styling', () => {
    render(<GameCanvas className="full-screen-canvas" />);
    
    const canvas = document.querySelector('canvas');
    expect(canvas).toBeInTheDocument();
    expect(canvas).toHaveStyle({
      display: 'block',
      width: '100%',
      height: '100%',
      backgroundColor: 'rgb(0, 0, 0)',
    });
  });

  it('should render UI controls overlaid on canvas', () => {
    render(<GameCanvas />);
    
    // Check that essential controls are present
    expect(screen.getByRole('button', { name: /pause|start/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /nav/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /market/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /inventory/i })).toBeInTheDocument();
  });

  it('should apply full-screen-canvas class when provided', () => {
    const { container } = render(<GameCanvas className="full-screen-canvas" />);
    
    const gameContainer = container.firstChild as HTMLElement;
    expect(gameContainer).toHaveClass('full-screen-canvas');
  });

  it('should have proper container styling for full screen', () => {
    const { container } = render(<GameCanvas />);
    
    const gameContainer = container.firstChild as HTMLElement;
    expect(gameContainer).toHaveStyle({
      width: '100%',
      height: '100%',
      position: 'relative',
    });
  });
});