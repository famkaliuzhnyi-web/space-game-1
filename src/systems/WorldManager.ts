import { Galaxy, Sector, StarSystem, Station, Planet, Coordinates, NavigationTarget } from '../types/world';

export class WorldManager {
  private galaxy: Galaxy;

  constructor() {
    this.galaxy = this.generateInitialGalaxy();
  }

  private generateInitialGalaxy(): Galaxy {
    // Create a small test galaxy with one sector and a few systems
    const testSector: Sector = {
      id: 'alpha-sector',
      name: 'Alpha Sector',
      position: { x: 0, y: 0 },
      systems: [
        this.createTestSystem('sol-system', 'Sol System', { x: 100, y: 100 }),
        this.createTestSystem('alpha-centauri', 'Alpha Centauri', { x: 200, y: 150 }),
        this.createTestSystem('sirius', 'Sirius System', { x: 300, y: 200 })
      ],
      controllingFaction: 'Earth Federation',
      description: 'The home sector of humanity, containing Sol and nearby systems.'
    };

    return {
      sectors: [testSector],
      currentPlayerLocation: {
        sectorId: 'alpha-sector',
        systemId: 'sol-system',
        stationId: 'earth-station'
      }
    };
  }

  private createTestSystem(id: string, name: string, position: Coordinates): StarSystem {
    const stations: Station[] = [];
    const planets: Planet[] = [];

    // Create different systems with varying content
    switch (id) {
      case 'sol-system':
        stations.push({
          id: 'earth-station',
          name: 'Earth Station Alpha',
          type: 'trade',
          position: { x: position.x, y: position.y - 30 },
          faction: 'Earth Federation',
          dockingCapacity: 50,
          services: ['refuel', 'repair', 'trading', 'missions'],
          description: 'The primary orbital station around Earth, hub of interstellar commerce.'
        });
        planets.push({
          id: 'earth',
          name: 'Earth',
          type: 'terrestrial',
          position: { x: position.x, y: position.y - 50 },
          radius: 20,
          habitable: true,
          population: 8000000000,
          description: 'Birthplace of humanity.'
        });
        break;

      case 'alpha-centauri':
        stations.push({
          id: 'centauri-outpost',
          name: 'Centauri Mining Outpost',
          type: 'mining',
          position: { x: position.x + 10, y: position.y - 20 },
          faction: 'Mining Consortium',
          dockingCapacity: 20,
          services: ['refuel', 'trading'],
          description: 'A remote mining station extracting rare minerals.'
        });
        break;

      case 'sirius':
        stations.push({
          id: 'sirius-research',
          name: 'Sirius Research Station',
          type: 'research',
          position: { x: position.x - 15, y: position.y + 25 },
          faction: 'Scientific Alliance',
          dockingCapacity: 15,
          services: ['repair', 'research'],
          description: 'Advanced research facility studying stellar phenomena.'
        });
        break;
    }

    return {
      id,
      name,
      position,
      star: {
        name: name.split(' ')[0],
        type: 'yellow-dwarf',
        temperature: 5778
      },
      stations,
      planets,
      securityLevel: id === 'sol-system' ? 9 : 6
    };
  }

  getGalaxy(): Galaxy {
    return this.galaxy;
  }

  getCurrentSector(): Sector | undefined {
    return this.galaxy.sectors.find(s => s.id === this.galaxy.currentPlayerLocation.sectorId);
  }

  getCurrentSystem(): StarSystem | undefined {
    const sector = this.getCurrentSector();
    if (!sector) return undefined;
    return sector.systems.find(s => s.id === this.galaxy.currentPlayerLocation.systemId);
  }

  getCurrentStation(): Station | undefined {
    const system = this.getCurrentSystem();
    if (!system || !this.galaxy.currentPlayerLocation.stationId) return undefined;
    return system.stations.find(s => s.id === this.galaxy.currentPlayerLocation.stationId);
  }

  getAvailableTargets(): NavigationTarget[] {
    const currentSector = this.getCurrentSector();
    if (!currentSector) return [];

    const targets: NavigationTarget[] = [];
    const currentPos = this.getCurrentSystem()?.position || { x: 0, y: 0 };

    // Add systems in current sector
    currentSector.systems.forEach(system => {
      if (system.id !== this.galaxy.currentPlayerLocation.systemId) {
        const distance = this.calculateDistance(currentPos, system.position);
        targets.push({
          type: 'system',
          id: system.id,
          name: system.name,
          position: system.position,
          distance,
          estimatedTravelTime: distance / 10 // Simple time calculation
        });
      }

      // Add stations in current system if we're in this system
      if (system.id === this.galaxy.currentPlayerLocation.systemId) {
        system.stations.forEach(station => {
          if (station.id !== this.galaxy.currentPlayerLocation.stationId) {
            const distance = this.calculateDistance(currentPos, station.position);
            targets.push({
              type: 'station',
              id: station.id,
              name: station.name,
              position: station.position,
              distance,
              estimatedTravelTime: distance / 50 // Faster travel within system
            });
          }
        });
      }
    });

    return targets.sort((a, b) => a.distance - b.distance);
  }

  navigateToTarget(targetId: string): boolean {
    const targets = this.getAvailableTargets();
    const target = targets.find(t => t.id === targetId);
    
    if (!target) return false;

    if (target.type === 'system') {
      this.galaxy.currentPlayerLocation.systemId = target.id;
      this.galaxy.currentPlayerLocation.stationId = undefined;
    } else if (target.type === 'station') {
      this.galaxy.currentPlayerLocation.stationId = target.id;
    }

    return true;
  }

  private calculateDistance(pos1: Coordinates, pos2: Coordinates): number {
    const dx = pos2.x - pos1.x;
    const dy = pos2.y - pos1.y;
    return Math.sqrt(dx * dx + dy * dy);
  }

  getAllVisibleObjects(): Array<{type: string, object: Station | Planet | {name: string; type: string}, position: Coordinates}> {
    const currentSystem = this.getCurrentSystem();
    if (!currentSystem) return [];

    const objects: Array<{type: string, object: Station | Planet | {name: string; type: string}, position: Coordinates}> = [];

    // Add star
    objects.push({
      type: 'star',
      object: currentSystem.star,
      position: currentSystem.position
    });

    // Add stations
    currentSystem.stations.forEach(station => {
      objects.push({
        type: 'station',
        object: station,
        position: station.position
      });
    });

    // Add planets
    currentSystem.planets.forEach(planet => {
      objects.push({
        type: 'planet',
        object: planet,
        position: planet.position
      });
    });

    return objects;
  }

  getAllStations(): Station[] {
    const allStations: Station[] = [];
    for (const sector of this.galaxy.sectors) {
      for (const system of sector.systems) {
        allStations.push(...system.stations);
      }
    }
    return allStations;
  }
}