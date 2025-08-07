import { describe, it, expect, beforeEach } from 'vitest';
import { GameLoop } from '../engine/GameLoop';

describe('GameLoop', () => {
  let gameLoop: GameLoop;
  let updateCallCount = 0;
  let renderCallCount = 0;

  beforeEach(() => {
    gameLoop = new GameLoop();
    updateCallCount = 0;
    renderCallCount = 0;
  });

  describe('Lifecycle Management', () => {
    it('should start and stop correctly', () => {
      expect(gameLoop.getIsRunning()).toBe(false);
      
      gameLoop.start();
      expect(gameLoop.getIsRunning()).toBe(true);
      
      gameLoop.stop();
      expect(gameLoop.getIsRunning()).toBe(false);
    });

    it('should not start twice', () => {
      gameLoop.start();
      const firstRunning = gameLoop.getIsRunning();
      
      gameLoop.start(); // Try to start again
      expect(gameLoop.getIsRunning()).toBe(firstRunning);
      
      gameLoop.stop();
    });

    it('should handle stop when not running', () => {
      expect(() => gameLoop.stop()).not.toThrow();
    });
  });

  describe('Callback Management', () => {
    it('should set update callback correctly', () => {
      const callback = (deltaTime: number) => {
        updateCallCount++;
        expect(typeof deltaTime).toBe('number');
      };
      
      expect(() => gameLoop.setUpdateCallback(callback)).not.toThrow();
    });

    it('should set render callback correctly', () => {
      const callback = () => {
        renderCallCount++;
      };
      
      expect(() => gameLoop.setRenderCallback(callback)).not.toThrow();
    });
  });

  describe('Delta Time', () => {
    it('should provide delta time', () => {
      const deltaTime = gameLoop.getLastDeltaTime();
      expect(typeof deltaTime).toBe('number');
      expect(deltaTime).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Cleanup', () => {
    it('should dispose correctly', () => {
      gameLoop.start();
      expect(() => gameLoop.dispose()).not.toThrow();
      expect(gameLoop.getIsRunning()).toBe(false);
    });

    it('should handle dispose when not running', () => {
      expect(() => gameLoop.dispose()).not.toThrow();
    });
  });
});