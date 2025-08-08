import { describe, it, expect, beforeEach, vi } from 'vitest';
import { HackingManager } from '../systems/HackingManager';
import { TimeManager } from '../systems/TimeManager';
import { WorldManager } from '../systems/WorldManager';
import { PlayerManager } from '../systems/PlayerManager';
import { FactionManager } from '../systems/FactionManager';
import { SecurityManager } from '../systems/SecurityManager';
import { CharacterManager } from '../systems/CharacterManager';

describe('HackingManager', () => {
  let hackingManager: HackingManager;
  let timeManager: TimeManager;
  let worldManager: WorldManager;
  let playerManager: PlayerManager;
  let factionManager: FactionManager;
  let securityManager: SecurityManager;
  let characterManager: CharacterManager;

  beforeEach(() => {
    timeManager = new TimeManager();
    worldManager = new WorldManager();
    playerManager = new PlayerManager();
    factionManager = playerManager.getFactionManager();
    characterManager = new CharacterManager();

    // Mock SecurityManager to avoid complex dependency chain
    securityManager = {
      reportCrime: vi.fn(),
      getPlayerLegalStatus: vi.fn(() => ({
        overall: 'clean',
        activeWarrants: 0,
        totalBounty: 0,
        factionStatus: {}
      })),
      update: vi.fn()
    } as any;

    hackingManager = new HackingManager(
      timeManager,
      worldManager,
      playerManager,
      factionManager,
      securityManager,
      characterManager
    );
  });

  describe('Equipment Management', () => {
    it('should initialize with available equipment', () => {
      const equipment = hackingManager.getAvailableEquipment();
      expect(equipment.length).toBeGreaterThan(0);
      
      const basicEquipment = equipment.find(eq => eq.id === 'handheld-basic');
      expect(basicEquipment).toBeDefined();
      expect(basicEquipment?.name).toBe('Basic Handheld Computer');
      expect(basicEquipment?.capabilities.maxAccessLevel).toBe(1);
    });

    it('should initialize with available software', () => {
      const software = hackingManager.getAvailableSoftware();
      expect(software.length).toBeGreaterThan(0);
      
      const passwordCracker = software.find(sw => sw.id === 'password-cracker-1');
      expect(passwordCracker).toBeDefined();
      expect(passwordCracker?.category).toBe('intrusion');
      expect(passwordCracker?.type).toBe('password-cracker');
    });

    it('should allow purchasing equipment when player has sufficient credits', () => {
      // Give player enough credits
      playerManager.addCredits(5000);
      
      const result = hackingManager.purchaseEquipment('handheld-basic');
      expect(result).toBe(true);
      
      const hackingState = hackingManager.getHackingState();
      expect(hackingState.ownedEquipment.length).toBe(1);
      expect(hackingState.ownedEquipment[0].id).toBe('handheld-basic');
    });

    it('should reject equipment purchase when player lacks credits', () => {
      // Try to buy expensive equipment that costs more than 10,000 credits  
      const result = hackingManager.purchaseEquipment('military-cyber-suite'); // Costs 75,000 credits
      expect(result).toBe(false);
      
      const hackingState = hackingManager.getHackingState();
      expect(hackingState.ownedEquipment.length).toBe(0);
    });

    it('should allow purchasing software when player has sufficient credits', () => {
      // Give player enough credits
      playerManager.addCredits(1000);
      
      const result = hackingManager.purchaseSoftware('password-cracker-1');
      expect(result).toBe(true);
      
      const hackingState = hackingManager.getHackingState();
      expect(hackingState.ownedSoftware.length).toBe(1);
      expect(hackingState.ownedSoftware[0].id).toBe('password-cracker-1');
    });

    it('should reject software purchase when player lacks credits', () => {
      // Spend most of player's credits first
      playerManager.spendCredits(9500); // Leave only 500 credits
      
      // Try to buy expensive software that costs more than remaining credits
      const result = hackingManager.purchaseSoftware('privilege-escalation-3'); // Costs 8,000 credits
      expect(result).toBe(false);
      
      const hackingState = hackingManager.getHackingState();
      expect(hackingState.ownedSoftware.length).toBe(0);
    });
  });

  describe('Target Management', () => {
    it('should initialize targets for all stations', () => {
      const targets = hackingManager.getAvailableTargets();
      expect(targets.length).toBeGreaterThan(0);
      
      // Should have multiple target types per station
      const securityTargets = targets.filter(t => t.type === 'station-security');
      const economicTargets = targets.filter(t => t.type === 'station-economic');
      
      expect(securityTargets.length).toBeGreaterThan(0);
      expect(economicTargets.length).toBeGreaterThan(0);
    });

    it('should have properly configured security levels', () => {
      const targets = hackingManager.getAvailableTargets();
      const securityTarget = targets.find(t => t.type === 'station-security');
      
      expect(securityTarget).toBeDefined();
      expect(securityTarget!.security.accessLevel).toBeGreaterThan(1); // Security targets should be well-protected
      expect(securityTarget!.security.countermeasures).toBe(true);
    });

    it('should have appropriate value ratings', () => {
      const targets = hackingManager.getAvailableTargets();
      
      targets.forEach(target => {
        expect(target.value.informationWorth).toBeGreaterThan(0);
        expect(target.value.strategicValue).toBeGreaterThan(0);
        expect(target.value.riskLevel).toBeGreaterThan(0);
        expect(target.value.riskLevel).toBeLessThanOrEqual(10);
      });
    });
  });

  describe('Hacking Attempts', () => {
    beforeEach(() => {
      // Give player equipment and software for testing
      playerManager.addCredits(10000);
      hackingManager.purchaseEquipment('handheld-basic');
      hackingManager.purchaseSoftware('password-cracker-1');
    });

    it('should start a hacking attempt with valid parameters', () => {
      const targets = hackingManager.getAvailableTargets();
      const target = targets.find(t => t.security.accessLevel <= 1); // Find a target the basic equipment can handle
      
      if (target) {
        const attempt = hackingManager.startHackingAttempt(
          target.id,
          'handheld-basic',
          ['password-cracker-1']
        );
        
        expect(attempt).toBeDefined();
        expect(attempt?.targetId).toBe(target.id);
        expect(attempt?.status).toBe('active');
        expect(attempt?.phase).toBe('reconnaissance');
      }
    });

    it('should reject hacking attempt if equipment cannot handle target security', () => {
      const targets = hackingManager.getAvailableTargets();
      const highSecurityTarget = targets.find(t => t.security.accessLevel > 1);
      
      if (highSecurityTarget) {
        const attempt = hackingManager.startHackingAttempt(
          highSecurityTarget.id,
          'handheld-basic',
          ['password-cracker-1']
        );
        
        expect(attempt).toBeNull();
      }
    });

    it('should reject hacking attempt if player does not own equipment', () => {
      const targets = hackingManager.getAvailableTargets();
      const target = targets[0];
      
      const attempt = hackingManager.startHackingAttempt(
        target.id,
        'professional-rig', // Player doesn't own this
        ['password-cracker-1']
      );
      
      expect(attempt).toBeNull();
    });

    it('should track active attempts', () => {
      const targets = hackingManager.getAvailableTargets();
      const target = targets.find(t => t.security.accessLevel <= 1);
      
      if (target) {
        hackingManager.startHackingAttempt(
          target.id,
          'handheld-basic',
          ['password-cracker-1']
        );
        
        const activeAttempts = hackingManager.getActiveAttempts();
        expect(activeAttempts.length).toBe(1);
      }
    });
  });

  describe('Minigame Generation', () => {
    beforeEach(() => {
      // Set up for hacking attempt
      playerManager.addCredits(10000);
      hackingManager.purchaseEquipment('handheld-basic');
      hackingManager.purchaseSoftware('password-cracker-1');
    });

    it('should generate appropriate minigames for each phase', () => {
      const targets = hackingManager.getAvailableTargets();
      const target = targets.find(t => t.security.accessLevel <= 1);
      
      if (target) {
        const attempt = hackingManager.startHackingAttempt(
          target.id,
          'handheld-basic',
          ['password-cracker-1']
        );
        
        if (attempt) {
          const minigame = hackingManager.generateMinigame(attempt.id);
          
          expect(minigame).toBeDefined();
          expect(minigame?.type).toBe('pattern-match'); // Reconnaissance phase
          expect(minigame?.difficulty).toBeGreaterThan(0);
          expect(minigame?.parameters).toBeDefined();
        }
      }
    });

    it('should have appropriate difficulty scaling', () => {
      const targets = hackingManager.getAvailableTargets();
      const easyTarget = targets.find(t => t.security.accessLevel <= 1);
      const hardTarget = targets.find(t => t.security.accessLevel >= 3);
      
      if (easyTarget && hardTarget) {
        // Test with professional equipment that can handle both
        playerManager.addCredits(20000);
        hackingManager.purchaseEquipment('professional-rig');
        
        const easyAttempt = hackingManager.startHackingAttempt(
          easyTarget.id,
          'professional-rig',
          ['password-cracker-1']
        );
        
        const hardAttempt = hackingManager.startHackingAttempt(
          hardTarget.id,
          'professional-rig',
          ['password-cracker-1']
        );
        
        if (easyAttempt && hardAttempt) {
          const easyMinigame = hackingManager.generateMinigame(easyAttempt.id);
          const hardMinigame = hackingManager.generateMinigame(hardAttempt.id);
          
          expect(hardMinigame?.difficulty).toBeGreaterThan(easyMinigame?.difficulty || 0);
        }
      }
    });
  });

  describe('Data Markets', () => {
    it('should initialize with available data markets', () => {
      const markets = hackingManager.getAvailableDataMarkets();
      expect(markets.length).toBeGreaterThan(0);
      
      const market = markets[0];
      expect(market.name).toBeDefined();
      expect(market.location).toBeDefined();
      expect(market.reputation).toBeDefined();
    });

    it('should filter markets by accessibility', () => {
      const allMarkets = Array.from((hackingManager as any).dataMarkets.values());
      const accessibleMarkets = hackingManager.getAvailableDataMarkets();
      
      // Player starts with neutral reputation, so some markets might be inaccessible
      expect(accessibleMarkets.length).toBeLessThanOrEqual(allMarkets.length);
    });
  });

  describe('Electronic Warfare', () => {
    beforeEach(() => {
      // Set up character with advanced hacking skills
      const character = {
        id: 'test-character',
        name: 'Test Hacker',
        appearance: { gender: 'other', age: 30, physique: 'average', style: 'professional' },
        background: 'engineer',
        attributes: { intelligence: 15, charisma: 10, constitution: 10, dexterity: 10, perception: 12, willpower: 8 },
        skills: { 
          trading: 10, negotiation: 5, economics: 5,
          engineering: 30, piloting: 15, navigation: 10,
          combat: 5, tactics: 5, security: 50,
          networking: 20, investigation: 15, leadership: 5
        },
        personalEquipment: { 
          suit: null, helmet: null, gloves: null, boots: null, 
          communicator: null, scanner: null, toolkit: null, 
          weapon: null, datapad: null, medkit: null 
        },
        progression: {
          experience: 1000,
          level: 5,
          skillPoints: 0,
          attributePoints: 0,
          experienceToNext: 6000,
          totalSkillPointsSpent: 100,
          totalAttributePointsSpent: 0
        },
        biography: 'Test character'
      };
      characterManager.loadCharacter(character);
      
      // Give player warfare software
      playerManager.addCredits(20000);
      hackingManager.purchaseSoftware('system-disruptor-3');
    });

    it('should allow electronic warfare with sufficient skills', () => {
      const warfare = hackingManager.launchElectronicAttack('target-ship', 'system-disruption');
      
      expect(warfare).toBeDefined();
      expect(warfare?.type).toBe('system-disruption');
      expect(warfare?.effectiveness).toBeGreaterThan(0);
    });

    it('should reject electronic warfare without sufficient skills', () => {
      // Reset character to low skill level
      const character = {
        id: 'test-character',
        name: 'Test Novice',
        appearance: { gender: 'other', age: 25, physique: 'average', style: 'casual' },
        background: 'merchant',
        attributes: { intelligence: 10, charisma: 10, constitution: 10, dexterity: 10, perception: 10, willpower: 10 },
        skills: { 
          trading: 30, negotiation: 20, economics: 10,
          engineering: 10, piloting: 15, navigation: 10,
          combat: 5, tactics: 5, security: 10,
          networking: 20, investigation: 5, leadership: 10
        },
        personalEquipment: { 
          suit: null, helmet: null, gloves: null, boots: null, 
          communicator: null, scanner: null, toolkit: null, 
          weapon: null, datapad: null, medkit: null 
        },
        progression: {
          experience: 100,
          level: 1,
          skillPoints: 0,
          attributePoints: 0,
          experienceToNext: 1000,
          totalSkillPointsSpent: 10,
          totalAttributePointsSpent: 0
        },
        biography: 'Test character'
      };
      characterManager.loadCharacter(character);
      
      const warfare = hackingManager.launchElectronicAttack('target-ship', 'system-disruption');
      
      expect(warfare).toBeNull();
    });
  });

  describe('Statistics and Progress', () => {
    it('should initialize with default statistics', () => {
      const stats = hackingManager.getHackingStats();
      
      expect(stats.attemptsTotal).toBe(0);
      expect(stats.attemptsSuccessful).toBe(0);
      expect(stats.skillLevel).toBe(1);
      expect(stats.experience).toBe(0);
      expect(stats.creditsEarned).toBe(0);
    });

    it('should update statistics after hacking attempts', () => {
      // Set up and start a hacking attempt
      playerManager.addCredits(10000);
      hackingManager.purchaseEquipment('handheld-basic');
      hackingManager.purchaseSoftware('password-cracker-1');
      
      const targets = hackingManager.getAvailableTargets();
      const target = targets.find(t => t.security.accessLevel <= 1);
      
      if (target) {
        const attempt = hackingManager.startHackingAttempt(
          target.id,
          'handheld-basic',
          ['password-cracker-1']
        );
        
        if (attempt) {
          const stats = hackingManager.getHackingStats();
          expect(stats.attemptsTotal).toBe(1);
        }
      }
    });
  });

  describe('Serialization', () => {
    it('should serialize hacking state correctly', () => {
      // Set up some state
      playerManager.addCredits(10000);
      hackingManager.purchaseEquipment('handheld-basic');
      hackingManager.purchaseSoftware('password-cracker-1');
      
      const serialized = hackingManager.serialize();
      
      expect(serialized).toBeDefined();
      expect(serialized.hackingState).toBeDefined();
      expect(serialized.hackingState.ownedEquipment).toBeDefined();
      expect(serialized.hackingState.ownedSoftware).toBeDefined();
    });

    it('should deserialize hacking state correctly', () => {
      const testData = {
        hackingState: {
          activeAttempts: [],
          activeSessions: [],
          ownedEquipment: [{ id: 'handheld-basic', name: 'Test Equipment' }],
          ownedSoftware: [{ id: 'password-cracker-1', name: 'Test Software' }],
          stolenData: [],
          systemAccess: [],
          stats: {
            attemptsTotal: 5,
            attemptsSuccessful: 3,
            skillLevel: 2,
            experience: 500
          },
          knownMarkets: ['test-market'],
          marketReputation: [['test-market', 10]],
          activeWarrants: [],
          criminalRecord: []
        },
        nextAttemptId: 10,
        nextSessionId: 5,
        nextDataId: 15
      };
      
      hackingManager.deserialize(testData);
      
      const hackingState = hackingManager.getHackingState();
      expect(hackingState.stats.attemptsTotal).toBe(5);
      expect(hackingState.stats.attemptsSuccessful).toBe(3);
      expect(hackingState.stats.skillLevel).toBe(2);
      expect(hackingState.knownMarkets).toContain('test-market');
    });
  });

  describe('System Updates', () => {
    it('should handle system updates without errors', () => {
      // Set up some active state
      playerManager.addCredits(10000);
      hackingManager.purchaseEquipment('handheld-basic');
      hackingManager.purchaseSoftware('password-cracker-1');
      
      const targets = hackingManager.getAvailableTargets();
      const target = targets.find(t => t.security.accessLevel <= 1);
      
      if (target) {
        hackingManager.startHackingAttempt(
          target.id,
          'handheld-basic',
          ['password-cracker-1']
        );
      }
      
      // Should not throw errors
      expect(() => hackingManager.update()).not.toThrow();
    });

    it('should age data over time', () => {
      const hackingState = hackingManager.getHackingState();
      
      // Add some test data
      hackingState.stolenData.push({
        id: 'test-data',
        type: 'market-intelligence',
        sourceTargetId: 'test-target',
        quality: 5,
        freshness: 1, // 1 hour old
        marketValue: 5000,
        content: { title: 'Test Data', description: 'Test', details: {} },
        restrictions: { sellable: true, factionSensitive: [], legalRisk: 1 }
      });
      
      const initialFreshness = hackingState.stolenData[0].freshness;
      
      // Run update cycle
      hackingManager.update();
      
      const newFreshness = hackingState.stolenData[0].freshness;
      expect(newFreshness).toBeGreaterThan(initialFreshness);
    });
  });

  describe('Integration with Other Systems', () => {
    it('should report crimes to security manager when detected', () => {
      // Set up a hacking attempt that will trigger detection
      playerManager.addCredits(10000);
      hackingManager.purchaseEquipment('handheld-basic');
      hackingManager.purchaseSoftware('password-cracker-1');
      
      const targets = hackingManager.getAvailableTargets();
      const target = targets.find(t => t.security.accessLevel <= 1);
      
      if (target) {
        const attempt = hackingManager.startHackingAttempt(
          target.id,
          'handheld-basic',
          ['password-cracker-1']
        );
        
        if (attempt) {
          // Force detection by setting high risk
          attempt.detection.riskAccumulated = 100;
          attempt.detection.detected = true;
          
          // This would normally be called internally
          (hackingManager as any).handleDetection(attempt.id);
          
          // Should have reported crime to security manager
          expect(securityManager.reportCrime).toHaveBeenCalled();
        }
      }
    });

    it('should interact with player credits correctly', () => {
      const initialCredits = playerManager.getCredits();
      
      // Purchase equipment
      playerManager.addCredits(5000);
      const result = hackingManager.purchaseEquipment('handheld-basic');
      
      expect(result).toBe(true);
      
      const finalCredits = playerManager.getCredits();
      expect(finalCredits).toBeLessThan(initialCredits + 5000); // Credits should be deducted
    });
  });

  describe('Error Handling', () => {
    it('should handle invalid target IDs gracefully', () => {
      playerManager.addCredits(10000);
      hackingManager.purchaseEquipment('handheld-basic');
      hackingManager.purchaseSoftware('password-cracker-1');
      
      const attempt = hackingManager.startHackingAttempt(
        'invalid-target-id',
        'handheld-basic',
        ['password-cracker-1']
      );
      
      expect(attempt).toBeNull();
    });

    it('should handle invalid equipment IDs gracefully', () => {
      const targets = hackingManager.getAvailableTargets();
      const target = targets[0];
      
      const attempt = hackingManager.startHackingAttempt(
        target.id,
        'invalid-equipment-id',
        ['password-cracker-1']
      );
      
      expect(attempt).toBeNull();
    });

    it('should handle minigame generation for invalid attempt IDs', () => {
      const minigame = hackingManager.generateMinigame('invalid-attempt-id');
      expect(minigame).toBeNull();
    });

    it('should handle minigame completion for invalid attempt IDs', () => {
      const result = hackingManager.completeMinigame('invalid-attempt-id', true, 100);
      expect(result).toBe(false);
    });
  });
});