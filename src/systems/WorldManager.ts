import { Galaxy, Sector, StarSystem, Station, Planet, Coordinates, NavigationTarget } from '../types/world';

export class WorldManager {
  private galaxy: Galaxy;

  constructor() {
    this.galaxy = this.generateInitialGalaxy();
  }

  private generateInitialGalaxy(): Galaxy {
    // Create a rich galaxy with multiple sectors and diverse systems
    const coreSector: Sector = {
      id: 'core-sector',
      name: 'Core Worlds Sector',
      position: { x: 0, y: 0 },
      systems: [
        this.createTestSystem('sol-system', 'Sol System', { x: 100, y: 100 }),
        this.createTestSystem('alpha-centauri', 'Alpha Centauri', { x: 200, y: 150 }),
        this.createTestSystem('sirius', 'Sirius System', { x: 300, y: 200 }),
        this.createTestSystem('vega', 'Vega System', { x: 400, y: 120 }),
        this.createTestSystem('arcturus', 'Arcturus System', { x: 150, y: 300 })
      ],
      controllingFaction: 'Earth Federation',
      description: 'The heart of human civilization, containing Sol and the most developed systems.'
    };

    const frontierSector: Sector = {
      id: 'frontier-sector',
      name: 'Frontier Sector',
      position: { x: 500, y: 0 },
      systems: [
        this.createTestSystem('kepler-442', 'Kepler-442 System', { x: 600, y: 100 }),
        this.createTestSystem('gliese-667c', 'Gliese 667C System', { x: 700, y: 200 }),
        this.createTestSystem('trappist-1', 'TRAPPIST-1 System', { x: 800, y: 150 })
      ],
      controllingFaction: 'Outer Colonies Coalition',
      description: 'The expanding frontier of human space, filled with opportunities and dangers.'
    };

    const industrialSector: Sector = {
      id: 'industrial-sector',
      name: 'Industrial Sector',
      position: { x: 0, y: 400 },
      systems: [
        this.createTestSystem('bernard-star', 'Barnard\'s Star System', { x: 100, y: 500 }),
        this.createTestSystem('wolf-359', 'Wolf 359 System', { x: 200, y: 550 }),
        this.createTestSystem('ross-128', 'Ross 128 System', { x: 300, y: 480 })
      ],
      controllingFaction: 'Industrial Consortium',
      description: 'The manufacturing heart of human space, dominated by massive industrial operations.'
    };

    return {
      sectors: [coreSector, frontierSector, industrialSector],
      currentPlayerLocation: {
        sectorId: 'core-sector',
        systemId: 'sol-system',
        stationId: 'earth-station'
      }
    };
  }

