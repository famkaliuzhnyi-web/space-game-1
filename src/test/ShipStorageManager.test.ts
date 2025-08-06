import { describe, test, expect, beforeEach } from 'vitest';
import { ShipStorageManager } from '../systems/ShipStorageManager';
import { Ship, ShipClass } from '../types/player';

describe('ShipStorageManager', () => {
  let shipStorage: ShipStorageManager;
  let testShip: Ship;

  beforeEach(() => {
    shipStorage = new ShipStorageManager();
    
    // Create a test ship
    const testShipClass: ShipClass = {
      id: 'test-freighter',
      name: 'Test Freighter',
      category: 'transport',
      baseCargoCapacity: 150,
      baseFuelCapacity: 60,
      baseSpeed: 100,
      baseShields: 30,
      equipmentSlots: {
        engines: 1,
        cargo: 2,
        shields: 1,
        weapons: 1,
        utility: 1
      }
    };

    testShip = {
      id: 'test-ship-1',
      name: 'Test Ship',
      class: testShipClass,
      cargo: {
        capacity: 150,
        used: 0,
        items: new Map()
      },
      equipment: {
        engines: [],
        cargo: [],
        shields: [],
        weapons: [],
        utility: []
      },
      condition: {
        hull: 1.0,
        engines: 1.0,
        cargo: 1.0,
        shields: 1.0,
        lastMaintenance: Date.now()
      },
      location: {
        systemId: 'sol',
        stationId: 'earth-station',
        isInTransit: false
      }
    };
  });

  describe('Ship Storage', () => {
    test('should store a ship at station', () => {
      const result = shipStorage.storeShip(testShip, 'earth-station');
      
      expect(result.success).toBe(true);
      expect(result.dailyFee).toBeGreaterThan(0);
      
      const storageInfo = shipStorage.getShipStorageInfo(testShip.id);
      expect(storageInfo).toBeTruthy();
      expect(storageInfo?.stationId).toBe('earth-station');
    });

    test('should not store ship at different station', () => {
      testShip.location.stationId = 'mars-station';
      const result = shipStorage.storeShip(testShip, 'earth-station');
      
      expect(result.success).toBe(false);
      expect(result.error).toContain('must be at the station');
    });

    test('should not store already stored ship', () => {
      shipStorage.storeShip(testShip, 'earth-station');
      const result = shipStorage.storeShip(testShip, 'earth-station');
      
      expect(result.success).toBe(false);
      expect(result.error).toContain('already in storage');
    });

    test('should retrieve ship from storage', () => {
      shipStorage.storeShip(testShip, 'earth-station');
      
      const result = shipStorage.retrieveShip(testShip.id, 'player-1', 10000);
      
      expect(result.success).toBe(true);
      expect(result.totalFees).toBeGreaterThanOrEqual(0);
      
      const storageInfo = shipStorage.getShipStorageInfo(testShip.id);
      expect(storageInfo).toBeNull();
    });

    test('should not retrieve ship with insufficient credits', () => {
      shipStorage.storeShip(testShip, 'earth-station');
      
      // Mock time passage to ensure there are fees
      const storageInfo = shipStorage.getShipStorageInfo(testShip.id);
      if (storageInfo) {
        storageInfo.storedAt = Date.now() - (24 * 60 * 60 * 1000); // 1 day ago
      }
      
      const result = shipStorage.retrieveShip(testShip.id, 'player-1', 0);
      
      expect(result.success).toBe(false);
      expect(result.error).toContain('Insufficient credits');
    });

    test('should list ships at station', () => {
      shipStorage.storeShip(testShip, 'earth-station');
      
      const shipsAtStation = shipStorage.getShipsAtStation('earth-station');
      expect(shipsAtStation).toHaveLength(1);
      expect(shipsAtStation[0].shipId).toBe(testShip.id);
    });
  });

  describe('Ship Purchasing', () => {
    test('should get shipyard offers', () => {
      const offers = shipStorage.getShipYardOffers('earth-station');
      
      expect(offers.length).toBeGreaterThan(0);
      expect(offers[0]).toHaveProperty('shipClassId');
      expect(offers[0]).toHaveProperty('basePrice');
    });

    test('should purchase ship successfully', () => {
      const offers = shipStorage.getShipYardOffers('earth-station');
      const offer = offers[0];
      
      const result = shipStorage.purchaseShip(
        'earth-station',
        offer.shipClassId,
        100000, // Sufficient credits
        'player-1'
      );
      
      expect(result.success).toBe(true);
      expect(result.ship).toBeTruthy();
      expect(result.cost).toBeGreaterThan(0);
      expect(result.ship?.class.id).toBe(offer.shipClassId);
    });

    test('should not purchase ship with insufficient credits', () => {
      const offers = shipStorage.getShipYardOffers('earth-station');
      const offer = offers[0];
      
      const result = shipStorage.purchaseShip(
        'earth-station',
        offer.shipClassId,
        100, // Insufficient credits
        'player-1'
      );
      
      expect(result.success).toBe(false);
      expect(result.error).toContain('Insufficient credits');
    });

    test('should not purchase unavailable ship', () => {
      const result = shipStorage.purchaseShip(
        'earth-station',
        'non-existent-ship',
        100000,
        'player-1'
      );
      
      expect(result.success).toBe(false);
      expect(result.error).toContain('not available');
    });
  });

  describe('Storage Fees', () => {
    test('should calculate storage fees correctly', () => {
      shipStorage.storeShip(testShip, 'earth-station');
      
      // Mock time passage
      const storageInfo = shipStorage.getShipStorageInfo(testShip.id);
      if (storageInfo) {
        storageInfo.storedAt = Date.now() - (24 * 60 * 60 * 1000); // 1 day ago
      }
      
      const result = shipStorage.retrieveShip(testShip.id, 'player-1', 10000);
      
      expect(result.success).toBe(true);
      expect(result.totalFees).toBeGreaterThan(0);
    });
  });

  describe('Serialization', () => {
    test('should serialize and deserialize correctly', () => {
      shipStorage.storeShip(testShip, 'earth-station');
      
      const serialized = shipStorage.serialize();
      const newStorage = new ShipStorageManager();
      newStorage.deserialize(serialized);
      
      const storageInfo = newStorage.getShipStorageInfo(testShip.id);
      expect(storageInfo).toBeTruthy();
      expect(storageInfo?.stationId).toBe('earth-station');
    });
  });
});