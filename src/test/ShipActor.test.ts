import { describe, it, expect, beforeEach } from 'vitest';
import { ShipActor } from '../engine/ShipActor';
import { Scene } from '../engine/Scene';
import { Ship, ShipClass } from '../types/player';

describe('ShipActor', () => {
  let ship: Ship;
  let shipActor: ShipActor;

  beforeEach(() => {
    // Create a test ship
    const shipClass: ShipClass = {
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
        coordinates: { x: 100, y: 100 },
        isInTransit: false
      }
    };

    shipActor = new ShipActor(ship);
  });

  describe('Initialization', () => {
    it('should initialize with ship position', () => {
      // Actor now uses 3D coordinates with ship layer (z: 50)
      expect(shipActor.getPosition()).toEqual({ x: 100, y: 100, z: 50 });
      // Also provide 2D access for backwards compatibility
      expect(shipActor.getPosition2D()).toEqual({ x: 100, y: 100 });
    });

    it('should start with zero velocity', () => {
      expect(shipActor.getVelocity()).toEqual({ x: 0, y: 0 });
    });

    it('should start with zero rotation', () => {
      expect(shipActor.rotation).toBe(0);
    });

    it('should be active by default', () => {
      expect(shipActor.isActive).toBe(true);
    });
  });

  describe('Movement', () => {
    it('should set target position correctly', () => {
      shipActor.setTarget({ x: 200, y: 200 });
      expect(ship.location.isInTransit).toBe(true);
    });

    it('should move towards target over time', () => {
      shipActor.setTarget({ x: 200, y: 200 });
      
      // Initial position (3D coordinates)
      const initialPos = shipActor.getPosition();
      expect(initialPos).toEqual({ x: 100, y: 100, z: 50 });
      
      // Update movement
      shipActor.update(0.1); // 100ms
      
      // Should have moved towards target
      const newPos = shipActor.getPosition();
      expect(newPos.x).toBeGreaterThan(100);
      expect(newPos.y).toBeGreaterThan(100);
      expect(shipActor.isMoving()).toBe(true);
    });

    it('should stop movement when reaching target', () => {
      shipActor.setTarget({ x: 105, y: 105 }); // Close target
      
      // Update several times to reach target
      for (let i = 0; i < 10; i++) {
        shipActor.update(0.1);
        if (!shipActor.isMoving()) break;
      }
      
      expect(shipActor.isMoving()).toBe(false);
      expect(ship.location.isInTransit).toBe(false);
    });

    it('should rotate towards movement direction', () => {
      const initialRotation = shipActor.rotation;
      shipActor.setTarget({ x: 200, y: 200 }); // Move diagonally to create non-zero angle
      
      shipActor.update(0.1);
      
      // Rotation should have changed towards the target direction
      expect(shipActor.rotation).not.toBe(initialRotation);
      
      // Should be rotating towards Math.PI/4 (45 degrees) but may not reach it immediately
      const targetAngle = Math.PI / 4;
      const rotationChange = Math.abs(shipActor.rotation - initialRotation);
      expect(rotationChange).toBeGreaterThan(0);
      
      // The rotation should be moving in the correct direction
      if (targetAngle > initialRotation) {
        expect(shipActor.rotation).toBeGreaterThan(initialRotation);
      }
    });

    it('should stop movement when stopMovement is called', () => {
      shipActor.setTarget({ x: 200, y: 200 });
      shipActor.update(0.1); // Start moving
      
      expect(shipActor.isMoving()).toBe(true);
      
      shipActor.stopMovement();
      
      expect(shipActor.isMoving()).toBe(false);
      expect(ship.location.isInTransit).toBe(false);
    });
  });

  describe('Physics', () => {
    it('should have different movement characteristics for different ship classes', () => {
      // Create a heavy freight ship for comparison
      const heavyShipClass: ShipClass = {
        ...ship.class,
        category: 'heavy-freight',
        baseSpeed: 80  // Heavy freight ships are slower
      };
      const heavyShip: Ship = { ...ship, class: heavyShipClass };
      const heavyShipActor = new ShipActor(heavyShip);
      
      // Set same target for both
      shipActor.setTarget({ x: 200, y: 100 });
      heavyShipActor.setTarget({ x: 200, y: 100 });
      
      // Update once
      shipActor.update(0.1);
      heavyShipActor.update(0.1);
      
      // Courier should move faster than heavy freight
      const courierSpeed = shipActor.getCurrentSpeed();
      const heavySpeed = heavyShipActor.getCurrentSpeed();
      
      expect(courierSpeed).toBeGreaterThan(heavySpeed);
    });

    it('should apply movement correctly when targeting', () => {
      shipActor.setTarget({ x: 200, y: 100 }); // Target to the right
      const initialPos = shipActor.getPosition();
      
      shipActor.update(0.1); // Update with targeting (no friction applied)
      
      const newPos = shipActor.getPosition();
      expect(newPos.x).toBeGreaterThan(initialPos.x); // Should move towards target
    });
  });

  describe('Utility Methods', () => {
    it('should calculate distance correctly', () => {
      const distance = shipActor.getDistanceTo({ x: 200, y: 200 });
      const expected = Math.sqrt((200-100)*(200-100) + (200-100)*(200-100));
      expect(distance).toBeCloseTo(expected, 1);
    });

    it('should calculate angle correctly', () => {
      const angle = shipActor.getAngleTo({ x: 200, y: 100 }); // Move right
      expect(angle).toBeCloseTo(0, 1); // 0 radians for moving right
    });

    it('should return ship data', () => {
      expect(shipActor.getShip()).toBe(ship);
    });
  });
});