  private createTestSystem(id: string, name: string, position: Coordinates): StarSystem {
    const stations: Station[] = [];
    const planets: Planet[] = [];

    // Create different systems with varying content and diverse station types
    switch (id) {
      case 'sol-system':
        // Earth System - Core Federation hub with multiple station types
        stations.push(
          {
            id: 'earth-station',
            name: 'Earth Station Alpha',
            type: 'trade',
            position: { x: position.x, y: position.y - 30 },
            faction: 'Earth Federation',
            dockingCapacity: 50,
            services: ['refuel', 'repair', 'trading', 'missions'],
            description: 'The primary orbital station around Earth, hub of interstellar commerce.'
          },
          {
            id: 'sol-military-base',
            name: 'Sol Defense Platform',
            type: 'military',
            position: { x: position.x - 40, y: position.y + 20 },
            faction: 'Earth Federation',
            dockingCapacity: 30,
            services: ['refuel', 'repair', 'military_contracts', 'weapons'],
            description: 'Heavily fortified military station protecting the Sol system.'
          },
          {
            id: 'sol-luxury-resort',
            name: 'Orbital Paradise Resort',
            type: 'luxury',
            position: { x: position.x + 60, y: position.y - 10 },
            faction: 'Neutral',
            dockingCapacity: 25,
            services: ['refuel', 'luxury_trading', 'entertainment', 'high_end_missions'],
            description: 'Exclusive resort station catering to the wealthy elite.'
          }
        );
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
        // Alpha Centauri - Mining and industrial focus
        stations.push(
          {
            id: 'centauri-outpost',
            name: 'Centauri Mining Outpost',
            type: 'mining',
            position: { x: position.x + 10, y: position.y - 20 },
            faction: 'Industrial Consortium',
            dockingCapacity: 20,
            services: ['refuel', 'trading', 'mining_contracts'],
            description: 'A remote mining station extracting rare minerals.'
          },
          {
            id: 'centauri-refinery',
            name: 'Centauri Processing Station',
            type: 'industrial',
            position: { x: position.x - 25, y: position.y + 15 },
            faction: 'Industrial Consortium',
            dockingCapacity: 35,
            services: ['refuel', 'repair', 'trading', 'manufacturing'],
            description: 'Major industrial complex processing raw materials from system mines.'
          }
        );
        break;

      case 'sirius':
        // Sirius - Research and diplomatic focus
        stations.push(
          {
            id: 'sirius-research',
            name: 'Sirius Research Station',
            type: 'research',
            position: { x: position.x - 15, y: position.y + 25 },
            faction: 'Scientific Alliance',
            dockingCapacity: 15,
            services: ['repair', 'research', 'data_trading', 'tech_missions'],
            description: 'Advanced research facility studying stellar phenomena.'
          },
          {
            id: 'sirius-diplomatic',
            name: 'Sirius Diplomatic Station',
            type: 'diplomatic',
            position: { x: position.x + 30, y: position.y - 10 },
            faction: 'Neutral',
            dockingCapacity: 20,
            services: ['refuel', 'diplomatic_missions', 'faction_relations', 'mediation'],
            description: 'Neutral diplomatic station facilitating inter-faction negotiations.'
          }
        );
        break;

      case 'vega':
        // Vega - Entertainment and black market focus
        stations.push(
          {
            id: 'vega-entertainment',
            name: 'Vega Entertainment Complex',
            type: 'entertainment',
            position: { x: position.x, y: position.y - 20 },
            faction: 'Neutral',
            dockingCapacity: 40,
            services: ['refuel', 'entertainment', 'gambling', 'information_trading'],
            description: 'Massive entertainment complex with casinos, clubs, and information brokers.'
          },
          {
            id: 'vega-smugglers-den',
            name: 'Vega Freeport',
            type: 'pirate',
            position: { x: position.x - 35, y: position.y + 30 },
            faction: 'Pirates',
            dockingCapacity: 15,
            services: ['black_market', 'smuggling_missions', 'pirate_contracts'],
            description: 'Notorious pirate haven where no questions are asked and credits talk.'
          }
        );
        break;

      case 'arcturus':
        // Arcturus - Agricultural and medical focus
        stations.push(
          {
            id: 'arcturus-agricultural',
            name: 'Arcturus Agricultural Station',
            type: 'agricultural',
            position: { x: position.x + 20, y: position.y - 15 },
            faction: 'Earth Federation',
            dockingCapacity: 30,
            services: ['refuel', 'trading', 'food_production', 'bio_research'],
            description: 'Advanced agricultural station producing food for the Core Worlds.'
          },
          {
            id: 'arcturus-medical',
            name: 'Arcturus Medical Center',
            type: 'medical',
            position: { x: position.x - 20, y: position.y + 25 },
            faction: 'Medical Corps',
            dockingCapacity: 25,
            services: ['medical_treatment', 'pharmaceutical_trading', 'research', 'humanitarian_missions'],
            description: 'Premier medical facility serving the Core Worlds and beyond.'
          }
        );
        break;

      case 'kepler-442':
        // Kepler-442 - Frontier exploration and survey focus
        stations.push(
          {
            id: 'kepler-survey',
            name: 'Kepler Survey Station',
            type: 'exploration',
            position: { x: position.x, y: position.y - 25 },
            faction: 'Outer Colonies Coalition',
            dockingCapacity: 20,
            services: ['refuel', 'repair', 'exploration_missions', 'cartography'],
            description: 'Frontier survey station mapping unexplored regions of space.'
          },
          {
            id: 'kepler-colonial',
            name: 'New Kepler Colony Hub',
            type: 'colonial',
            position: { x: position.x + 30, y: position.y + 20 },
            faction: 'Outer Colonies Coalition',
            dockingCapacity: 35,
            services: ['trading', 'colonist_transport', 'supply_missions', 'construction'],
            description: 'Colonial administration center coordinating frontier settlement efforts.'
          }
        );
        break;

      case 'gliese-667c':
        // Gliese 667C - Salvage and recycling operations
        stations.push(
          {
            id: 'gliese-salvage',
            name: 'Gliese Salvage Yards',
            type: 'salvage',
            position: { x: position.x - 10, y: position.y + 30 },
            faction: 'Salvage Guild',
            dockingCapacity: 25,
            services: ['salvage_missions', 'scrap_trading', 'ship_breaking', 'rare_parts'],
            description: 'Massive salvage operation processing derelict ships and space debris.'
          }
        );
        break;

      case 'trappist-1':
        // TRAPPIST-1 - Scientific research outpost
        stations.push(
          {
            id: 'trappist-observatory',
            name: 'TRAPPIST Deep Space Observatory',
            type: 'observatory',
            position: { x: position.x, y: position.y - 30 },
            faction: 'Scientific Alliance',
            dockingCapacity: 15,
            services: ['research', 'deep_space_missions', 'astronomical_data', 'long_range_scanning'],
            description: 'Remote observatory studying distant galaxies and cosmic phenomena.'
          }
        );
        break;

      case 'bernard-star':
        // Barnard's Star - Heavy industrial manufacturing
        stations.push(
          {
            id: 'barnard-foundry',
            name: 'Barnard Heavy Industries',
            type: 'foundry',
            position: { x: position.x, y: position.y - 20 },
            faction: 'Industrial Consortium',
            dockingCapacity: 40,
            services: ['ship_construction', 'heavy_manufacturing', 'industrial_trading', 'bulk_transport'],
            description: 'Massive industrial complex specializing in ship construction and heavy manufacturing.'
          },
          {
            id: 'barnard-worker-habitat',
            name: 'Barnard Worker Habitat',
            type: 'habitat',
            position: { x: position.x + 35, y: position.y + 15 },
            faction: 'Industrial Consortium',
            dockingCapacity: 50,
            services: ['residential', 'worker_transport', 'basic_trading', 'recreational'],
            description: 'Residential station housing thousands of industrial workers and their families.'
          }
        );
        break;

      case 'wolf-359':
        // Wolf 359 - Security and prison focus
        stations.push(
          {
            id: 'wolf-security',
            name: 'Wolf 359 Security Station',
            type: 'security',
            position: { x: position.x - 25, y: position.y },
            faction: 'Security Forces',
            dockingCapacity: 30,
            services: ['security_missions', 'law_enforcement', 'prisoner_transport', 'bounty_hunting'],
            description: 'High-security station coordinating law enforcement across industrial sectors.'
          },
          {
            id: 'wolf-prison',
            name: 'Wolf Penitentiary Complex',
            type: 'prison',
            position: { x: position.x + 40, y: position.y + 25 },
            faction: 'Security Forces',
            dockingCapacity: 10,
            services: ['prisoner_transport', 'rehabilitation_programs', 'restricted_access'],
            description: 'Maximum security prison complex for the most dangerous criminals.'
          }
        );
        break;

      case 'ross-128':
        // Ross 128 - Energy production and fuel depot
        stations.push(
          {
            id: 'ross-energy',
            name: 'Ross Stellar Energy Plant',
            type: 'energy',
            position: { x: position.x, y: position.y - 30 },
            faction: 'Industrial Consortium',
            dockingCapacity: 25,
            services: ['fuel_depot', 'energy_trading', 'stellar_harvesting', 'power_systems'],
            description: 'Advanced stellar energy collection facility powering industrial operations.'
          }
        );
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

  /**
   * Get a station by its ID
   */
  getStationById(stationId: string): Station | undefined {
    for (const sector of this.galaxy.sectors) {
      for (const system of sector.systems) {
        const station = system.stations.find(s => s.id === stationId);
        if (station) return station;
      }
    }
    return undefined;
  }

  /**
   * Get a system by its ID
   */
  getSystemById(systemId: string): StarSystem | undefined {
    for (const sector of this.galaxy.sectors) {
      const system = sector.systems.find(s => s.id === systemId);
      if (system) return system;
    }
    return undefined;
  }
}