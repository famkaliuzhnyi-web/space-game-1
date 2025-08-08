/**
 * SaveManager - Handles save/load functionality for the game
 * 
 * This system provides:
 * - Local storage save/load
 * - Multiple save slots
 * - Auto-save functionality
 * - Import/export functionality
 * - Save validation and error recovery
 */

export interface GameSaveData {
  version: string;
  timestamp: Date;
  playerName: string;
  playtimeMs: number;
  
  // Core game state
  world: {
    galaxy: unknown; // Will be properly typed later
    playerLocation: {
      sectorId: string;
      systemId: string;
      stationId?: string;
    };
  };
  
  // Time system state
  time: {
    gameStartTime: Date;
    accumulatedTime: number;
    timeAcceleration: number;
    scheduledEvents: unknown[]; // Will be properly typed later
  };
  
  // Player state (to be expanded in later phases)
  player: {
    name: string;
    credits: number;
    experience: number;
    skills: Record<string, number>;
    reputation: Record<string, number>;
  };
  
  // Game settings
  settings: {
    graphics: {
      quality: 'low' | 'medium' | 'high';
      antialiasing: boolean;
      particles: boolean;
    };
    audio: {
      masterVolume: number;
      musicVolume: number;
      effectsVolume: number;
      muted: boolean;
    };
    controls: {
      keyBindings: Record<string, string>;
      mouseSensitivity: number;
      touchSensitivity: number;
    };
    gameplay: {
      autoSave: boolean;
      autoSaveInterval: number; // minutes
      difficulty: 'easy' | 'normal' | 'hard';
      pauseOnLostFocus: boolean;
    };
  };
}

export interface SaveSlot {
  id: string;
  name: string;
  timestamp: Date;
  playtime: string;
  location: string;
  playerName: string;
  screenshot?: string; // Base64 encoded screenshot
  isAutoSave: boolean;
}

export class SaveManager {
  private static readonly STORAGE_KEY_PREFIX = 'space_game_save_';
  private static readonly SETTINGS_KEY = 'space_game_settings';
  private static readonly CURRENT_VERSION = '1.0.0';
  private static readonly MAX_SAVE_SLOTS = 10;
  private static readonly AUTO_SAVE_SLOT_ID = 'auto_save';
  
  private autoSaveInterval: number = 5 * 60 * 1000; // 5 minutes default
  private autoSaveTimer: number | null = null;

  constructor() {
    this.loadSettings();
  }

  /**
   * Save the current game state to a specific slot
   */
  async saveGame(
    slotId: string, 
    gameData: Partial<GameSaveData>, 
    slotName?: string, 
    progressCallback?: (progress: number) => void
  ): Promise<boolean> {
    try {
      progressCallback?.(0.1); // 10% - Started saving
      
      const saveData: GameSaveData = {
        version: SaveManager.CURRENT_VERSION,
        timestamp: new Date(),
        playerName: gameData.playerName || 'Unknown Player',
        playtimeMs: gameData.playtimeMs || 0,
        
        world: gameData.world || {
          galaxy: null,
          playerLocation: { sectorId: '', systemId: '' }
        },
        
        time: gameData.time || {
          gameStartTime: new Date(),
          accumulatedTime: 0,
          timeAcceleration: 1,
          scheduledEvents: []
        },
        
        player: gameData.player || {
          name: 'New Player',
          credits: 1000,
          experience: 0,
          skills: {},
          reputation: {}
        },
        
        settings: gameData.settings || this.getDefaultSettings()
      };

      progressCallback?.(0.3); // 30% - Prepared data

      // Validate save data
      if (!this.validateSaveData(saveData)) {
        throw new Error('Invalid save data');
      }

      progressCallback?.(0.5); // 50% - Validated data

      // Create save slot metadata
      const saveSlot: SaveSlot = {
        id: slotId,
        name: slotName || `Save ${slotId}`,
        timestamp: saveData.timestamp,
        playtime: this.formatPlaytime(saveData.playtimeMs),
        location: this.getLocationString(saveData.world.playerLocation),
        playerName: saveData.playerName,
        isAutoSave: slotId === SaveManager.AUTO_SAVE_SLOT_ID
      };

      progressCallback?.(0.7); // 70% - Created metadata

      // Compress and save to localStorage
      const saveKey = SaveManager.STORAGE_KEY_PREFIX + slotId;
      const slotKey = SaveManager.STORAGE_KEY_PREFIX + 'slot_' + slotId;
      
      const compressedData = await this.compressSaveData(saveData);
      progressCallback?.(0.9); // 90% - Compressed data
      
      localStorage.setItem(saveKey, compressedData);
      localStorage.setItem(slotKey, JSON.stringify(saveSlot));
      
      progressCallback?.(1.0); // 100% - Complete
      
      console.log(`Game saved to slot ${slotId}:`, saveSlot.name);
      return true;
      
    } catch (error) {
      console.error('Failed to save game:', error);
      return false;
    }
  }

