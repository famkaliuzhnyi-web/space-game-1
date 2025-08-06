import { describe, it, expect, beforeEach } from 'vitest';
import { PlayerManager } from '../systems/PlayerManager';

describe('PlayerManager', () => {
  let playerManager: PlayerManager;

  beforeEach(() => {
    playerManager = new PlayerManager();
  });

  describe('Player Initialization', () => {
    it('should initialize with default values', () => {
      const player = playerManager.getPlayer();
      
      expect(player.credits).toBe(10000);
      expect(player.currentStationId).toBe('earth-station');
      expect(player.ship.cargo.capacity).toBe(100);
      expect(player.ship.cargo.used).toBe(0);
      expect(player.ship.cargo.items.size).toBe(0);
    });
  });

  describe('Credits Management', () => {
    it('should handle credit transactions', () => {
      expect(playerManager.getCredits()).toBe(10000);
      
      playerManager.addCredits(500);
      expect(playerManager.getCredits()).toBe(10500);
      
      const success = playerManager.spendCredits(2000);
      expect(success).toBe(true);
      expect(playerManager.getCredits()).toBe(8500);
    });

    it('should prevent spending more credits than available', () => {
      const success = playerManager.spendCredits(15000);
      expect(success).toBe(false);
      expect(playerManager.getCredits()).toBe(10000);
    });
  });

  describe('Inventory Management', () => {
    it('should add commodities to cargo', () => {
      const result = playerManager.addCommodity('iron-ore', 10, 65);
      
      expect(result.success).toBe(true);
      expect(playerManager.getCargoUsed()).toBe(10);
      expect(playerManager.getCommodityQuantity('iron-ore')).toBe(10);
      expect(playerManager.getCargoValue()).toBe(650);
    });

    it('should prevent adding commodities beyond cargo capacity', () => {
      const result = playerManager.addCommodity('iron-ore', 150, 65);
      
      expect(result.success).toBe(false);
      expect(result.error).toContain('Insufficient cargo space');
      expect(playerManager.getCargoUsed()).toBe(0);
    });

    it('should remove commodities from cargo', () => {
      playerManager.addCommodity('iron-ore', 10, 65);
      
      const result = playerManager.removeCommodity('iron-ore', 5);
      
      expect(result.success).toBe(true);
      expect(playerManager.getCommodityQuantity('iron-ore')).toBe(5);
      expect(playerManager.getCargoUsed()).toBe(5);
    });

    it('should prevent removing more commodities than available', () => {
      playerManager.addCommodity('iron-ore', 10, 65);
      
      const result = playerManager.removeCommodity('iron-ore', 15);
      
      expect(result.success).toBe(false);
      expect(result.error).toContain('Insufficient quantity');
      expect(playerManager.getCommodityQuantity('iron-ore')).toBe(10);
    });
  });

  describe('Trading Functionality', () => {
    it('should execute buy transactions', () => {
      const result = playerManager.executeBuy('earth-station', 'iron-ore', 10, 65);
      
      expect(result.success).toBe(true);
      expect(playerManager.getCredits()).toBe(9350);
      expect(playerManager.getCommodityQuantity('iron-ore')).toBe(10);
      expect(playerManager.getCargoUsed()).toBe(10);
    });

    it('should execute sell transactions', () => {
      // First buy some items
      playerManager.executeBuy('earth-station', 'iron-ore', 10, 65);
      
      // Then sell them
      const result = playerManager.executeSell('earth-station', 'iron-ore', 5, 70);
      
      expect(result.success).toBe(true);
      expect(playerManager.getCredits()).toBe(9700); // 9350 + (5 * 70)
      expect(playerManager.getCommodityQuantity('iron-ore')).toBe(5);
      expect(playerManager.getCargoUsed()).toBe(5);
    });

    it('should prevent buying with insufficient credits', () => {
      const result = playerManager.executeBuy('earth-station', 'quantum-processors', 10, 2000);
      
      expect(result.success).toBe(false);
      expect(result.error).toContain('Insufficient credits');
      expect(playerManager.getCredits()).toBe(10000);
    });

    it('should prevent selling commodities not in cargo', () => {
      const result = playerManager.executeSell('earth-station', 'iron-ore', 5, 65);
      
      expect(result.success).toBe(false);
      expect(result.error).toContain('No iron-ore in cargo');
    });
  });

  describe('Cargo Space Management', () => {
    it('should track available cargo space correctly', () => {
      expect(playerManager.getAvailableSpace()).toBe(100);
      
      playerManager.addCommodity('iron-ore', 10, 65);
      expect(playerManager.getAvailableSpace()).toBe(90);
      
      playerManager.addCommodity('protein-rations', 20, 37);
      expect(playerManager.getAvailableSpace()).toBe(70);
    });

    it('should check if commodities can fit', () => {
      expect(playerManager.canFitCommodity('iron-ore', 50)).toBe(true);
      expect(playerManager.canFitCommodity('iron-ore', 150)).toBe(false);
      
      playerManager.addCommodity('iron-ore', 80, 65);
      expect(playerManager.canFitCommodity('iron-ore', 30)).toBe(false);
      expect(playerManager.canFitCommodity('iron-ore', 20)).toBe(true);
    });
  });

  describe('Serialization', () => {
    it('should serialize and deserialize player data', () => {
      // Add some cargo and modify credits
      playerManager.addCommodity('iron-ore', 10, 65);
      playerManager.spendCredits(1000);
      
      const serialized = playerManager.serialize();
      expect(serialized.player.credits).toBe(9000);
      
      // Create new manager and deserialize
      const newManager = new PlayerManager();
      newManager.deserialize(serialized);
      
      expect(newManager.getCredits()).toBe(9000);
      expect(newManager.getCommodityQuantity('iron-ore')).toBe(10);
      expect(newManager.getCargoUsed()).toBe(10);
    });
  });
});