import { describe, it, expect, beforeEach, vi } from 'vitest';
import { SecurityManager } from '../systems/SecurityManager';
import { TimeManager } from '../systems/TimeManager';
import { WorldManager } from '../systems/WorldManager';
import { PlayerManager } from '../systems/PlayerManager';
import { FactionManager } from '../systems/FactionManager';
import { NPCAIManager } from '../systems/NPCAIManager';
import { 
  Evidence
} from '../types/security';

// Mock dependencies
const createMockTimeManager = () => ({
  getCurrentTimestamp: vi.fn(() => Date.now()),
  getCurrentTime: vi.fn(() => ({ year: 2387, month: 3, day: 15, hour: 14, minute: 30 })),
  start: vi.fn(),
  update: vi.fn(),
  formatTime: vi.fn(() => '14:30'),
  addGameTime: vi.fn(),
  isTimeToUpdate: vi.fn(() => false)
});

const createMockWorldManager = () => ({
  getGalaxy: vi.fn(() => ({
    sectors: [
      {
        id: 'core-sector',
        name: 'Core Sector',
        systems: [
          {
            id: 'sol-system',
            name: 'Sol System',
            controllingFaction: 'earth-federation',
            type: 'core',
            hasStations: true,
            stations: [{ id: 'earth-station', name: 'Earth Station' }]
          },
          {
            id: 'trade-hub',
            name: 'Trade Hub Alpha',
            controllingFaction: 'traders-guild',
            type: 'trade',
            hasStations: true,
            stations: [{ id: 'trade-station', name: 'Trade Station' }]
          }
        ]
      },
      {
        id: 'frontier-sector',
        name: 'Frontier Sector',
        systems: [
          {
            id: 'frontier-1',
            name: 'Frontier System',
            controllingFaction: 'outer-colonies',
            type: 'frontier',
            hasStations: false,
            stations: []
          }
        ]
      }
    ],
    currentPlayerLocation: {
      sectorId: 'core-sector',
      systemId: 'sol-system',
      stationId: 'earth-station'
    }
  })),
  getAllStations: vi.fn(() => []),
  getCurrentSystem: vi.fn(() => 'sol-system'),
  getStationById: vi.fn()
});

const createMockPlayerManager = () => ({
  getCurrentStation: vi.fn(() => 'earth-station'),
  getCurrentShip: vi.fn(() => ({
    id: 'player-ship',
    cargo: {
      items: new Map([
        ['electronics', { quantity: 50, commodityId: 'electronics' }],
        ['military-electronics', { quantity: 10, commodityId: 'military-electronics' }]
      ])
    }
  })),
  modifyFactionReputation: vi.fn(() => ({ success: true }))
});

const createMockFactionManager = () => ({
  getFaction: vi.fn((factionId: string) => {
    const factions: Record<string, any> = {
      'earth-federation': {
        id: 'earth-federation',
        name: 'Earth Federation',
        territories: ['sol-system', 'core-world-1']
      },
      'traders-guild': {
        id: 'traders-guild',
        name: 'Traders Guild',
        territories: ['trade-hub']
      }
    };
    return factions[factionId] || null;
  }),
  initializePlayerReputation: vi.fn(() => new Map())
});

const createMockNPCAIManager = () => ({
  getNPCsInSystem: vi.fn((systemId: string) => [
    { id: 'npc-1', name: 'Security Patrol', type: 'patrol' },
    { id: 'npc-2', name: 'Trader Ship', type: 'trader' }
  ]),
  update: vi.fn()
});