describe('Scene', () => {
  let scene: Scene;

  beforeEach(() => {
    scene = new Scene();
  });

  describe('Actor Management', () => {
    it('should add and retrieve actors', () => {
      const ship: Ship = {
        id: 'test-ship',
        name: 'Test Ship',
        class: {
          id: 'courier',
          name: 'Courier',
          category: 'courier',
          baseCargoCapacity: 50,
          baseFuelCapacity: 100,
          baseSpeed: 120,
          baseShields: 50,
          equipmentSlots: { engines: 1, cargo: 1, shields: 1, weapons: 1, utility: 1 }
        },
        cargo: { capacity: 50, used: 0, items: new Map() },
        equipment: { engines: [], cargo: [], shields: [], weapons: [], utility: [] },
        condition: { hull: 1.0, engines: 1.0, cargo: 1.0, shields: 1.0, lastMaintenance: Date.now() },
        location: { systemId: 'test-system', coordinates: { x: 0, y: 0 }, isInTransit: false }
      };

      const shipActor = new ShipActor(ship);
      scene.addActor(shipActor, 'ship');

      expect(scene.getActor('test-ship')).toBe(shipActor);
      expect(scene.getActorsByType('ship')).toHaveLength(1);
      expect(scene.getAllActors()).toHaveLength(1);
    });

    it('should remove actors correctly', () => {
      const ship: Ship = {
        id: 'test-ship',
        name: 'Test Ship',
        class: {
          id: 'courier',
          name: 'Courier',
          category: 'courier',
          baseCargoCapacity: 50,
          baseFuelCapacity: 100,
          baseSpeed: 120,
          baseShields: 50,
          equipmentSlots: { engines: 1, cargo: 1, shields: 1, weapons: 1, utility: 1 }
        },
        cargo: { capacity: 50, used: 0, items: new Map() },
        equipment: { engines: [], cargo: [], shields: [], weapons: [], utility: [] },
        condition: { hull: 1.0, engines: 1.0, cargo: 1.0, shields: 1.0, lastMaintenance: Date.now() },
        location: { systemId: 'test-system', coordinates: { x: 0, y: 0 }, isInTransit: false }
      };

      const shipActor = new ShipActor(ship);
      scene.addActor(shipActor, 'ship');
      scene.removeActor('test-ship');

      expect(scene.getActor('test-ship')).toBeUndefined();
      expect(scene.getActorsByType('ship')).toHaveLength(0);
    });

    it('should update all actors', () => {
      const ship: Ship = {
        id: 'test-ship',
        name: 'Test Ship',
        class: {
          id: 'courier',
          name: 'Courier',
          category: 'courier',
          baseCargoCapacity: 50,
          baseFuelCapacity: 100,
          baseSpeed: 120,
          baseShields: 50,
          equipmentSlots: { engines: 1, cargo: 1, shields: 1, weapons: 1, utility: 1 }
        },
        cargo: { capacity: 50, used: 0, items: new Map() },
        equipment: { engines: [], cargo: [], shields: [], weapons: [], utility: [] },
        condition: { hull: 1.0, engines: 1.0, cargo: 1.0, shields: 1.0, lastMaintenance: Date.now() },
        location: { systemId: 'test-system', coordinates: { x: 0, y: 0 }, isInTransit: false }
      };

      const shipActor = new ShipActor(ship);
      scene.addActor(shipActor, 'ship');
      
      shipActor.setTarget({ x: 100, y: 100 });
      const initialPos = shipActor.getPosition();
      
      scene.update(0.1);
      
      const newPos = shipActor.getPosition();
      expect(newPos).not.toEqual(initialPos);
    });
  });

  describe('Spatial Queries', () => {
    it('should find actors in radius', () => {
      const ship: Ship = {
        id: 'test-ship',
        name: 'Test Ship',
        class: {
          id: 'courier',
          name: 'Courier',
          category: 'courier',
          baseCargoCapacity: 50,
          baseFuelCapacity: 100,
          baseSpeed: 120,
          baseShields: 50,
          equipmentSlots: { engines: 1, cargo: 1, shields: 1, weapons: 1, utility: 1 }
        },
        cargo: { capacity: 50, used: 0, items: new Map() },
        equipment: { engines: [], cargo: [], shields: [], weapons: [], utility: [] },
        condition: { hull: 1.0, engines: 1.0, cargo: 1.0, shields: 1.0, lastMaintenance: Date.now() },
        location: { systemId: 'test-system', coordinates: { x: 50, y: 50 }, isInTransit: false }
      };

      const shipActor = new ShipActor(ship);
      scene.addActor(shipActor, 'ship');

      const nearbyActors = scene.findActorsInRadius({ x: 55, y: 55 }, 10);
      expect(nearbyActors).toHaveLength(1);
      expect(nearbyActors[0]).toBe(shipActor);

      const distantActors = scene.findActorsInRadius({ x: 200, y: 200 }, 10);
      expect(distantActors).toHaveLength(0);
    });
  });
});