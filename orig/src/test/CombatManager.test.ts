import { describe, test, expect, beforeEach, vi } from 'vitest';
import { CombatManager } from '../systems/CombatManager';
import { TimeManager } from '../systems/TimeManager';
import { WorldManager } from '../systems/WorldManager';
import { PlayerManager } from '../systems/PlayerManager';
import { FactionManager } from '../systems/FactionManager';
import { SecurityManager } from '../systems/SecurityManager';
import { NPCAIManager } from '../systems/NPCAIManager';
import { EventManager } from '../systems/EventManager';

// Mock dependencies
const mockTimeManager = {
  getCurrentTimestamp: vi.fn(() => Date.now()),
  getCurrentTime: vi.fn(() => new Date()),
  update: vi.fn()
} as unknown as TimeManager;

const mockWorldManager = {
  getAllStations: vi.fn(() => [
    { id: 'test-station', name: 'Test Station', faction: 'Test Faction', systemId: 'test-system' }
  ]),
  getSystem: vi.fn(() => ({ controllingFaction: 'Test Faction' })),
  getGalaxy: vi.fn(() => ({ currentPlayerLocation: { systemId: 'test-system' } }))
} as unknown as WorldManager;

const mockPlayerManager = {
  getCredits: vi.fn(() => 10000),
  spendCredits: vi.fn(() => true),
  addCredits: vi.fn(),
  getCurrentStation: vi.fn(() => 'test-station'),
  getPlayerShip: vi.fn(() => ({
    id: 'player-ship',
    name: 'Player Ship',
    class: 'courier',
    hull: 100,
    maxHull: 100,
    shields: 50,
    maxShields: 50
  }))
} as unknown as PlayerManager;

const mockFactionManager = {
  modifyReputation: vi.fn(),
  getReputation: vi.fn(() => 0)
} as unknown as FactionManager;

const mockSecurityManager = {
  reportCrime: vi.fn(),
  getCrimes: vi.fn(() => []),
  update: vi.fn()
} as unknown as SecurityManager;

const mockNPCAIManager = {
  getNPCs: vi.fn(() => []),
  update: vi.fn()
} as unknown as NPCAIManager;

const mockEventManager = {
  update: vi.fn(),
  triggerEvent: vi.fn()
} as unknown as EventManager;