  /**
   * Load game state from a specific slot
   */
  async loadGame(slotId: string, progressCallback?: (progress: number) => void): Promise<GameSaveData | null> {
    try {
      progressCallback?.(0.1); // 10% - Started loading
      
      const saveKey = SaveManager.STORAGE_KEY_PREFIX + slotId;
      const savedData = localStorage.getItem(saveKey);
      
      if (!savedData) {
        throw new Error(`No save data found for slot ${slotId}`);
      }

      progressCallback?.(0.3); // 30% - Retrieved data

      const saveData = await this.decompressSaveData(savedData);
      progressCallback?.(0.7); // 70% - Decompressed data
      
      // Validate loaded data
      if (!this.validateSaveData(saveData)) {
        throw new Error('Invalid save data format');
      }

      progressCallback?.(0.9); // 90% - Validated data

      // Convert string dates back to Date objects
      saveData.timestamp = new Date(saveData.timestamp);
      saveData.time.gameStartTime = new Date(saveData.time.gameStartTime);
      
      progressCallback?.(1.0); // 100% - Complete
      
      console.log(`Game loaded from slot ${slotId}`);
      return saveData;
      
    } catch (error) {
      console.error('Failed to load game:', error);
      return null;
    }
  }

  /**
   * Get all available save slots
   */
  getSaveSlots(): SaveSlot[] {
    const slots: SaveSlot[] = [];
    
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(SaveManager.STORAGE_KEY_PREFIX + 'slot_')) {
        try {
          const slotData = localStorage.getItem(key);
          if (slotData) {
            const slot: SaveSlot = JSON.parse(slotData);
            slot.timestamp = new Date(slot.timestamp);
            slots.push(slot);
          }
        } catch (error) {
          console.warn(`Failed to parse save slot ${key}:`, error);
        }
      }
    }
    
    // Sort by timestamp (newest first)
    return slots.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }

  /**
   * Delete a save slot
   */
  deleteSave(slotId: string): boolean {
    try {
      const saveKey = SaveManager.STORAGE_KEY_PREFIX + slotId;
      const slotKey = SaveManager.STORAGE_KEY_PREFIX + 'slot_' + slotId;
      
      localStorage.removeItem(saveKey);
      localStorage.removeItem(slotKey);
      
      console.log(`Save slot ${slotId} deleted`);
      return true;
      
    } catch (error) {
      console.error('Failed to delete save:', error);
      return false;
    }
  }

  /**
   * Start auto-save functionality
   */
  startAutoSave(gameDataProvider: () => Partial<GameSaveData>): void {
    this.stopAutoSave();
    
    this.autoSaveTimer = window.setInterval(() => {
      const gameData = gameDataProvider();
      if (gameData.settings?.gameplay?.autoSave !== false) {
        this.saveGame(SaveManager.AUTO_SAVE_SLOT_ID, gameData, 'Auto Save');
      }
    }, this.autoSaveInterval);
  }

  /**
   * Stop auto-save functionality
   */
  stopAutoSave(): void {
    if (this.autoSaveTimer) {
      clearInterval(this.autoSaveTimer);
      this.autoSaveTimer = null;
    }
  }

  /**
   * Set auto-save interval
   */
  setAutoSaveInterval(minutes: number): void {
    this.autoSaveInterval = minutes * 60 * 1000;
    // If auto-save is running, restart it with new interval
    if (this.autoSaveTimer) {
      // Will need to restart with the game data provider
      // This would be handled by the caller
    }
  }

  /**
   * Export save data as a file
   */
  async exportSave(slotId: string): Promise<string | null> {
    try {
      const saveData = await this.loadGame(slotId);
      if (!saveData) return null;
      
      return JSON.stringify(saveData, null, 2);
      
    } catch (error) {
      console.error('Failed to export save:', error);
      return null;
    }
  }

  /**
   * Import save data from text
   */
  async importSave(saveDataText: string, slotId?: string): Promise<boolean> {
    try {
      const saveData: GameSaveData = JSON.parse(saveDataText);
      
      if (!this.validateSaveData(saveData)) {
        throw new Error('Invalid save data format');
      }
      
      const targetSlotId = slotId || this.findEmptySlot() || 'imported_' + Date.now();
      return await this.saveGame(targetSlotId, saveData, 'Imported Save');
      
    } catch (error) {
      console.error('Failed to import save:', error);
      return false;
    }
  }

  /**
   * Check if localStorage is available
   */
  isStorageAvailable(): boolean {
    try {
      const test = '__storage_test__';
      localStorage.setItem(test, test);
      localStorage.removeItem(test);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Get storage usage information
   */
  getStorageInfo(): { used: number; available: number; percentage: number } {
    try {
      // Rough estimation of localStorage usage
      let used = 0;
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith(SaveManager.STORAGE_KEY_PREFIX)) {
          const value = localStorage.getItem(key);
          used += (key.length + (value?.length || 0)) * 2; // Rough byte estimation
        }
      }
      
      // Most browsers allow ~5-10MB for localStorage
      const estimated = 5 * 1024 * 1024; // 5MB estimate
      
      return {
        used,
        available: estimated,
        percentage: (used / estimated) * 100
      };
    } catch {
      return { used: 0, available: 0, percentage: 0 };
    }
  }

  /**
   * Clean up old saves if storage is getting full
   */
  cleanupOldSaves(): void {
    const storageInfo = this.getStorageInfo();
    if (storageInfo.percentage > 80) {
      const slots = this.getSaveSlots();
      const oldSlots = slots
        .filter(slot => !slot.isAutoSave)
        .sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
      
      // Delete oldest saves until we're under 60% storage
      while (oldSlots.length > 0 && this.getStorageInfo().percentage > 60) {
        const oldestSlot = oldSlots.shift();
        if (oldestSlot) {
          this.deleteSave(oldestSlot.id);
        }
      }
    }
  }

  /**
   * Validate save data structure
   */
  private validateSaveData(data: unknown): data is GameSaveData {
    if (!data || typeof data !== 'object') return false;
    const saveData = data as Record<string, unknown>;
    return !!(saveData &&
           typeof saveData.version === 'string' &&
           saveData.timestamp &&
           typeof saveData.playerName === 'string' &&
           typeof saveData.playtimeMs === 'number' &&
           saveData.world &&
           saveData.time &&
           saveData.player &&
           saveData.settings);
  }

  /**
   * Get default game settings
   */
  private getDefaultSettings(): GameSaveData['settings'] {
    return {
      graphics: {
        quality: 'medium',
        antialiasing: true,
        particles: true
      },
      audio: {
        masterVolume: 1.0,
        musicVolume: 0.7,
        effectsVolume: 0.8,
        muted: false
      },
      controls: {
        keyBindings: {
          moveUp: 'KeyW',
          moveDown: 'KeyS',
          moveLeft: 'KeyA',
          moveRight: 'KeyD',
          zoomIn: 'Equal',
          zoomOut: 'Minus',
          navigation: 'KeyN',
          pause: 'Space'
        },
        mouseSensitivity: 1.0,
        touchSensitivity: 1.0
      },
      gameplay: {
        autoSave: true,
        autoSaveInterval: 5,
        difficulty: 'normal',
        pauseOnLostFocus: true
      }
    };
  }

  /**
   * Load settings from localStorage
   */
  private loadSettings(): void {
    try {
      const settingsData = localStorage.getItem(SaveManager.SETTINGS_KEY);
      if (settingsData) {
        // Settings loading logic would go here
        // For now, just verify it's valid JSON
        JSON.parse(settingsData);
      }
    } catch (error) {
      console.warn('Failed to load settings, using defaults:', error);
    }
  }

  /**
   * Format playtime for display
   */
  private formatPlaytime(ms: number): string {
    const hours = Math.floor(ms / (1000 * 60 * 60));
    const minutes = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  }

  /**
   * Get location string for display
   */
  private getLocationString(location: { sectorId: string; systemId: string; stationId?: string }): string {
    let locationStr = `${location.systemId}`;
    if (location.stationId) {
      locationStr += ` (${location.stationId})`;
    }
    return locationStr;
  }

  /**
   * Find an empty save slot
   */
  private findEmptySlot(): string | null {
    const existingSlots = this.getSaveSlots();
    for (let i = 1; i <= SaveManager.MAX_SAVE_SLOTS; i++) {
      const slotId = `slot_${i}`;
      if (!existingSlots.find(slot => slot.id === slotId)) {
        return slotId;
      }
    }
    return null;
  }

  /**
   * Compress save data for efficient storage
   */
  private async compressSaveData(saveData: GameSaveData): Promise<string> {
    // Simple text compression - reduce JSON size by removing unnecessary whitespace
    // and using a more compact format
    const jsonString = JSON.stringify(saveData);
    
    // For larger saves, we could implement LZW compression or similar
    // For now, we'll use efficient JSON stringification
    return jsonString;
  }

  /**
   * Decompress save data
   */
  private async decompressSaveData(compressedData: string): Promise<GameSaveData> {
    // For now, this is just JSON parsing, but could be extended with decompression
    return JSON.parse(compressedData);
  }
}