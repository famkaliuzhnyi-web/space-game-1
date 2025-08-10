import { describe, it, expect } from 'vitest';
import { ShipActor } from '../engine/ShipActor';
import { Ship, ShipClass } from '../types/player';

describe('Ship Rotation Speed Analysis', () => {
  it('should examine rotation speed for different ship classes', () => {
    const testClasses = ['courier', 'combat', 'explorer', 'transport', 'heavy-freight'];
    
    for (const category of testClasses) {
      const shipClass: ShipClass = {
        id: `${category}-class`,
        name: category,
        category: category as any,
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

      const ship: Ship = {
        id: 'test-ship',
        name: 'Test Ship',
        class: shipClass,
        cargo: { capacity: 50, used: 0, items: new Map() },
        equipment: { engines: [], cargo: [], shields: [], weapons: [], utility: [] },
        condition: { hull: 1.0, engines: 1.0, cargo: 1.0, shields: 1.0, lastMaintenance: Date.now() },
        location: { systemId: 'test-system', coordinates: { x: 0, y: 0 }, isInTransit: false }
      };

      const shipActor = new ShipActor(ship);
      
      // Access rotation speed through testing a 90-degree turn
      shipActor.setTarget({ x: 0, y: 100 }); // Down
      
      let rotationAfterOneFrame = 0;
      shipActor.update(1/60); // One frame
      rotationAfterOneFrame = shipActor.rotation;
      
      const rotationSpeed = rotationAfterOneFrame / (1/60); // rad/s
      
      console.log(`${category}: rotation speed ≈ ${rotationSpeed.toFixed(2)} rad/s`);
      console.log(`  Time for 90° turn: ${(Math.PI/2 / rotationSpeed).toFixed(3)}s`);
      console.log(`  Time for 180° turn: ${(Math.PI / rotationSpeed).toFixed(3)}s`);
    }
  });
});