describe('CombatManager', () => {
  let combatManager: CombatManager;

  beforeEach(() => {
    vi.clearAllMocks();
    
    // Re-setup default mock behavior after clearing
    (mockPlayerManager.spendCredits as any).mockReturnValue(true);
    (mockPlayerManager.getCredits as any).mockReturnValue(10000);
    (mockPlayerManager.getCurrentStation as any).mockReturnValue('test-station');
    
    combatManager = new CombatManager(
      mockTimeManager,
      mockWorldManager,
      mockPlayerManager,
      mockFactionManager,
      mockSecurityManager,
      mockNPCAIManager,
      mockEventManager
    );
  });

  describe('System Initialization', () => {
    test('should initialize with default combat state', () => {
      const combatState = combatManager.getCombatState();
      
      expect(combatState).toBeDefined();
      expect(combatState.activeEncounters).toBeInstanceOf(Map);
      expect(combatState.combatHistory).toEqual([]);
      expect(combatState.playerWeapons).toEqual([]);
      expect(combatState.playerLicenses).toEqual([]);
      expect(combatState.stats).toBeDefined();
      expect(combatState.stats.encountersTotal).toBe(0);
    });

    test('should initialize weapon database', () => {
      const weapons = combatManager.getAvailableWeapons();
      
      expect(weapons).toBeDefined();
      expect(weapons.length).toBeGreaterThan(0);
      
      // Check for different weapon types
      const energyWeapons = weapons.filter(w => w.type === 'energy');
      const kineticWeapons = weapons.filter(w => w.type === 'kinetic');
      const missileWeapons = weapons.filter(w => w.type === 'missile');
      
      expect(energyWeapons.length).toBeGreaterThan(0);
      expect(kineticWeapons.length).toBeGreaterThan(0);
      expect(missileWeapons.length).toBeGreaterThan(0);
    });

    test('should initialize shield database', () => {
      const shields = combatManager.getAvailableShields();
      
      expect(shields).toBeDefined();
      expect(shields.length).toBeGreaterThan(0);
      
      // Check for different shield types
      const magneticShields = shields.filter(s => s.type === 'magnetic');
      const adaptiveShields = shields.filter(s => s.type === 'adaptive');
      const ablativeShields = shields.filter(s => s.type === 'ablative');
      
      expect(magneticShields.length).toBeGreaterThan(0);
      expect(adaptiveShields.length).toBeGreaterThan(0);
      expect(ablativeShields.length).toBeGreaterThan(0);
    });
  });

  describe('Encounter Generation', () => {
    test('should generate pirate attack encounter', () => {
      const encounter = combatManager.generateEncounter('pirate-attack', 'test-system');
      
      expect(encounter).toBeDefined();
      expect(encounter.type).toBe('pirate-attack');
      expect(encounter.location.systemId).toBe('test-system');
      expect(encounter.participants.length).toBeGreaterThan(1); // Player + pirates
      expect(encounter.status).toBe('active');
      
      // Check for player participant
      const playerParticipant = encounter.participants.find(p => p.type === 'player');
      expect(playerParticipant).toBeDefined();
      expect(playerParticipant?.id).toBe('player');
      
      // Check for AI pirates
      const pirateParticipants = encounter.participants.filter(p => p.type === 'ai' && p.faction === 'pirates');
      expect(pirateParticipants.length).toBeGreaterThan(0);
    });

    test('should generate patrol inspection encounter', () => {
      const encounter = combatManager.generateEncounter('patrol-inspection', 'test-system');
      
      expect(encounter).toBeDefined();
      expect(encounter.type).toBe('patrol-inspection');
      expect(encounter.participants.length).toBe(2); // Player + patrol
      
      const patrolParticipant = encounter.participants.find(p => p.id === 'patrol-ship');
      expect(patrolParticipant).toBeDefined();
      expect(patrolParticipant?.type).toBe('ai');
    });

    test('should track active encounters', () => {
      const initialCount = combatManager.getActiveEncounters().length;
      
      combatManager.generateEncounter('pirate-attack', 'test-system');
      combatManager.generateEncounter('patrol-inspection', 'test-system');
      
      const activeEncounters = combatManager.getActiveEncounters();
      expect(activeEncounters.length).toBe(initialCount + 2);
      
      const combatState = combatManager.getCombatState();
      expect(combatState.stats.encountersTotal).toBe(2);
    });
  });

  describe('Combat Actions', () => {
    let encounter: any;

    beforeEach(() => {
      encounter = combatManager.generateEncounter('pirate-attack', 'test-system');
    });

    test('should execute attack action', () => {
      const playerParticipant = encounter.participants.find((p: any) => p.type === 'player');
      const targetParticipant = encounter.participants.find((p: any) => p.type === 'ai');
      
      const attackAction = {
        id: 'test-attack',
        actorId: playerParticipant.id,
        type: 'attack' as const,
        targetId: targetParticipant.id,
        parameters: { weaponId: 'pulse-laser-mk1' },
        timestamp: Date.now(),
        resolved: false
      };

      const result = combatManager.executeCombatAction(attackAction);
      
      expect(result).toBeDefined();
      expect(result.action).toEqual(attackAction);
      expect(typeof result.success).toBe('boolean');
      expect(result.message).toBeDefined();
    });

    test('should handle retreat action', () => {
      const playerParticipant = encounter.participants.find((p: any) => p.type === 'player');
      
      const retreatAction = {
        id: 'test-retreat',
        actorId: playerParticipant.id,
        type: 'retreat' as const,
        parameters: {},
        timestamp: Date.now(),
        resolved: false
      };

      const result = combatManager.executeCombatAction(retreatAction);
      
      expect(result).toBeDefined();
      expect(result.success).toBe(true);
      expect(result.message).toContain('fled');
      
      // Check that participant status changed
      expect(playerParticipant.status).toBe('fled');
    });

    test('should fail action for invalid actor', () => {
      const invalidAction = {
        id: 'test-invalid',
        actorId: 'nonexistent',
        type: 'attack' as const,
        parameters: {},
        timestamp: Date.now(),
        resolved: false
      };

      const result = combatManager.executeCombatAction(invalidAction);
      
      expect(result).toBeDefined();
      expect(result.success).toBe(false);
      expect(result.message).toBe('Actor not found');
    });
  });

  describe('Weapon System', () => {
    test('should purchase weapons successfully', () => {
      const initialWeaponCount = combatManager.getCombatState().playerWeapons.length;
      
      const success = combatManager.purchaseWeapon('pulse-laser-mk1');
      
      expect(success).toBe(true);
      expect(mockPlayerManager.spendCredits).toHaveBeenCalled();
      
      const combatState = combatManager.getCombatState();
      expect(combatState.playerWeapons.length).toBe(initialWeaponCount + 1);
    });

    test('should fail weapon purchase with insufficient credits', () => {
      (mockPlayerManager.spendCredits as any).mockReturnValue(false);
      
      const success = combatManager.purchaseWeapon('plasma-cannon-mk2');
      
      expect(success).toBe(false);
      expect(combatManager.getCombatState().playerWeapons.length).toBe(0);
    });

    test('should fail weapon purchase for invalid weapon', () => {
      const success = combatManager.purchaseWeapon('nonexistent-weapon');
      
      expect(success).toBe(false);
      expect(mockPlayerManager.spendCredits).not.toHaveBeenCalled();
    });
  });

  describe('Weapon Licensing', () => {
    test('should purchase weapon license successfully', () => {
      const success = combatManager.purchaseWeaponLicense('commercial');
      
      expect(success).toBe(true);
      expect(mockPlayerManager.spendCredits).toHaveBeenCalled();
      
      const licenses = combatManager.getPlayerLicenses();
      expect(licenses.length).toBe(1);
      expect(licenses[0].licenseType).toBe('commercial');
      expect(licenses[0].status).toBe('active');
    });

    test('should fail license purchase with insufficient credits', () => {
      (mockPlayerManager.spendCredits as any).mockReturnValue(false);
      
      const success = combatManager.purchaseWeaponLicense('military');
      
      expect(success).toBe(false);
      expect(combatManager.getPlayerLicenses().length).toBe(0);
    });

    test('should check weapon usage legality', () => {
      // Civilian weapon should be legal without license
      const canUseCivilian = combatManager.canUseWeapon('pulse-laser-mk1', 'test-location');
      expect(canUseCivilian).toBe(true);
      
      // Military weapon should require license
      const canUseMilitary = combatManager.canUseWeapon('torpedo-launcher-mk3', 'test-location');
      expect(canUseMilitary).toBe(false);
      
      // After purchasing license
      combatManager.purchaseWeaponLicense('military');
      const canUseMilitaryWithLicense = combatManager.canUseWeapon('torpedo-launcher-mk3', 'test-location');
      expect(canUseMilitaryWithLicense).toBe(true);
    });

    test('should handle license expiry', () => {
      // First set current time for license purchase
      const currentTime = Date.now();
      (mockTimeManager.getCurrentTimestamp as any).mockReturnValue(currentTime);
      
      combatManager.purchaseWeaponLicense('commercial');
      
      // Now set time to future to make license expired
      const expiredTime = currentTime + 400 * 24 * 60 * 60 * 1000; // 400 days later (commercial license is 365 days)
      (mockTimeManager.getCurrentTimestamp as any).mockReturnValue(expiredTime);
      
      const canUseWeapon = combatManager.canUseWeapon('plasma-cannon-mk2', 'test-location');
      expect(canUseWeapon).toBe(false);
      
      const licenses = combatManager.getPlayerLicenses();
      expect(licenses[0].status).toBe('expired');
    });
  });

  describe('Random Encounters', () => {
    test('should trigger random encounter', () => {
      const encounter = combatManager.triggerRandomEncounter();
      
      expect(encounter).toBeDefined();
      expect(encounter?.type).toMatch(/pirate-attack|patrol-inspection|bounty-hunter/);
      expect(encounter?.location.systemId).toBe('test-system');
    });

    test('should fail to trigger encounter without current system', () => {
      (mockPlayerManager.getCurrentStation as any).mockReturnValue(null);
      
      const encounter = combatManager.triggerRandomEncounter();
      
      expect(encounter).toBeNull();
    });
  });

  describe('Combat Statistics', () => {
    test('should track encounter statistics', () => {
      const initialStats = combatManager.getCombatStats();
      expect(initialStats.encountersTotal).toBe(0);
      expect(initialStats.encountersWon).toBe(0);
      
      // Generate encounters to test statistics
      combatManager.generateEncounter('pirate-attack', 'test-system');
      
      const updatedStats = combatManager.getCombatStats();
      expect(updatedStats.encountersTotal).toBe(1);
    });

    test('should track weapon firing statistics', () => {
      const encounter = combatManager.generateEncounter('pirate-attack', 'test-system');
      const playerParticipant = encounter.participants.find((p: any) => p.type === 'player');
      const targetParticipant = encounter.participants.find((p: any) => p.type === 'ai');
      
      const attackAction = {
        id: 'test-attack',
        actorId: playerParticipant.id,
        type: 'attack' as const,
        targetId: targetParticipant.id,
        parameters: { weaponId: 'pulse-laser-mk1' },
        timestamp: Date.now(),
        resolved: false
      };

      combatManager.executeCombatAction(attackAction);
      
      const stats = combatManager.getCombatStats();
      expect(stats.weaponsFired).toBe(1);
    });
  });

  describe('System Updates', () => {
    test('should update without errors', () => {
      // Generate some encounters
      combatManager.generateEncounter('pirate-attack', 'test-system');
      combatManager.generateEncounter('patrol-inspection', 'test-system');
      
      // Should not throw errors
      expect(() => combatManager.update()).not.toThrow();
    });

    test('should timeout old encounters', () => {
      const encounter = combatManager.generateEncounter('pirate-attack', 'test-system');
      
      // Mock old timestamp
      encounter.startTime = Date.now() - (35 * 60 * 1000); // 35 minutes ago
      
      combatManager.update();
      
      const activeEncounters = combatManager.getActiveEncounters();
      expect(activeEncounters.length).toBe(0);
    });
  });

  describe('Serialization', () => {
    test('should serialize and deserialize state', () => {
      // Set up some state
      combatManager.purchaseWeapon('pulse-laser-mk1');
      combatManager.purchaseWeaponLicense('commercial');
      combatManager.generateEncounter('pirate-attack', 'test-system');
      
      const serialized = combatManager.serialize();
      expect(serialized).toBeDefined();
      expect(serialized.combatState).toBeDefined();
      
      // Re-setup mocks for the new instance
      (mockPlayerManager.spendCredits as any).mockReturnValue(true);
      (mockPlayerManager.getCredits as any).mockReturnValue(10000);
      (mockPlayerManager.getCurrentStation as any).mockReturnValue('test-station');
      
      // Create new combat manager and deserialize
      const newCombatManager = new CombatManager(
        mockTimeManager,
        mockWorldManager,
        mockPlayerManager,
        mockFactionManager,
        mockSecurityManager,
        mockNPCAIManager,
        mockEventManager
      );
      
      newCombatManager.deserialize(serialized);
      
      const deserializedState = newCombatManager.getCombatState();
      expect(deserializedState.playerWeapons.length).toBe(1);
      expect(deserializedState.playerLicenses.length).toBe(1);
    });
  });
});