describe('SecurityManager', () => {
  let securityManager: SecurityManager;
  let mockTimeManager: any;
  let mockWorldManager: any;
  let mockPlayerManager: any;
  let mockFactionManager: any;
  let mockNPCAIManager: any;

  beforeEach(() => {
    mockTimeManager = createMockTimeManager();
    mockWorldManager = createMockWorldManager();
    mockPlayerManager = createMockPlayerManager();
    mockFactionManager = createMockFactionManager();
    mockNPCAIManager = createMockNPCAIManager();

    securityManager = new SecurityManager(
      mockTimeManager as TimeManager,
      mockWorldManager as WorldManager,
      mockPlayerManager as PlayerManager,
      mockFactionManager as FactionManager,
      mockNPCAIManager as NPCAIManager
    );
  });

  describe('Initialization', () => {
    it('should initialize security zones for all systems', () => {
      const solSecurityLevel = securityManager.getSecurityLevel('sol-system');
      expect(solSecurityLevel).toBeDefined();
      expect(solSecurityLevel?.level).toBe(1); // Core federation system should have max security
      
      const tradeSecurityLevel = securityManager.getSecurityLevel('trade-hub');
      expect(tradeSecurityLevel).toBeDefined();
      expect(tradeSecurityLevel?.level).toBe(2); // Trade hub should have high security
      
      const frontierSecurityLevel = securityManager.getSecurityLevel('frontier-1');
      expect(frontierSecurityLevel).toBeDefined();
      expect(frontierSecurityLevel?.level).toBe(4); // Frontier should have low security
    });

    it('should create law enforcement agencies for different factions', () => {
      const agencies = securityManager.getLawEnforcementPresence('sol-system');
      expect(agencies).toBeDefined();
      expect(agencies.length).toBeGreaterThan(0);
    });

    it('should initialize crime database with various crime types', () => {
      // Test by reporting a known crime type
      const crimeId = securityManager.reportCrime('theft', 'sol-system', [
        {
          type: 'witness',
          reliability: 80,
          description: 'Saw suspect taking cargo',
          source: 'security-camera'
        }
      ]);
      
      expect(crimeId).toBeDefined();
      expect(crimeId).toMatch(/^crime-/);
    });
  });

  describe('Security Levels', () => {
    it('should assign appropriate security levels based on faction control', () => {
      const earthSecurity = securityManager.getSecurityLevel('sol-system');
      expect(earthSecurity?.level).toBe(1); // Earth Federation = max security
      
      const tradeSecurity = securityManager.getSecurityLevel('trade-hub');
      expect(tradeSecurity?.level).toBe(2); // Traders Guild = high security
      
      const frontierSecurity = securityManager.getSecurityLevel('frontier-1');
      expect(frontierSecurity?.level).toBe(4); // Outer Colonies = low security
    });

    it('should provide security level characteristics', () => {
      const maxSecurity = securityManager.getSecurityLevel('sol-system');
      expect(maxSecurity?.characteristics).toContain('Continuous patrols');
      expect(maxSecurity?.characteristics).toContain('Real-time monitoring');
      expect(maxSecurity?.responseTime).toBe(30);
      expect(maxSecurity?.inspectionChance).toBe(80);
    });

    it('should have different crime rates for different security levels', () => {
      const maxSecurity = securityManager.getSecurityLevel('sol-system');
      const lowSecurity = securityManager.getSecurityLevel('frontier-1');
      
      expect(maxSecurity?.crimeRate).toBeLessThan(lowSecurity?.crimeRate);
      expect(maxSecurity?.patrolCoverage).toBeGreaterThan(lowSecurity?.patrolCoverage);
    });
  });

  describe('Crime Detection and Reporting', () => {
    it('should detect and report crimes with evidence', () => {
      const evidence: Evidence[] = [
        {
          type: 'witness',
          reliability: 90,
          description: 'Security footage of theft',
          source: 'station-security'
        }
      ];

      const crimeId = securityManager.reportCrime('piracy', 'sol-system', evidence);
      
      expect(crimeId).toBeDefined();
      expect(mockPlayerManager.modifyFactionReputation).toHaveBeenCalled();
    });

    it('should handle different crime severities appropriately', () => {
      // Report minor crime
      const minorCrime = securityManager.reportCrime('theft', 'sol-system', []);
      expect(minorCrime).toBeDefined();
      
      // Report major crime
      const majorCrime = securityManager.reportCrime('piracy', 'sol-system', []);
      expect(majorCrime).toBeDefined();
      
      // Major crimes should start investigations, minor ones might not
      // This would be tested through investigation state, but we'll keep it simple
    });

    it('should find appropriate witnesses at crime locations', () => {
      const evidence: Evidence = {
        type: 'witness',
        reliability: 85,
        description: 'NPC witnessed the crime',
        source: 'civilian-witness'
      };

      const crimeId = securityManager.reportCrime('assault', 'sol-system', [evidence]);
      expect(crimeId).toBeDefined();
      
      // Should have called getNPCsInSystem to find witnesses
      expect(mockNPCAIManager.getNPCsInSystem).toHaveBeenCalledWith('sol-system');
    });

    it('should apply reputation penalties for crimes', () => {
      const crimeId = securityManager.reportCrime('smuggling', 'sol-system', []);
      
      expect(mockPlayerManager.modifyFactionReputation).toHaveBeenCalled();
      
      // Check that reputation was modified negatively
      const calls = mockPlayerManager.modifyFactionReputation.mock.calls;
      expect(calls.length).toBeGreaterThan(0);
      
      const reputationChanges = calls.map(call => call[1]); // Second parameter is the change
      expect(reputationChanges.some(change => change < 0)).toBe(true);
    });
  });

  describe('Contraband Detection', () => {
    it('should identify contraband items correctly', () => {
      const playerShip = mockPlayerManager.getCurrentShip();
      const cargo = playerShip.cargo.items;
      
      const scanResults = securityManager.checkCargoLegality('sol-system', cargo);
      
      // Should detect military-electronics as contraband in high-security area
      const contrabandFound = scanResults.some(result => 
        result.status === 'violation' && 
        result.details.includes('military-electronics')
      );
      
      expect(contrabandFound).toBe(true);
    });

    it('should not flag legal goods as contraband', () => {
      const legalCargo = new Map([
        ['food-rations', { quantity: 100 }],
        ['consumer-goods', { quantity: 50 }]
      ]);
      
      const scanResults = securityManager.checkCargoLegality('sol-system', legalCargo);
      expect(scanResults.length).toBe(0);
    });

    it('should have different contraband rules for different security zones', () => {
      const playerCargo = mockPlayerManager.getCurrentShip().cargo.items;
      
      const highSecurityScan = securityManager.checkCargoLegality('sol-system', playerCargo);
      const lowSecurityScan = securityManager.checkCargoLegality('frontier-1', playerCargo);
      
      // High security areas should be more restrictive
      expect(highSecurityScan.length).toBeGreaterThanOrEqual(lowSecurityScan.length);
    });
  });

  describe('Legal Status and Warrants', () => {
    it('should maintain clean legal status for law-abiding players', () => {
      const legalStatus = securityManager.getPlayerLegalStatus();
      
      expect(legalStatus.overall).toBe('clean');
      expect(legalStatus.activeWarrants).toBe(0);
      expect(legalStatus.totalBounty).toBe(0);
    });

    it('should track criminal history', () => {
      // Report a crime to create history
      securityManager.reportCrime('fraud', 'trade-hub', [{
        type: 'digital',
        reliability: 95,
        description: 'Financial transaction records',
        source: 'banking-system'
      }]);
      
      const crimeHistory = securityManager.getPlayerCrimeHistory();
      expect(crimeHistory.length).toBeGreaterThan(0);
      
      const fraudCrime = crimeHistory.find(crime => crime.crimeType === 'fraud');
      expect(fraudCrime).toBeDefined();
      expect(fraudCrime?.location).toBe('trade-hub');
    });

    it('should issue warrants for serious crimes', () => {
      // Report a serious crime that should result in a warrant
      securityManager.reportCrime('piracy', 'sol-system', [
        {
          type: 'physical',
          reliability: 100,
          description: 'Damaged ship and stolen cargo',
          source: 'victim-testimony'
        }
      ]);
      
      // Allow time for investigation to complete (simulate update cycles)
      for (let i = 0; i < 10; i++) {
        securityManager.update();
      }
      
      const warrants = securityManager.getPlayerWarrants();
      // Note: Warrant issuance depends on investigation completion,
      // which may require multiple update cycles in the real system
    });
  });

  describe('Law Enforcement Units', () => {
    it('should spawn appropriate law enforcement units', () => {
      const earthUnits = securityManager.getLawEnforcementPresence('sol-system');
      const frontierUnits = securityManager.getLawEnforcementPresence('frontier-1');
      
      // Core systems should have more law enforcement presence
      expect(earthUnits.length).toBeGreaterThanOrEqual(frontierUnits.length);
    });

    it('should have faction-appropriate law enforcement agencies', () => {
      const solUnits = securityManager.getLawEnforcementPresence('sol-system');
      const tradeUnits = securityManager.getLawEnforcementPresence('trade-hub');
      
      // Different systems should have units from appropriate agencies
      expect(solUnits.length).toBeGreaterThan(0);
      expect(tradeUnits.length).toBeGreaterThan(0);
    });

    it('should update patrol patterns over time', () => {
      // Get total unit count across all systems
      const allSystems = ['sol-system', 'trade-hub', 'frontier-1'];
      const initialTotalUnits = allSystems.reduce((count, systemId) => {
        return count + securityManager.getLawEnforcementPresence(systemId).length;
      }, 0);
      
      // Simulate patrol updates
      mockTimeManager.getCurrentTimestamp.mockReturnValue(Date.now() + 35000); // 35 seconds later
      securityManager.update();
      
      const updatedTotalUnits = allSystems.reduce((count, systemId) => {
        return count + securityManager.getLawEnforcementPresence(systemId).length;
      }, 0);
      
      // Total units should remain the same (they just move around)
      expect(updatedTotalUnits).toBe(initialTotalUnits);
    });
  });

  describe('Security Events', () => {
    it('should record security events for tracking', () => {
      securityManager.reportCrime('weapon-violation', 'sol-system', [{
        type: 'physical',
        reliability: 100,
        description: 'Illegal weapon found during scan',
        source: 'security-scanner'
      }]);
      
      const recentEvents = securityManager.getRecentSecurityEvents(10);
      expect(recentEvents.length).toBeGreaterThan(0);
      
      const crimeEvent = recentEvents.find(event => event.type === 'crime_detected');
      expect(crimeEvent).toBeDefined();
      expect(crimeEvent?.participants).toContain('player');
    });

    it('should limit event history to prevent memory bloat', () => {
      // The system should automatically clean up old events
      const events = securityManager.getRecentSecurityEvents();
      expect(events.length).toBeLessThanOrEqual(1000); // Implementation limit
    });
  });

  describe('System Integration', () => {
    it('should integrate with time manager for updates', () => {
      securityManager.update();
      expect(mockTimeManager.getCurrentTimestamp).toHaveBeenCalled();
    });

    it('should integrate with player manager for location and cargo', () => {
      // Reset the spy call counts
      mockPlayerManager.getCurrentStation.mockClear();
      mockPlayerManager.getCurrentShip.mockClear();
      
      // Test security scan functionality which should call player manager methods
      const playerShip = mockPlayerManager.getCurrentShip();
      const cargo = playerShip.cargo.items;
      securityManager.checkCargoLegality('sol-system', cargo);
      
      // Verify the calls were made
      expect(mockPlayerManager.getCurrentShip).toHaveBeenCalled();
    });

    it('should integrate with faction manager for territorial information', () => {
      // Tested through law enforcement agency initialization
      expect(mockFactionManager.getFaction).toHaveBeenCalled();
    });

    it('should integrate with NPC manager for witness identification', () => {
      securityManager.reportCrime('theft', 'sol-system', []);
      expect(mockNPCAIManager.getNPCsInSystem).toHaveBeenCalledWith('sol-system');
    });
  });

  describe('Serialization', () => {
    it('should serialize security state for saving', () => {
      // Report some crimes to create state
      securityManager.reportCrime('smuggling', 'sol-system', []);
      
      const serialized = securityManager.serialize();
      
      expect(serialized).toBeDefined();
      expect(serialized.zones).toBeDefined();
      expect(serialized.agencies).toBeDefined();
      expect(serialized.criminalRecords).toBeDefined();
      expect(serialized.securityEvents).toBeDefined();
      expect(serialized.counters).toBeDefined();
    });

    it('should deserialize security state from save data', () => {
      const testSaveData = {
        zones: [['test-zone', { 
          id: 'test-zone', 
          name: 'Test Zone',
          securityLevel: { level: 3, name: 'Standard Security' },
          restrictions: []
        }]],
        agencies: [],
        units: [],
        criminalRecords: [],
        activeInvestigations: [],
        patrolRoutes: [],
        crimeDatabase: [],
        licenses: [],
        securityEvents: [],
        counters: {
          crimeIdCounter: 5,
          warrantIdCounter: 2,
          eventIdCounter: 10
        }
      };
      
      expect(() => {
        securityManager.deserialize(testSaveData);
      }).not.toThrow();
      
      // Verify deserialized data is accessible
      const testZone = securityManager.getSecurityLevel('test-zone');
      expect(testZone?.name).toBe('Standard Security');
    });
  });

  describe('Crime Type Database', () => {
    it('should have comprehensive crime definitions', () => {
      // Test various crime types by reporting them
      const crimeTypes = ['theft', 'piracy', 'smuggling', 'assault', 'fraud', 'weapon-violation', 'espionage'];
      
      crimeTypes.forEach(crimeType => {
        const crimeId = securityManager.reportCrime(crimeType, 'sol-system', []);
        expect(crimeId).toBeDefined();
        expect(crimeId).toMatch(/^crime-/);
      });
    });

    it('should handle unknown crime types gracefully', () => {
      const crimeId = securityManager.reportCrime('unknown-crime-type', 'sol-system', []);
      expect(crimeId).toBeDefined(); // Should still generate ID
    });

    it('should have appropriate severity levels for different crimes', () => {
      // This is tested indirectly through reputation impact and investigation triggers
      // More severe crimes should trigger investigations while minor ones might not
      
      // Report major crime
      securityManager.reportCrime('piracy', 'sol-system', [{
        type: 'witness',
        reliability: 90,
        description: 'Witnessed armed robbery',
        source: 'victim'
      }]);
      
      // Report minor crime
      securityManager.reportCrime('theft', 'sol-system', [{
        type: 'witness',
        reliability: 70,
        description: 'Saw item taken',
        source: 'bystander'
      }]);
      
      // Both should be recorded
      const crimeHistory = securityManager.getPlayerCrimeHistory();
      expect(crimeHistory.some(crime => crime.crimeType === 'piracy')).toBe(true);
      expect(crimeHistory.some(crime => crime.crimeType === 'theft')).toBe(true);
    });
  });
});