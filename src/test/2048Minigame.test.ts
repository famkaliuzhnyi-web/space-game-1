import { describe, it, expect, beforeEach } from 'vitest';
import { HackingManager } from '../systems/HackingManager';
import { TimeManager } from '../systems/TimeManager';
import { WorldManager } from '../systems/WorldManager';
import { PlayerManager } from '../systems/PlayerManager';
import { FactionManager } from '../systems/FactionManager';
import { SecurityManager } from '../systems/SecurityManager';
import { CharacterManager } from '../systems/CharacterManager';

describe('2048 Minigame Integration', () => {
  let hackingManager: HackingManager;

  beforeEach(() => {
    const timeManager = new TimeManager();
    const worldManager = new WorldManager(timeManager);
    const playerManager = new PlayerManager(timeManager);
    const factionManager = new FactionManager();
    const securityManager = new SecurityManager(
      timeManager,
      worldManager,
      playerManager,
      factionManager
    );
    const characterManager = new CharacterManager(timeManager);

    hackingManager = new HackingManager(
      timeManager,
      worldManager,
      playerManager,
      factionManager,
      securityManager,
      characterManager
    );
  });

  it('should include 2048 as a valid minigame type', () => {
    // Test the parameter generation for 2048 minigames directly
    // This is the most important part to verify the integration works
    const difficulty = 5;
    const params = (hackingManager as any).generateMinigameParameters('2048', difficulty);
    
    expect(params).toBeDefined();
    expect(params.gridSize).toBeDefined();
    expect(params.targetTile).toBeDefined();
    expect(params.moveLimit).toBeDefined();
    expect(params.startingTiles).toBeDefined();
    
    // Verify the parameters are reasonable
    expect(params.gridSize).toBeGreaterThanOrEqual(4);
    expect(params.gridSize).toBeLessThanOrEqual(6);
    expect(params.targetTile).toBeGreaterThanOrEqual(256);
    expect(params.moveLimit).toBeGreaterThan(0);
    expect(params.startingTiles).toBeGreaterThanOrEqual(2);
    expect(params.startingTiles).toBeLessThanOrEqual(4);
  });

  it('should generate valid parameters for 2048 minigames', () => {
    const difficulty = 5;
    const params = (hackingManager as any).generateMinigameParameters('2048', difficulty);
    
    expect(params).toBeDefined();
    expect(params.gridSize).toBeDefined();
    expect(params.targetTile).toBeDefined();
    expect(params.moveLimit).toBeDefined();
    expect(params.startingTiles).toBeDefined();
    
    expect(params.gridSize).toBeGreaterThanOrEqual(4);
    expect(params.gridSize).toBeLessThanOrEqual(6);
    expect(params.targetTile).toBeGreaterThanOrEqual(256);
    expect(params.moveLimit).toBeGreaterThan(0);
    expect(params.startingTiles).toBeGreaterThanOrEqual(2);
    expect(params.startingTiles).toBeLessThanOrEqual(4);
  });

  it('should scale 2048 parameters with difficulty', () => {
    const easyParams = (hackingManager as any).generateMinigameParameters('2048', 1);
    const hardParams = (hackingManager as any).generateMinigameParameters('2048', 10);
    
    // Higher difficulty should have larger grid
    expect(hardParams.gridSize).toBeGreaterThanOrEqual(easyParams.gridSize);
    
    // Higher difficulty should have higher target tile
    expect(hardParams.targetTile).toBeGreaterThanOrEqual(easyParams.targetTile);
    
    // Higher difficulty should have fewer moves
    expect(hardParams.moveLimit).toBeLessThanOrEqual(easyParams.moveLimit);
  });
});