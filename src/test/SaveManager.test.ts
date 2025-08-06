import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { SaveManager, GameSaveData } from '../systems/SaveManager';

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};

  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value.toString();
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
    get length() {
      return Object.keys(store).length;
    },
    key: (index: number) => {
      const keys = Object.keys(store);
      return keys[index] || null;
    }
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock
});

describe('SaveManager', () => {
  let saveManager: SaveManager;
  let mockGameData: Partial<GameSaveData>;

  beforeEach(() => {
    localStorageMock.clear();
    saveManager = new SaveManager();
    
    mockGameData = {
      playerName: 'Test Player',
      playtimeMs: 3600000, // 1 hour
      world: {
        galaxy: { sectors: [] },
        playerLocation: {
          sectorId: 'test-sector',
          systemId: 'test-system',
          stationId: 'test-station'
        }
      },
      time: {
        gameStartTime: new Date('2157-01-01T00:00:00Z'),
        accumulatedTime: 0,
        timeAcceleration: 1,
        scheduledEvents: []
      },
      player: {
        name: 'Test Player',
        credits: 5000,
        experience: 100,
        skills: { trading: 5 },
        reputation: { 'Earth Federation': 10 }
      }
    };
  });

  afterEach(() => {
    localStorageMock.clear();
  });

  describe('save and load functionality', () => {
    it('should save game data successfully', async () => {
      const success = await saveManager.saveGame('test-slot', mockGameData, 'Test Save');
      
      expect(success).toBe(true);
      expect(localStorageMock.getItem('space_game_save_test-slot')).toBeTruthy();
      expect(localStorageMock.getItem('space_game_save_slot_test-slot')).toBeTruthy();
    });

    it('should load game data successfully', async () => {
      await saveManager.saveGame('test-slot', mockGameData, 'Test Save');
      
      const loadedData = await saveManager.loadGame('test-slot');
      
      expect(loadedData).toBeTruthy();
      expect(loadedData?.playerName).toBe('Test Player');
      expect(loadedData?.playtimeMs).toBe(3600000);
      expect(loadedData?.world.playerLocation.systemId).toBe('test-system');
    });

    it('should return null for non-existent save', async () => {
      const loadedData = await saveManager.loadGame('non-existent-slot');
      
      expect(loadedData).toBe(null);
    });

    it('should handle invalid save data gracefully', async () => {
      // Manually add invalid data to localStorage
      localStorageMock.setItem('space_game_save_invalid-slot', 'invalid json');
      
      const loadedData = await saveManager.loadGame('invalid-slot');
      
      expect(loadedData).toBe(null);
    });
  });

  describe('save slot management', () => {
    it('should list save slots correctly', async () => {
      await saveManager.saveGame('slot1', mockGameData, 'Save 1');
      await saveManager.saveGame('slot2', mockGameData, 'Save 2');
      
      const slots = saveManager.getSaveSlots();
      
      expect(slots).toHaveLength(2);
      expect(slots.map(s => s.name)).toContain('Save 1');
      expect(slots.map(s => s.name)).toContain('Save 2');
    });

    it('should sort slots by timestamp', async () => {
      const oldData = { ...mockGameData, timestamp: new Date('2157-01-01T12:00:00Z') };
      const newData = { ...mockGameData, timestamp: new Date('2157-01-02T12:00:00Z') };
      
      await saveManager.saveGame('old-slot', oldData, 'Old Save');
      // Small delay to ensure different timestamps
      await new Promise(resolve => setTimeout(resolve, 10));
      await saveManager.saveGame('new-slot', newData, 'New Save');
      
      const slots = saveManager.getSaveSlots();
      
      expect(slots[0].name).toBe('New Save'); // Should be first (newest)
    });

    it('should delete save slots correctly', () => {
      saveManager.saveGame('slot1', mockGameData, 'Save 1');
      
      let slots = saveManager.getSaveSlots();
      expect(slots).toHaveLength(1);
      
      const deleted = saveManager.deleteSave('slot1');
      expect(deleted).toBe(true);
      
      slots = saveManager.getSaveSlots();
      expect(slots).toHaveLength(0);
    });
  });

  describe('auto-save functionality', () => {
    it('should start auto-save correctly', () => {
      const gameDataProvider = vi.fn(() => mockGameData);
      
      saveManager.startAutoSave(gameDataProvider);
      
      // Auto-save timer should be running
      // We can't easily test the timer directly, but we can verify the method doesn't throw
      saveManager.stopAutoSave();
    });

    it('should stop auto-save correctly', () => {
      const gameDataProvider = vi.fn(() => mockGameData);
      
      saveManager.startAutoSave(gameDataProvider);
      saveManager.stopAutoSave();
      
      // Should not throw and should be safe to call multiple times
      saveManager.stopAutoSave();
    });

    it('should set auto-save interval correctly', () => {
      saveManager.setAutoSaveInterval(10); // 10 minutes
      
      // Hard to test the internal timer, but method should not throw
      expect(() => saveManager.setAutoSaveInterval(5)).not.toThrow();
    });
  });

  describe('import and export functionality', () => {
    it('should export save data correctly', async () => {
      await saveManager.saveGame('test-slot', mockGameData, 'Test Save');
      
      const exportedData = await saveManager.exportSave('test-slot');
      
      expect(exportedData).toBeTruthy();
      expect(exportedData).toContain('Test Player');
      expect(exportedData).toContain('test-system');
    });

    it('should import save data correctly', async () => {
      const exportedData = JSON.stringify({
        version: '1.0.0',
        timestamp: new Date(),
        playerName: 'Imported Player',
        playtimeMs: 7200000,
        world: mockGameData.world,
        time: mockGameData.time,
        player: {
          name: 'Imported Player',
          credits: 10000,
          experience: 200,
          skills: {},
          reputation: {}
        },
        settings: saveManager['getDefaultSettings']()
      });
      
      const success = await saveManager.importSave(exportedData, 'imported-slot');
      
      expect(success).toBe(true);
      
      const loadedData = await saveManager.loadGame('imported-slot');
      expect(loadedData?.playerName).toBe('Imported Player');
      expect(loadedData?.player.credits).toBe(10000);
    });

    it('should reject invalid import data', async () => {
      const success = await saveManager.importSave('invalid json', 'test-slot');
      
      expect(success).toBe(false);
    });
  });

  describe('storage management', () => {
    it('should detect storage availability', () => {
      const available = saveManager.isStorageAvailable();
      
      expect(available).toBe(true);
    });

    it('should provide storage info', () => {
      const storageInfo = saveManager.getStorageInfo();
      
      expect(storageInfo).toHaveProperty('used');
      expect(storageInfo).toHaveProperty('available');
      expect(storageInfo).toHaveProperty('percentage');
      expect(typeof storageInfo.used).toBe('number');
      expect(typeof storageInfo.available).toBe('number');
      expect(typeof storageInfo.percentage).toBe('number');
    });

    it('should handle cleanup operations', () => {
      // This is hard to test thoroughly without mocking storage limits
      // But we can verify the method doesn't throw
      expect(() => saveManager.cleanupOldSaves()).not.toThrow();
    });
  });

  describe('save validation', () => {
    it('should validate correct save data', () => {
      const validData = {
        version: '1.0.0',
        timestamp: new Date(),
        playerName: 'Test Player',
        playtimeMs: 1000,
        world: { galaxy: {}, playerLocation: { sectorId: 'test', systemId: 'test' } },
        time: { gameStartTime: new Date(), accumulatedTime: 0, timeAcceleration: 1, scheduledEvents: [] },
        player: { name: 'Test', credits: 1000, experience: 0, skills: {}, reputation: {} },
        settings: {}
      };

      // Access private method for testing
      const isValid = saveManager['validateSaveData'](validData);
      expect(isValid).toBe(true);
    });

    it('should reject invalid save data', () => {
      const invalidData = {
        version: '1.0.0',
        // Missing required fields
        playerName: 'Test Player'
      };

      const isValid = saveManager['validateSaveData'](invalidData);
      expect(isValid).toBe(false);
    });

    it('should reject non-object data', () => {
      const isValid = saveManager['validateSaveData']('not an object');
      expect(isValid).toBe(false);
    });

    it('should reject null data', () => {
      const isValid = saveManager['validateSaveData'](null);
      expect(isValid).toBe(false);
    });
  });
});