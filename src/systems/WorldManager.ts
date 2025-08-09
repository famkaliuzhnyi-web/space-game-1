import { Galaxy, Sector, StarSystem, Station, Planet, Coordinates, NavigationTarget } from '../types/world';
import { Ship } from '../types/player';
import { SceneManager } from '../engine/SceneManager';

export class WorldManager {
  private galaxy: Galaxy;
  private playerShip: Ship | null = null;
  private playerManager: any = null; // PlayerManager reference
  private shipMovement: {
    isMoving: boolean;
    startPos: Coordinates;
    targetPos: Coordinates;
    startTime: number;
    duration: number;
  } | null = null;
  private sceneManager: SceneManager | null = null;
  private pendingDockingTarget: string | null = null;
  private npcAIManager: any = null; // NPCAIManager reference for getting NPC ships

  constructor() {
    this.galaxy = this.generateInitialGalaxy();
  }

  /**
   * Set the player's ship for rendering and position tracking
   */
  setPlayerShip(ship: Ship): void {
    this.playerShip = ship;
    
    // Also set ship in scene manager if available
    if (this.sceneManager) {
      this.sceneManager.setPlayerShip(ship);
    }
  }

  /**
   * Set the player manager for station status updates
   */
  setPlayerManager(playerManager: any): void {
    this.playerManager = playerManager;
  }

  /**
   * Set the scene manager for actor-based movement
   */
  setSceneManager(sceneManager: SceneManager): void {
    this.sceneManager = sceneManager;
    
    // Set current ship if available
    if (this.playerShip) {
      this.sceneManager.setPlayerShip(this.playerShip);
    }
  }

  /**
   * Set the NPC AI manager for getting NPC ships
   */
  setNPCAIManager(npcAIManager: any): void {
    this.npcAIManager = npcAIManager;
  }

