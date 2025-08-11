import { Ship, ShipClass } from '../../types/player';
import { Vector3D } from '../../types';

/**
 * Creates a mock ship for testing purposes
 */
export function createMockShip(shipId: string, initialPosition: Vector3D): Ship {
  const shipClass: ShipClass = {
    id: 'test-courier-class',
    name: 'Test Courier',
    category: 'courier',
    baseCargoCapacity: 50,
    baseFuelCapacity: 100,
    baseSpeed: 120,
    baseShields: 50,
    equipmentSlots: {
      engines: 1,
      cargo: 1,
      shields: 1,
      weapons: 1,
      utility: 1
    }
  };

  return {
    id: shipId,
    name: 'Test Ship',
    class: shipClass,
    cargo: {
      capacity: 50,
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
      systemId: 'test-system',
      coordinates: initialPosition,
      isInTransit: false,
      lastUpdate: Date.now()
    },
    fuel: {
      current: 100,
      maximum: 100
    },
    crew: {
      current: 1,
      maximum: 1
    }
  };
}