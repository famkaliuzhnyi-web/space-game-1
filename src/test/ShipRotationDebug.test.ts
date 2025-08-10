import { describe, it, expect, beforeEach } from 'vitest';
import { ShipActor } from '../engine/ShipActor';
import { Ship, ShipClass } from '../types/player';

describe('Ship Rotation Debug', () => {
  let ship: Ship;
  let shipClass: ShipClass;

  beforeEach(() => {
    shipClass = {
      id: 'courier-class',
      name: 'Courier',
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

    ship = {
      id: 'test-ship',
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
        coordinates: { x: 0, y: 0 },
        isInTransit: false
      }
    };
  });

  it('should debug rotation behavior step by step', () => {
    const shipActor = new ShipActor(ship);
    
    console.log('Initial rotation:', shipActor.rotation);
    console.log('Initial position:', shipActor.getPosition());
    
    // Set target to the right
    shipActor.setTarget({ x: 100, y: 0 });
    console.log('Target set to (100, 0)');
    
    // Update step by step and log rotation
    for (let i = 0; i < 30; i++) {
      shipActor.update(1/60);
      if (i % 5 === 0) {
        console.log(`Step ${i}: rotation=${shipActor.rotation}, position=(${shipActor.getPosition().x.toFixed(2)}, ${shipActor.getPosition().y.toFixed(2)})`);
      }
    }
    
    const finalRotation = shipActor.rotation;
    console.log('Final rotation:', finalRotation);
    console.log('Expected rotation (0 radians):', 0);
    console.log('Difference:', Math.abs(finalRotation - 0));
    
    // This should be very close to 0
    expect(Math.abs(finalRotation - 0)).toBeLessThan(0.1);
  });

  it('should debug diagonal rotation behavior', () => {
    const shipActor = new ShipActor(ship);
    
    console.log('=== DIAGONAL TEST ===');
    console.log('Initial rotation:', shipActor.rotation);
    
    // Set target to diagonal (45 degrees)
    shipActor.setTarget({ x: 100, y: 100 });
    console.log('Target set to (100, 100)');
    console.log('Expected rotation (π/4):', Math.PI/4);
    
    // Update and log
    for (let i = 0; i < 30; i++) {
      shipActor.update(1/60);
      if (i % 5 === 0) {
        console.log(`Step ${i}: rotation=${shipActor.rotation}, position=(${shipActor.getPosition().x.toFixed(2)}, ${shipActor.getPosition().y.toFixed(2)})`);
      }
    }
    
    const finalRotation = shipActor.rotation;
    const expectedRotation = Math.PI/4;
    console.log('Final rotation:', finalRotation);
    console.log('Expected rotation:', expectedRotation);
    console.log('Difference:', Math.abs(finalRotation - expectedRotation));
  });
});