  /**
   * Update ship movement animation
   */
  updateShipMovement(_deltaTime: number): void {
    if (!this.shipMovement || !this.playerShip) return;

    const elapsed = Date.now() - this.shipMovement.startTime;
    const progress = Math.min(elapsed / this.shipMovement.duration, 1.0);

    // Interpolate position
    const currentX = this.shipMovement.startPos.x + 
      (this.shipMovement.targetPos.x - this.shipMovement.startPos.x) * progress;
    const currentY = this.shipMovement.startPos.y + 
      (this.shipMovement.targetPos.y - this.shipMovement.startPos.y) * progress;

    // Update ship coordinates
    this.playerShip.location.coordinates = { x: currentX, y: currentY };

    // Check if movement is complete
    if (progress >= 1.0) {
      this.playerShip.location.isInTransit = false;
      this.shipMovement = null;
      
      // Check if we need to dock at a station
      if (this.pendingDockingTarget) {
        // Dock at the target station
        this.galaxy.currentPlayerLocation.stationId = this.pendingDockingTarget;
        // Update player's current station status
        if (this.playerManager) {
          this.playerManager.setCurrentStation(this.pendingDockingTarget);
        }
        this.pendingDockingTarget = null;
      }
    }
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

    const miningSector: Sector = {
      id: 'mining-sector',
      name: 'Mining Sector',
      position: { x: 600, y: 300 },
      systems: [
        this.createTestSystem('mining-belt-alpha', 'Mining Belt Alpha', { x: 700, y: 400 }),
        this.createTestSystem('mining-belt-beta', 'Mining Belt Beta', { x: 800, y: 350 }),
        this.createTestSystem('mining-belt-gamma', 'Mining Belt Gamma', { x: 750, y: 450 }),
        this.createTestSystem('deep-core-system', 'Deep Core Mining System', { x: 850, y: 400 })
      ],
      controllingFaction: 'Mining Guild',
      description: 'Rich asteroid belts and mining operations extracting raw materials for the production chain.'
    };

    const manufacturingSector: Sector = {
      id: 'manufacturing-sector',
      name: 'Manufacturing Sector',
      position: { x: 500, y: 600 },
      systems: [
        this.createTestSystem('assembly-prime', 'Assembly Prime System', { x: 600, y: 700 }),
        this.createTestSystem('component-forge', 'Component Forge System', { x: 700, y: 650 }),
        this.createTestSystem('refinery-central', 'Central Refinery System', { x: 550, y: 750 }),
        this.createTestSystem('shipyard-nexus', 'Shipyard Nexus System', { x: 650, y: 600 })
      ],
      controllingFaction: 'Manufacturing Alliance',
      description: 'Advanced manufacturing facilities that process raw materials into finished products and ships.'
    };

    const expansionSector: Sector = {
      id: 'expansion-sector',
      name: 'Expansion Sector',
      position: { x: 900, y: 100 },
      systems: [
        this.createTestSystem('new-horizon', 'New Horizon System', { x: 1000, y: 200 }),
        this.createTestSystem('distant-reach', 'Distant Reach System', { x: 1100, y: 150 }),
        this.createTestSystem('outer-rim', 'Outer Rim System', { x: 950, y: 250 }),
        this.createTestSystem('frontier-edge', 'Frontier Edge System', { x: 1050, y: 100 })
      ],
      controllingFaction: 'Expansion Fleet',
      description: 'Newly settled systems on the very edge of known space, requiring constant supply chains.'
    };

    return {
      sectors: [coreSector, frontierSector, industrialSector, miningSector, manufacturingSector, expansionSector],
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
        planets.push(
          {
            id: 'earth',
            name: 'Earth',
            type: 'terrestrial',
            position: { x: position.x, y: position.y - 120 },
            radius: 20,
            habitable: true,
            population: 8000000000,
            description: 'Birthplace of humanity.'
          },
          {
            id: 'mars',
            name: 'Mars',
            type: 'desert',
            position: { x: position.x + 80, y: position.y - 180 },
            radius: 15,
            habitable: false,
            population: 50000000,
            description: 'The red planet, first human colony beyond Earth.'
          },
          {
            id: 'jupiter',
            name: 'Jupiter',
            type: 'gas-giant',
            position: { x: position.x - 150, y: position.y + 200 },
            radius: 35,
            habitable: false,
            description: 'Massive gas giant with numerous mining stations in its orbit.'
          }
        );
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
        planets.push(
          {
            id: 'proxima-b',
            name: 'Proxima Centauri b',
            type: 'terrestrial',
            position: { x: position.x + 20, y: position.y - 40 },
            radius: 18,
            habitable: true,
            population: 5000000,
            description: 'Rocky planet in the habitable zone, humanity\'s first interstellar colony.'
          },
          {
            id: 'alpha-centauri-mining',
            name: 'Centauri Mining World',
            type: 'desert',
            position: { x: position.x - 30, y: position.y + 50 },
            radius: 12,
            habitable: false,
            description: 'Mineral-rich desert world, heavily strip-mined for rare elements.'
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
        planets.push(
          {
            id: 'sirius-research-world',
            name: 'Sirius Research World',
            type: 'ice',
            position: { x: position.x, y: position.y - 60 },
            radius: 22,
            habitable: false,
            description: 'Frozen world with advanced underground research facilities.'
          },
          {
            id: 'sirius-ocean',
            name: 'Sirius Ocean World',
            type: 'ocean',
            position: { x: position.x + 40, y: position.y + 30 },
            radius: 25,
            habitable: true,
            population: 2000000,
            description: 'Water world with floating cities and oceanic research stations.'
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
        planets.push(
          {
            id: 'vega-prime',
            name: 'Vega Prime',
            type: 'terrestrial',
            position: { x: position.x + 25, y: position.y + 40 },
            radius: 19,
            habitable: true,
            population: 100000000,
            description: 'Cosmopolitan world known for its entertainment districts and liberal laws.'
          },
          {
            id: 'vega-asteroid-haven',
            name: 'Vega Asteroid Base',
            type: 'desert',
            position: { x: position.x - 50, y: position.y - 35 },
            radius: 8,
            habitable: false,
            description: 'Hollowed-out asteroid serving as a pirate stronghold and black market hub.'
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
          },
          {
            id: 'kepler-deep-space',
            name: 'Kepler Deep Space Station',
            type: 'observatory',
            position: { x: position.x - 40, y: position.y - 15 },
            faction: 'Scientific Alliance',
            dockingCapacity: 15,
            services: ['refuel', 'deep_space_missions', 'sensor_array', 'long_range_scanning'],
            description: 'Advanced sensor array monitoring the galactic edge for threats and opportunities.'
          }
        );
        planets.push(
          {
            id: 'kepler-442b',
            name: 'Kepler-442b',
            type: 'terrestrial',
            position: { x: position.x, y: position.y + 45 },
            radius: 21,
            habitable: true,
            population: 1000000,
            description: 'Super-Earth with perfect conditions for human colonization.'
          },
          {
            id: 'kepler-mining-world',
            name: 'Kepler Mining World',
            type: 'desert',
            position: { x: position.x - 35, y: position.y + 15 },
            radius: 11,
            habitable: false,
            description: 'Resource-rich world supplying the growing frontier colonies.'
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
        planets.push(
          {
            id: 'trappist-1b',
            name: 'TRAPPIST-1b',
            type: 'terrestrial',
            position: { x: position.x - 20, y: position.y - 15 },
            radius: 14,
            habitable: false,
            description: 'Innermost planet, too hot for habitation but rich in minerals.'
          },
          {
            id: 'trappist-1e',
            name: 'TRAPPIST-1e',
            type: 'terrestrial',
            position: { x: position.x + 15, y: position.y + 20 },
            radius: 16,
            habitable: true,
            population: 500000,
            description: 'Potentially habitable world with a small research colony.'
          },
          {
            id: 'trappist-1f',
            name: 'TRAPPIST-1f',
            type: 'ocean',
            position: { x: position.x + 35, y: position.y - 10 },
            radius: 17,
            habitable: true,
            population: 200000,
            description: 'Ocean world with underwater cities and research facilities.'
          },
          {
            id: 'trappist-1h',
            name: 'TRAPPIST-1h',
            type: 'ice',
            position: { x: position.x - 30, y: position.y + 25 },
            radius: 13,
            habitable: false,
            description: 'Frozen outer planet used as a research station and ice mining operation.'
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

      // MINING SECTOR SYSTEMS
      case 'mining-belt-alpha':
        // Primary iron and common metals mining
        stations.push(
          {
            id: 'alpha-iron-mines',
            name: 'Alpha Belt Iron Mines',
            type: 'mining',
            position: { x: position.x - 20, y: position.y },
            faction: 'Mining Guild',
            dockingCapacity: 30,
            services: ['refuel', 'basic_repair', 'raw_materials_trading', 'mining_equipment'],
            description: 'Massive iron ore extraction operation in the Alpha asteroid belt.'
          },
          {
            id: 'alpha-copper-extraction',
            name: 'Alpha Copper Extraction Facility',
            type: 'mining',
            position: { x: position.x + 25, y: position.y - 15 },
            faction: 'Mining Guild',
            dockingCapacity: 20,
            services: ['refuel', 'copper_ore_trading', 'mining_contracts', 'equipment_maintenance'],
            description: 'Specialized copper mining operation producing materials for ship electronics.'
          }
        );
        break;

      case 'mining-belt-beta':
        // Titanium and rare metals mining
        stations.push(
          {
            id: 'beta-titanium-mines',
            name: 'Beta Belt Titanium Extraction',
            type: 'mining',
            position: { x: position.x, y: position.y - 25 },
            faction: 'Mining Guild',
            dockingCapacity: 25,
            services: ['refuel', 'repair', 'titanium_ore_trading', 'heavy_mining_equipment'],
            description: 'Premier titanium mining facility providing materials for ship hull construction.'
          },
          {
            id: 'beta-processing-station',
            name: 'Beta Ore Processing Station',
            type: 'industrial',
            position: { x: position.x + 30, y: position.y + 20 },
            faction: 'Mining Guild',
            dockingCapacity: 35,
            services: ['ore_processing', 'refined_materials', 'bulk_transport', 'quality_control'],
            description: 'Initial processing facility that prepares raw ores for transport to refineries.'
          }
        );
        break;

      case 'mining-belt-gamma':
        // Rare earth elements and exotic materials
        stations.push(
          {
            id: 'gamma-rare-earth-facility',
            name: 'Gamma Rare Earth Facility',
            type: 'mining',
            position: { x: position.x - 15, y: position.y + 20 },
            faction: 'Mining Guild',
            dockingCapacity: 20,
            services: ['rare_materials_extraction', 'exotic_ore_trading', 'specialized_equipment', 'research_support'],
            description: 'High-tech mining operation extracting rare earth elements for advanced ship systems.'
          }
        );
        break;

      case 'deep-core-system':
        // Deep space mining headquarters
        stations.push(
          {
            id: 'deep-core-command',
            name: 'Deep Core Mining Command',
            type: 'industrial',
            position: { x: position.x, y: position.y },
            faction: 'Mining Guild',
            dockingCapacity: 50,
            services: ['mining_coordination', 'bulk_storage', 'transport_hub', 'guild_administration'],
            description: 'Central command station coordinating all mining operations across the sector.'
          },
          {
            id: 'deep-core-depot',
            name: 'Deep Core Supply Depot',
            type: 'trade',
            position: { x: position.x + 40, y: position.y - 30 },
            faction: 'Mining Guild',
            dockingCapacity: 60,
            services: ['bulk_trading', 'mining_supplies', 'equipment_sales', 'transport_services'],
            description: 'Major supply depot providing equipment and services to mining operations.'
          }
        );
        break;

      // MANUFACTURING SECTOR SYSTEMS  
      case 'refinery-central':
        // Central refining operations
        stations.push(
          {
            id: 'central-steel-refinery',
            name: 'Central Steel Refinery',
            type: 'industrial',
            position: { x: position.x, y: position.y - 20 },
            faction: 'Manufacturing Alliance',
            dockingCapacity: 40,
            services: ['ore_refining', 'steel_production', 'alloy_manufacturing', 'quality_testing'],
            description: 'Massive refinery converting raw ores into steel alloys for ship construction.'
          },
          {
            id: 'titanium-processing-plant',
            name: 'Titanium Processing Plant',
            type: 'industrial',
            position: { x: position.x + 35, y: position.y + 15 },
            faction: 'Manufacturing Alliance',
            dockingCapacity: 30,
            services: ['titanium_refining', 'hull_plate_manufacturing', 'precision_machining', 'surface_treatment'],
            description: 'Specialized facility creating titanium plates for advanced ship hulls.'
          }
        );
        break;

      case 'component-forge':
        // Ship component manufacturing
        stations.push(
          {
            id: 'component-manufacturing-hub',
            name: 'Component Manufacturing Hub',
            type: 'industrial',
            position: { x: position.x, y: position.y },
            faction: 'Manufacturing Alliance',
            dockingCapacity: 45,
            services: ['component_assembly', 'electronics_manufacturing', 'subsystem_production', 'testing_facilities'],
            description: 'Advanced facility producing ship components from processed materials.'
          },
          {
            id: 'fusion-drive-facility',
            name: 'Fusion Drive Manufacturing',
            type: 'industrial',
            position: { x: position.x - 30, y: position.y + 25 },
            faction: 'Manufacturing Alliance',
            dockingCapacity: 25,
            services: ['fusion_drive_production', 'propulsion_systems', 'drive_testing', 'advanced_engineering'],
            description: 'Specialized facility manufacturing fusion drives for starship propulsion.'
          }
        );
        break;

      case 'assembly-prime':
        // Ship hull assembly
        stations.push(
          {
            id: 'hull-assembly-station',
            name: 'Prime Hull Assembly Station',
            type: 'industrial',
            position: { x: position.x, y: position.y - 30 },
            faction: 'Manufacturing Alliance',
            dockingCapacity: 50,
            services: ['hull_assembly', 'structural_engineering', 'framework_construction', 'hull_testing'],
            description: 'Massive facility assembling ship hulls from processed titanium plates and components.'
          }
        );
        break;

      case 'shipyard-nexus':
        // Final ship construction and delivery
        stations.push(
          {
            id: 'nexus-shipyard-alpha',
            name: 'Nexus Shipyard Alpha',
            type: 'shipyard',
            position: { x: position.x - 25, y: position.y },
            faction: 'Manufacturing Alliance',
            dockingCapacity: 30,
            services: ['ship_construction', 'final_assembly', 'system_integration', 'delivery_coordination'],
            description: 'Premier shipyard facility completing final ship assembly and delivery.'
          },
          {
            id: 'nexus-shipyard-beta',
            name: 'Nexus Shipyard Beta',
            type: 'shipyard',
            position: { x: position.x + 30, y: position.y + 20 },
            faction: 'Manufacturing Alliance',
            dockingCapacity: 25,
            services: ['ship_construction', 'custom_orders', 'upgrade_installation', 'quality_assurance'],
            description: 'Specialized shipyard for custom ship orders and advanced modifications.'
          }
        );
        break;

      // EXPANSION SECTOR SYSTEMS
      case 'new-horizon':
        // New colony requiring supply chain
        stations.push(
          {
            id: 'horizon-colony-hub',
            name: 'New Horizon Colony Hub',
            type: 'colonial',
            position: { x: position.x, y: position.y },
            faction: 'Expansion Fleet',
            dockingCapacity: 35,
            services: ['colonist_services', 'supply_distribution', 'ship_delivery_reception', 'frontier_coordination'],
            description: 'Growing colony that represents the end point of the complete production chain.'
          }
        );
        break;

      case 'distant-reach':
        // Remote trading post
        stations.push(
          {
            id: 'reach-trading-post',
            name: 'Distant Reach Trading Post',
            type: 'trade',
            position: { x: position.x, y: position.y },
            faction: 'Expansion Fleet',
            dockingCapacity: 20,
            services: ['frontier_trading', 'ship_sales', 'supply_depot', 'exploration_support'],
            description: 'Remote trading station where completed ships are delivered to frontier operations.'
          }
        );
        break;

      case 'outer-rim':
        // Military outpost needing ships
        stations.push(
          {
            id: 'rim-defense-station',
            name: 'Outer Rim Defense Station',
            type: 'military',
            position: { x: position.x, y: position.y },
            faction: 'Expansion Fleet',
            dockingCapacity: 40,
            services: ['military_operations', 'fleet_maintenance', 'ship_procurement', 'defense_coordination'],
            description: 'Military station requiring a constant supply of ships from the production chain.'
          }
        );
        break;

      case 'frontier-edge':
        // Deep space exploration base
        stations.push(
          {
            id: 'edge-exploration-base',
            name: 'Frontier Edge Exploration Base',
            type: 'exploration',
            position: { x: position.x, y: position.y },
            faction: 'Expansion Fleet',
            dockingCapacity: 15,
            services: ['exploration_missions', 'deep_space_operations', 'ship_resupply', 'survey_coordination'],
            description: 'Cutting-edge exploration facility that relies on the production chain for ship supplies.'
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

  /**
   * Get the current player position - either station position or system position
   */
  getCurrentPlayerPosition(): Coordinates {
    const currentStation = this.getCurrentStation();
    if (currentStation) {
      return currentStation.position;
    }
    
    const currentSystem = this.getCurrentSystem();
    if (currentSystem) {
      return currentSystem.position;
    }
    
    // Fallback to origin if no current location
    return { x: 0, y: 0 };
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
      // Clear player's current station status when navigating to a system
      if (this.playerManager) {
        this.playerManager.setCurrentStation(null);
      }
    } else if (target.type === 'station') {
      // For stations, move the ship to the station coordinates first
      // The ship will automatically dock when it reaches the station
      const success = this.moveShipToCoordinates(target.position.x, target.position.y);
      if (success) {
        // Store the target station ID so we can dock when movement completes
        this.pendingDockingTarget = targetId;
      }
      return success;
    }

    return true;
  }

  /**
   * Move the player's ship to specific coordinates in space
   */
  moveShipToCoordinates(worldX: number, worldY: number): boolean {
    if (!this.playerShip || !this.playerShip.location.coordinates) return false;

    // Add reasonable bounds to prevent ship from going too far off-screen
    const currentSystem = this.getCurrentSystem();
    if (currentSystem) {
      const systemX = currentSystem.position.x;
      const systemY = currentSystem.position.y;
      
      // Limit movement to a reasonable area around the system (±300 units)
      const boundedX = Math.max(systemX - 300, Math.min(systemX + 300, worldX));
      const boundedY = Math.max(systemY - 300, Math.min(systemY + 300, worldY));
      
      worldX = boundedX;
      worldY = boundedY;
    }

    // Use scene manager for actor-based movement if available
    if (this.sceneManager) {
      // Set up movement completion callback for docking
      const success = this.sceneManager.moveShipTo(worldX, worldY, () => {
        // This callback will be called when movement completes
        if (this.pendingDockingTarget) {
          // Dock at the target station
          this.galaxy.currentPlayerLocation.stationId = this.pendingDockingTarget;
          // Update player's current station status
          if (this.playerManager) {
            this.playerManager.setCurrentStation(this.pendingDockingTarget);
          }
          this.pendingDockingTarget = null;
        }
      });
      return success;
    }

    // Fallback to legacy movement system
    this.shipMovement = {
      isMoving: true,
      startPos: { ...this.playerShip.location.coordinates },
      targetPos: { x: worldX, y: worldY },
      startTime: Date.now(),
      duration: 3000 // 3 seconds for movement
    };

    // Set ship to transit state
    this.playerShip.location.isInTransit = true;
    this.playerShip.location.stationId = undefined; // No longer docked
    
    // Clear player's current station status when ship starts moving
    if (this.playerManager) {
      this.playerManager.setCurrentStation(null);
    }
    
    console.log(`Ship moving from (${this.shipMovement.startPos.x}, ${this.shipMovement.startPos.y}) to (${worldX}, ${worldY})`);
    
    return true;
  }

  private calculateDistance(pos1: Coordinates, pos2: Coordinates): number {
    const dx = pos2.x - pos1.x;
    const dy = pos2.y - pos1.y;
    return Math.sqrt(dx * dx + dy * dy);
  }

  getAllVisibleObjects(): Array<{type: string, object: Station | Planet | Ship | {name: string; type: string}, position: Coordinates}> {
    const currentSystem = this.getCurrentSystem();
    if (!currentSystem) return [];

    const objects: Array<{type: string, object: Station | Planet | Ship | {name: string; type: string}, position: Coordinates}> = [];

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

    // Add player ship if in this system and has coordinates
    if (this.playerShip && 
        this.playerShip.location.systemId === currentSystem.id && 
        this.playerShip.location.coordinates) {
      objects.push({
        type: 'ship',
        object: this.playerShip,
        position: this.playerShip.location.coordinates
      });
    }

    // Add NPC ships if available
    if (this.npcAIManager) {
      const npcShips = this.npcAIManager.getNPCsInSystem(currentSystem.id);
      npcShips.forEach((npcShip: any) => {
        if (npcShip.position.coordinates) {
          objects.push({
            type: 'npc-ship',
            object: npcShip,
            position: npcShip.position.coordinates
          });
        }
      });
    }

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

  // Navigation Integration Methods

  /**
   * Create a NavigationTarget from a station
   */
  createStationTarget(stationId: string): NavigationTarget | null {
    const station = this.getStationById(stationId);
    if (!station) return null;

    const currentPos = this.getCurrentPlayerPosition();
    const distance = this.calculateDistance(currentPos, station.position);
    
    return {
      type: 'station',
      id: station.id,
      name: station.name,
      position: station.position,
      distance,
      estimatedTravelTime: this.estimateStationTravelTime(station)
    };
  }

  /**
   * Create a NavigationTarget from a system
   */
  createSystemTarget(systemId: string): NavigationTarget | null {
    const system = this.getSystemById(systemId);
    if (!system) return null;

    const currentPos = this.getCurrentPlayerPosition();
    const distance = this.calculateDistance(currentPos, system.position);
    
    return {
      type: 'system',
      id: system.id,
      name: system.name,
      position: system.position,
      distance,
      estimatedTravelTime: this.estimateSystemTravelTime(system)
    };
  }

  /**
   * Get station by ID from all sectors/systems
   */
  getStationById(stationId: string): Station | null {
    for (const sector of this.galaxy.sectors) {
      for (const system of sector.systems) {
        const station = system.stations.find(s => s.id === stationId);
        if (station) return station;
      }
    }
    return null;
  }

  /**
   * Get system by ID from all sectors
   */
  getSystemById(systemId: string): StarSystem | null {
    for (const sector of this.galaxy.sectors) {
      const system = sector.systems.find(s => s.id === systemId);
      if (system) return system;
    }
    return null;
  }

  /**
   * Estimate travel time to a station (in milliseconds)
   */
  private estimateStationTravelTime(station: Station): number {
    const currentSystem = this.getCurrentSystem();
    if (!currentSystem) return 0;

    const currentPos = this.getCurrentPlayerPosition();
    const distance = this.calculateDistance(currentPos, station.position);
    
    // Check if station is in the same system
    const isInSameSystem = currentSystem.stations.some(s => s.id === station.id);
    const baseSpeed = isInSameSystem ? 150 : 50; // Faster travel within system
    
    const travelTimeHours = Math.max(0.01, distance / baseSpeed);
    return travelTimeHours * 60 * 60 * 1000; // Convert to milliseconds
  }

  /**
   * Estimate travel time to a system (in milliseconds)
   */
  private estimateSystemTravelTime(system: StarSystem): number {
    const currentPos = this.getCurrentPlayerPosition();
    const distance = this.calculateDistance(currentPos, system.position);
    
    // Inter-system travel is typically slower
    const baseSpeed = 25; // Slow jump drive speeds
    const travelTimeHours = Math.max(0.5, distance / baseSpeed); // Minimum 30 minutes for system jumps
    return travelTimeHours * 60 * 60 * 1000; // Convert to milliseconds
  }

  /**
   * Get all reachable stations as navigation targets
   */
  getAllReachableStations(): NavigationTarget[] {
    const targets: NavigationTarget[] = [];
    const currentPos = this.getCurrentPlayerPosition();
    
    for (const sector of this.galaxy.sectors) {
      for (const system of sector.systems) {
        for (const station of system.stations) {
          // Skip current location
          if (station.id === this.galaxy.currentPlayerLocation.stationId) continue;
          
          const distance = this.calculateDistance(currentPos, station.position);
          targets.push({
            type: 'station',
            id: station.id,
            name: station.name,
            position: station.position,
            distance,
            estimatedTravelTime: this.estimateStationTravelTime(station)
          });
        }
      }
    }
    
    return targets.sort((a, b) => a.distance - b.distance);
  }

  /**
   * Get all reachable systems as navigation targets
   */
  getAllReachableSystems(): NavigationTarget[] {
    const targets: NavigationTarget[] = [];
    const currentPos = this.getCurrentPlayerPosition();
    
    for (const sector of this.galaxy.sectors) {
      for (const system of sector.systems) {
        // Skip current system
        if (system.id === this.galaxy.currentPlayerLocation.systemId) continue;
        
        const distance = this.calculateDistance(currentPos, system.position);
        targets.push({
          type: 'system',
          id: system.id,
          name: system.name,
          position: system.position,
          distance,
          estimatedTravelTime: this.estimateSystemTravelTime(system)
        });
      }
    }
    
    return targets.sort((a, b) => a.distance - b.distance);
  }
}