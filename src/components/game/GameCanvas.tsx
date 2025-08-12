import React, { useRef, useEffect, useState, Suspense, startTransition } from 'react';
import { Engine } from '../../engine';
import { NavigationPanel, SectorsMapPanel, MarketPanel, ContractPanel, TradeRoutePanel, EquipmentMarketPanel, FactionReputationPanel, CharacterSheet, EventsPanel, InfoPanel } from '../ui';
// Import heavy panels lazily
import { 
  FleetManagementPanel, 
  AchievementsPanel, 
  SecurityPanel, 
  HackingPanel, 
  CombatPanel, 
  InvestmentPanel, 
  QuestPanel,
  CharacterCreationPanel,
  ScenarioSelectionPanel
} from '../ui/lazy';
import MaintenancePanel from '../ui/MaintenancePanel';
import PlayerInventoryPanel from '../ui/PlayerInventoryPanel';
import StationContactsPanel from '../ui/StationContactsPanel';
import LoadingPanel from '../ui/LoadingPanel';
import { NPCPanel } from './NPCPanel';
import { Market, TradeContract, RouteAnalysis } from '../../types/economy';
import { CargoItem, Ship, EquipmentItem, FactionReputation } from '../../types/player';
import { NPCShip } from '../../types/npc';
import { GameEvent } from '../../types/events';
// import { ShipConstructionConfig, ShipConstructionSystem } from '../../systems/ShipConstructionSystem'; // DEPRECATED: Replaced with 3D system
import { ShipHubDesign } from '../../types/shipHubs';
import { HubShipConstructionSystem } from '../../systems/HubShipConstructionSystem';
import { Contact, InteractionType } from '../../types/contacts';
import { StartingScenario } from '../../types/startingScenarios';
import { STARTING_SCENARIOS } from '../../data/startingScenarios';

// Extend Window interface for our custom properties
interface WindowWithCustomProperties extends Window {
  eventSyncInterval?: NodeJS.Timeout;
}

interface GameCanvasProps {
  width?: number;
  height?: number;
  className?: string;
  debugMode?: boolean;
  debugShipConstructor?: boolean;
}

const GameCanvas: React.FC<GameCanvasProps> = ({ 
  className = '',
  debugMode = false,
  debugShipConstructor = false
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<Engine | null>(null);
  const [isEngineRunning, setIsEngineRunning] = useState(false);
  const [engineError, setEngineError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activePanel, setActivePanel] = useState<'navigation' | 'sectors-map' | 'market' | 'contracts' | 'routes' | 'inventory' | 'ship' | 'factions' | 'maintenance' | 'character' | 'contacts' | 'achievements' | 'events' | 'npcs' | 'security' | 'hacking' | 'combat' | 'investment' | 'quests' | null>(null);
  const [showEquipmentMarket, setShowEquipmentMarket] = useState(false);
  const [showCharacterCreation, setShowCharacterCreation] = useState(false);
  const [showScenarioSelection, setShowScenarioSelection] = useState(false);
  const [selectedScenario, setSelectedScenario] = useState<StartingScenario | null>(null);
  const [showNPCs, setShowNPCs] = useState(false);
  const [stationContacts, setStationContacts] = useState<Contact[]>([]);
  
  // Info panel state for object selection
  const [selectedObject, setSelectedObject] = useState<any>(null);
  const [showInfoPanel, setShowInfoPanel] = useState(false);

  // Helper function to safely update panels that contain lazy components
  const setActivePanelWithTransition = (panelName: typeof activePanel) => {
    // Panels that use lazy-loaded components should be wrapped in startTransition
    const lazyPanels = ['ship', 'achievements', 'security', 'hacking', 'combat', 'investment', 'quests'];
    
    if (panelName && lazyPanels.includes(panelName)) {
      startTransition(() => {
        setActivePanel(panelName);
      });
    } else {
      setActivePanel(panelName);
    }
  };

  // Helper function for toggling panels with lazy components
  const toggleActivePanelWithTransition = (panelName: typeof activePanel) => {
    const newPanel = activePanel === panelName ? null : panelName;
    setActivePanelWithTransition(newPanel);
  };

  // Helper function to safely close panels (with transition for lazy components)
  const closePanelWithTransition = () => {
    const lazyPanels = ['ship', 'achievements', 'security', 'hacking', 'combat', 'investment', 'quests'];
    
    if (activePanel && lazyPanels.includes(activePanel)) {
      startTransition(() => {
        setActivePanel(null);
      });
    } else {
      setActivePanel(null);
    }
  };
  
  // Computed panel visibility states for backward compatibility
  const showNavigation = activePanel === 'navigation';
  const showSectorsMap = activePanel === 'sectors-map';
  const showMarket = activePanel === 'market';
  const showContracts = activePanel === 'contracts';
  const showRouteAnalysis = activePanel === 'routes';
  const showInventory = activePanel === 'inventory';
  const showShipManagement = activePanel === 'ship';
  const showFactionReputation = activePanel === 'factions';
  const showMaintenance = activePanel === 'maintenance';
  const showCharacter = activePanel === 'character';
  const showContacts = activePanel === 'contacts';
  const showAchievements = activePanel === 'achievements';
  const showEvents = activePanel === 'events';
  const showSecurity = activePanel === 'security';
  const showHacking = activePanel === 'hacking';
  const showCombat = activePanel === 'combat';
  const showInvestment = activePanel === 'investment';

  const showQuests = activePanel === 'quests';
  const [currentMarket, setCurrentMarket] = useState<Market | null>(null);
  const [availableContracts, setAvailableContracts] = useState<TradeContract[]>([]);
  const [playerContracts, setPlayerContracts] = useState<TradeContract[]>([]);
  const [routeAnalysis, setRouteAnalysis] = useState<RouteAnalysis | null>(null);
  const [playerCredits, setPlayerCredits] = useState(10000);
  const [cargoItems, setCargoItems] = useState<CargoItem[]>([]);
  const [cargoUsed, setCargoUsed] = useState(0);
  const [cargoCapacity, setCargoCapacity] = useState(100);
  const [currentShip, setCurrentShip] = useState<Ship | null>(null);
  const [ownedShips, setOwnedShips] = useState<Ship[]>([]);
  const [currentShipId, setCurrentShipId] = useState<string>('');
  const [playerReputation, setPlayerReputation] = useState<Map<string, FactionReputation>>(new Map());
  const [activeEvents, setActiveEvents] = useState<GameEvent[]>([]);
  const [questCounts, setQuestCounts] = useState({ active: 0, available: 0, completed: 0 });
  // 3D mode is now the only mode - no need to track state

  useEffect(() => {
    if (!canvasRef.current || engineRef.current) return; // Prevent double initialization

    const initializeEngine = async () => {
      try {
        setIsLoading(true);
        setEngineError(null);

        // Add a small delay to ensure canvas is properly mounted
        await new Promise(resolve => setTimeout(resolve, 100));

        if (!canvasRef.current) {
          throw new Error('Canvas element not available');
        }

        // Check if we already have an engine (StrictMode double init prevention)
        if (engineRef.current) {
          console.log('Engine already initialized, skipping double initialization');
          setIsLoading(false);
          return;
        }

        // Initialize the game engine
        engineRef.current = new Engine(canvasRef.current);
        
        // Start the engine
        engineRef.current.start();
        setIsEngineRunning(true);
        setIsLoading(false);
        
        // 3D mode is now always available and active
        console.log('3D mode active:', engineRef.current.is3DAvailable());
        
        // Expose engine to window object for e2e testing in debug mode
        if (debugMode) {
          (window as any).gameEngine = engineRef.current;
          console.log('DEBUG: Game engine exposed to window.gameEngine for e2e testing');
        }
        
        // Initial resize to fit the container
        handleResize();
        
        // Set up object selection callback for info panel
        const renderer3D = engineRef.current.getThreeRenderer();
        if (renderer3D) {
          renderer3D.setObjectSelectionCallback((objectData) => {
            setSelectedObject(objectData);
            setShowInfoPanel(objectData !== null);
          });
        }
        
        // Sync player credits from PlayerManager
        const playerManager = engineRef.current.getPlayerManager();
        setPlayerCredits(playerManager.getCredits());
        setCargoItems(playerManager.getCargoManifest());
        setCargoUsed(playerManager.getCargoUsed());
        setCargoCapacity(playerManager.getCargoCapacity());
        setCurrentShip(playerManager.getShip());
        setOwnedShips(playerManager.getOwnedShips());
        setCurrentShipId(playerManager.getCurrentShipId());
        setPlayerReputation(playerManager.getPlayerReputation());

        // Sync active events from EventManager
        const eventManager = engineRef.current.getEventManager();
        setActiveEvents(eventManager.getActiveEvents());

        // Sync quest counts from QuestManager
        const questManager = engineRef.current.getQuestManager();
        const activeQuests = questManager.getActiveQuests();
        const availableQuests = questManager.getAvailableQuests();
        const completedQuests = questManager.getCompletedQuests();
        setQuestCounts({
          active: activeQuests.length,
          available: availableQuests.length,
          completed: completedQuests.length
        });

        // Set up periodic sync for events and quests (every 5 seconds)
        const eventSyncInterval = setInterval(() => {
          if (engineRef.current) {
            const eventManager = engineRef.current.getEventManager();
            setActiveEvents(eventManager.getActiveEvents());
            
            const questManager = engineRef.current.getQuestManager();
            const activeQuests = questManager.getActiveQuests();
            const availableQuests = questManager.getAvailableQuests();
            const completedQuests = questManager.getCompletedQuests();
            setQuestCounts({
              active: activeQuests.length,
              available: availableQuests.length,
              completed: completedQuests.length
            });
          }
        }, 5000);

        // Store interval ID for cleanup
        (window as WindowWithCustomProperties).eventSyncInterval = eventSyncInterval;

        // Check if character exists, prompt for scenario selection or character creation
        const characterManager = engineRef.current.getCharacterManager();
        const existingCharacter = characterManager.getCharacter();
        
        if (!existingCharacter) {
          if (debugMode || debugShipConstructor) {
            // In debug mode, automatically create a debug character and apply debug scenario
            console.log('Debug mode: Creating debug character automatically');
            
            // Choose appropriate scenario based on debug type
            const scenarioId = debugShipConstructor ? 'debug-ship-constructor' : 'debug-tester';
            const characterBackground = debugShipConstructor ? 'engineer' : 'merchant';
            
            // Create a debug character
            const debugCharacter = characterManager.createCharacter(
              `${scenarioId}-1`,
              debugShipConstructor ? 'Ship Constructor' : 'Debug Tester',
              { 
                gender: 'other', 
                age: 30, 
                portrait: 'debug-avatar',
                skinTone: 'medium',
                hairColor: 'brown',
                eyeColor: 'blue'
              },
              characterBackground,
              debugShipConstructor 
                ? { strength: 10, intelligence: 20, charisma: 10, endurance: 10, dexterity: 15, perception: 15 }
                : { strength: 15, intelligence: 15, charisma: 15, endurance: 15, dexterity: 15, perception: 15 },
              debugShipConstructor
                ? { trading: 15, negotiation: 10, economics: 15, engineering: 25, piloting: 20, navigation: 15, combat: 10, tactics: 10, security: 10, networking: 10, investigation: 10, leadership: 15 }
                : { trading: 10, negotiation: 10, economics: 10, engineering: 10, piloting: 10, navigation: 10, combat: 10, tactics: 10, security: 10, networking: 10, investigation: 10, leadership: 10 }
            );
            
            if (debugCharacter) {
              // Apply appropriate debug scenario
              const debugScenario = STARTING_SCENARIOS[scenarioId];
              if (debugScenario) {
                setSelectedScenario(debugScenario);
                handleScenarioApplication(debugScenario);
                console.log('Debug scenario applied:', debugScenario.name);
                
                // If debug ship constructor mode, automatically open ship management panel
                if (debugShipConstructor) {
                  setTimeout(() => {
                    console.log('Auto-opening ship management panel for ship constructor debug mode');
                    setActivePanelWithTransition('ship');
                  }, 1000); // Give time for scenario to be applied
                }
              }
            }
          } else {
            // Normal mode: Check if we need to show scenario selection first
            if (!selectedScenario) {
              startTransition(() => {
                setShowScenarioSelection(true);
              });
            } else {
              startTransition(() => {
                setShowCharacterCreation(true);
              });
            }
          }
        }
      } catch (error) {
        console.error('Failed to initialize game engine:', error);
        setEngineError(error instanceof Error ? error.message : 'Unknown error occurred');
        setIsLoading(false);
      }
    };

    initializeEngine();

    // Handle canvas resize
    const handleResize = () => {
      if (engineRef.current && canvasRef.current) {
        const container = canvasRef.current.parentElement;
        if (container) {
          const containerWidth = container.clientWidth;
          const containerHeight = container.clientHeight;
          
          // For full screen, use the full container dimensions
          engineRef.current.resizeCanvas(containerWidth, containerHeight);
        }
      }
    };
    
    // Listen for window resize
    window.addEventListener('resize', handleResize);

    // Listen for ESC key to close active panel
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.code === 'Escape') {
        setActivePanel(null);
      } else if (event.code === 'KeyN' && !event.shiftKey) {
        toggleActivePanelWithTransition('navigation');
      } else if (event.code === 'KeyN' && event.shiftKey) {
        setShowNPCs(prevShowNPCs => !prevShowNPCs);
      } else if (event.code === 'KeyS') {
        toggleActivePanelWithTransition('ship');
      } else if (event.code === 'KeyF') {
        toggleActivePanelWithTransition('factions');
      } else if (event.code === 'KeyP') {
        handleOpenContacts();
      } else if (event.code === 'KeyE') {
        toggleActivePanelWithTransition('events');
      } else if (event.code === 'KeyL') {
        toggleActivePanelWithTransition('security');
      } else if (event.code === 'KeyH') {
        toggleActivePanelWithTransition('hacking');
      } else if (event.code === 'KeyG') {
        toggleActivePanelWithTransition('combat');
      } else if (event.code === 'KeyI') {
        toggleActivePanelWithTransition('investment');
      } else if (event.code === 'KeyQ') {
        toggleActivePanelWithTransition('quests');
      }
    };
    window.addEventListener('keydown', handleKeyDown);

    // Cleanup
    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('keydown', handleKeyDown);
      
      // Clear event sync interval
      const windowWithInterval = window as WindowWithCustomProperties;
      if (windowWithInterval.eventSyncInterval) {
        clearInterval(windowWithInterval.eventSyncInterval);
        delete windowWithInterval.eventSyncInterval;
      }
      
      if (engineRef.current) {
        engineRef.current.dispose();
        engineRef.current = null; // Clear the reference
        setIsEngineRunning(false);
      }
    };
  }, [debugMode]);

  const toggleEngine = () => {
    if (!engineRef.current) return;
    
    if (isEngineRunning) {
      engineRef.current.stop();
      setIsEngineRunning(false);
    } else {
      engineRef.current.start();
      setIsEngineRunning(true);
    }
  };

  const retryInitialization = () => {
    setEngineError(null);
    setIsLoading(true);
    // Force re-mount by changing a key or reloading
    window.location.reload();
  };

  // Handler for applying selected starting scenario
  const handleScenarioApplication = (scenario: StartingScenario) => {
    if (engineRef.current) {
      try {
        const characterManager = engineRef.current.getCharacterManager();
        const character = characterManager.getCharacter();
        
        if (character) {
          // Apply scenario settings to existing character
          // Note: In a real implementation, this would need to integrate with the player manager
          // For now, we'll just log the scenario application
          console.log(`Applied starting scenario: ${scenario.name}`, scenario);
          
          // The scenario application would involve:
          // 1. Setting player credits
          // 2. Configuring starting ship
          // 3. Setting faction relationships
          // 4. Placing cargo in ship
          // 5. Setting starting location
          
          // Future: Use StartingScenarioManager to fully apply scenario
          // const scenarioManager = new StartingScenarioManager(characterManager);
          // const result = scenarioManager.applyScenario(scenario, character.name, character.appearance);
        }
      } catch (error) {
        console.error('Failed to apply starting scenario:', error);
      }
    }
  };

  const handleOpenMarket = () => {
    if (engineRef.current) {
      // Get the current station's market (use actual station ID)
      const economicSystem = engineRef.current.getEconomicSystem();
      const stationId = 'earth-station'; // This matches the actual station ID in WorldManager
      const market = economicSystem.getMarket(stationId);
      
      if (market) {
        setCurrentMarket(market);
        setActivePanel('market');
      } else {
        console.error('No market found for current station');
      }
    }
  };

  const handleTrade = (commodityId: string, quantity: number, isBuying: boolean) => {
    if (engineRef.current && currentMarket) {
      const economicSystem = engineRef.current.getEconomicSystem();
      const playerManager = engineRef.current.getPlayerManager();
      const progressionSystem = engineRef.current.getCharacterProgressionSystem();
      
      // Use the new integrated trading method
      const result = economicSystem.executeTradeWithPlayer(
        currentMarket.stationId, 
        commodityId, 
        quantity, 
        isBuying,
        playerManager
      );
      
      if (result.success) {
        // Award experience for trading activity
        const activity = isBuying ? 'trade_buy' : 'trade_sell';
        const tradeValue = result.totalCost || 0;
        const profitMargin = 0; // Simple implementation - could be enhanced later
        
        progressionSystem.awardTradingExperience(activity, {
          value: tradeValue,
          profitMargin: profitMargin
        });
        
        // Update player data from PlayerManager
        setPlayerCredits(playerManager.getCredits());
        setCargoItems(playerManager.getCargoManifest());
        setCargoUsed(playerManager.getCargoUsed());
        setCargoCapacity(playerManager.getCargoCapacity());
        
        // Refresh the market data
        const updatedMarket = economicSystem.getMarket(currentMarket.stationId);
        if (updatedMarket) {
          setCurrentMarket(updatedMarket);
        }
        
        console.log(`Trade successful: ${isBuying ? 'Bought' : 'Sold'} ${quantity} ${commodityId} for ${result.totalCost} credits`);
        console.log(`Player now has ${playerManager.getCredits()} credits`);
        console.log(`Cargo space: ${playerManager.getCargoUsed()}/${playerManager.getCargoCapacity()}`);
      } else {
        console.error('Trade failed:', result.error);
        alert(`Trade failed: ${result.error}`);
      }
    }
  };

  const handleOpenContracts = () => {
    if (engineRef.current) {
      const contractManager = engineRef.current.getContractManager();
      const available = contractManager.getAvailableContracts();
      const playerActive = contractManager.getPlayerContracts('player-1'); // Using placeholder player ID
      
      setAvailableContracts(available);
      setPlayerContracts(playerActive);
      setActivePanel('contracts');
    }
  };

  const handleOpenRouteAnalysis = () => {
    if (engineRef.current) {
      const routeAnalyzer = engineRef.current.getRouteAnalyzer();
      const economicSystem = engineRef.current.getEconomicSystem();
      const worldManager = engineRef.current.getWorldManager();
      
      // Get all markets and stations
      const markets = economicSystem.getAllMarkets();
      const stations = new Map(worldManager.getAllStations().map(station => [station.id, station]));
      
      // Analyze routes
      const analysis = routeAnalyzer.analyzeRoutes(markets, stations);
      setRouteAnalysis(analysis);
      setActivePanel('routes');
      
      console.log('Route analysis opened:', analysis.routes.length, 'routes found');
    }
  };

  const handleMaintenancePerformed = (cost: number) => {
    if (engineRef.current) {
      const playerManager = engineRef.current.getPlayerManager();
      playerManager.spendCredits(cost);
      setPlayerCredits(playerManager.getCredits());
      
      // Update ship condition in state
      setCurrentShip(playerManager.getShip());
      
      console.log(`Maintenance completed for ${cost} credits. Remaining: ${playerManager.getCredits()}`);
    }
  };

  const handleAcceptContract = (contractId: string) => {
    if (engineRef.current) {
      const contractManager = engineRef.current.getContractManager();
      const result = contractManager.acceptContract(contractId, 'player-1'); // Using placeholder player ID
      
      if (result.success) {
        // Refresh contract lists
        const available = contractManager.getAvailableContracts();
        const playerActive = contractManager.getPlayerContracts('player-1');
        
        setAvailableContracts(available);
        setPlayerContracts(playerActive);
        
        console.log('Contract accepted successfully');
      } else {
        console.error('Failed to accept contract:', result.error);
      }
    }
  };

  const handleNavigate = (targetId: string) => {
    if (engineRef.current) {
      const playerManager = engineRef.current.getPlayerManager();
      const worldManager = engineRef.current.getWorldManager();
      const progressionSystem = engineRef.current.getCharacterProgressionSystem();
      
      // Get the target from available targets
      const targets = worldManager.getAvailableTargets();
      const target = targets.find(t => t.id === targetId);
      
      if (!target) {
        console.error('Navigation target not found:', targetId);
        return;
      }

      // Check if ship is already in transit
      if (playerManager.isInTransit()) {
        console.warn('Ship is already in transit. Cancel current travel first.');
        return;
      }
      
      // Track previous location for first-visit detection
      const previousLocation = worldManager.getCurrentSystem();
      
      // Start travel using the NavigationManager through PlayerManager
      const travelResult = playerManager.startTravel(target);
      
      if (travelResult.success) {
        console.log(`Started travel to ${target.name}. Estimated arrival: ${travelResult.travelPlan?.estimatedArrivalTime}`);
        
        // Award exploration experience for initiating travel to new systems
        const currentLocation = worldManager.getCurrentSystem();
        if (currentLocation && target.type === 'system' && target.id !== previousLocation?.id) {
          // Award system visit experience
          progressionSystem.awardExplorationExperience('system_visit', {
            riskLevel: currentLocation.securityLevel ? (10 - currentLocation.securityLevel) / 2 : 1 // Lower security = higher risk = more XP
          });
        }
        
        // Award station discovery experience for new stations
        if (target.type === 'station') {
          progressionSystem.awardExplorationExperience('station_discovery', {
            riskLevel: currentLocation?.securityLevel ? (10 - currentLocation.securityLevel) / 2 : 1
          });
        }
      } else {
        console.error('Failed to start travel:', travelResult.error);
      }
    }
  };

  const handleNavigateToSector = (sectorId: string) => {
    if (engineRef.current) {
      const progressionSystem = engineRef.current.getCharacterProgressionSystem();
      
      // For now, just log the sector navigation - can be implemented later
      console.log(`Navigating to sector: ${sectorId}`);
      
      // Award sector exploration experience
      progressionSystem.awardExplorationExperience('sector_visit', {
        riskLevel: 2 // Sector navigation is moderately rewarding
      });
      
      // TODO: Implement actual sector navigation in WorldManager
    }
  };

  const getNavigationTargets = () => {
    if (engineRef.current) {
      const worldManager = engineRef.current.getWorldManager();
      const playerManager = engineRef.current.getPlayerManager();
      const targets = worldManager.getAvailableTargets();
      
      // Update targets with more accurate travel time estimates using NavigationManager
      return targets.map(target => {
        const estimatedTime = playerManager.estimateTravelTime(target);
        return {
          ...target,
          estimatedTravelTime: estimatedTime / (60 * 60 * 1000) // Convert from milliseconds to hours for display
        };
      });
    }
    return [];
  };

  const handlePurchaseEquipment = (equipment: EquipmentItem, cost: number) => {
    if (engineRef.current) {
      const playerManager = engineRef.current.getPlayerManager();
      
      // Deduct credits
      if (playerManager.getCredits() >= cost) {
        playerManager.spendCredits(cost);
        
        // Add equipment to player's inventory
        playerManager.addEquipmentToInventory(equipment);
        
        // Update UI
        setPlayerCredits(playerManager.getCredits());
        
        console.log(`Equipment purchased: ${equipment.name} for ${cost} credits`);
        alert(`Successfully purchased ${equipment.name}! You can now install it in the Ship Management panel.`);
        
        // Close equipment market
        setShowEquipmentMarket(false);
      } else {
        console.error('Insufficient credits for equipment purchase');
        alert('Insufficient credits for this purchase');
      }
    }
  };

  // Fleet Management Handlers
  const handleSwitchShip = (shipId: string) => {
    if (engineRef.current) {
      const playerManager = engineRef.current.getPlayerManager();
      const success = playerManager.switchToShip(shipId);
      
      if (success) {
        setCurrentShip(playerManager.getShip());
        setCurrentShipId(shipId);
        setCargoItems(playerManager.getCargoManifest());
        setCargoUsed(playerManager.getCargoUsed());
        setCargoCapacity(playerManager.getCargoCapacity());
        console.log(`Switched to ship: ${shipId}`);
      } else {
        alert('Failed to switch ships');
      }
    }
  };

  const handlePurchaseShip = (shipClassId: string) => {
    if (engineRef.current) {
      const playerManager = engineRef.current.getPlayerManager();
      const shipStorage = engineRef.current.getPlayerManager().getShipStorageManager();
      
      // Get ship cost from shipyard
      const station = engineRef.current.getWorldManager().getCurrentStation();
      if (station) {
        const offers = shipStorage.getShipYardOffers(station.id);
        const offer = offers.find(o => o.shipClassId === shipClassId);
        
        if (offer && playerManager.getCredits() >= offer.basePrice) {
          // Purchase the ship
          const success = shipStorage.purchaseShip(station.id, shipClassId, playerManager.getCredits(), playerManager.getId());
          
          if (success) {
            setPlayerCredits(playerManager.getCredits());
            setOwnedShips(playerManager.getOwnedShips());
            console.log(`Purchased ship: ${shipClassId}`);
            alert(`Successfully purchased ${offer.shipClass.name}!`);
          } else {
            alert('Failed to purchase ship');
          }
        } else {
          alert('Insufficient credits or ship not available');
        }
      }
    }
  };

  const handleConstructHubShip = (design: ShipHubDesign, shipName: string) => {
    if (engineRef.current) {
      const playerManager = engineRef.current.getPlayerManager();
      const hubConstructionSystem = new HubShipConstructionSystem();
      
      try {
        const availableMaterials = {
          'electronics': 1000,
          'steel': 1000,
          'composites': 1000,
          'fusion-cores': 100,
          'rare-metals': 50
        };

        const constraints = {
          maxShipSize: design.maxSize,
          availableTechLevel: 10,
          availableMaterials,
          requirePowerBalance: true,
          requireBasicSystems: true,
          requireLifeSupport: true,
          maxMassStructural: 1000
        };

        if (playerManager.getCredits() >= design.cost.totalCredits) {
          const station = engineRef.current.getWorldManager().getCurrentStation();
          if (station) {
            const newShip = hubConstructionSystem.constructShipFromHubDesign(
              design,
              shipName,
              station.id,
              constraints
            );
            
            // Add ship to player's fleet
            playerManager.getOwnedShipsMap().set(newShip.id, newShip);
            
            // Deduct credits
            playerManager.spendCredits(design.cost.totalCredits);
            
            // Update UI
            setPlayerCredits(playerManager.getCredits());
            setOwnedShips(playerManager.getOwnedShips());
            
            console.log(`Constructed hub ship: ${shipName}`);
            alert(`Successfully constructed ${shipName} using hub design!`);
          } else {
            alert('No station available for construction');
          }
        } else {
          alert('Insufficient credits for construction');
        }
      } catch (error) {
        console.error('Hub construction failed:', error);
        alert(`Hub construction failed: ${error}`);
      }
    }
  };

  const handleStoreShip = (shipId: string) => {
    if (engineRef.current) {
      const playerManager = engineRef.current.getPlayerManager();
      const shipStorage = playerManager.getShipStorageManager();
      const ship = playerManager.getOwnedShipsMap().get(shipId);
      const station = engineRef.current.getWorldManager().getCurrentStation();
      
      if (ship && station) {
        const result = shipStorage.storeShip(ship, station.id);
        
        if (result.success) {
          console.log(`Ship stored: ${shipId}, Daily fee: ${result.dailyFee} CR`);
          alert(`Ship stored! Daily storage fee: ${result.dailyFee} CR`);
        } else {
          alert(`Failed to store ship: ${result.error}`);
        }
      }
    }
  };

  const handleRetrieveShip = (shipId: string) => {
    if (engineRef.current) {
      const playerManager = engineRef.current.getPlayerManager();
      const shipStorage = playerManager.getShipStorageManager();
      const station = engineRef.current.getWorldManager().getCurrentStation();
      
      if (station) {
        const result = shipStorage.retrieveShip(shipId, playerManager.getId(), playerManager.getCredits());
        
        if (result.success) {
          setPlayerCredits(playerManager.getCredits());
          console.log(`Ship retrieved: ${shipId}, Fee paid: ${result.totalFees || 0} CR`);
          alert(`Ship retrieved! Storage fees paid: ${result.totalFees || 0} CR`);
        } else {
          alert(`Failed to retrieve ship: ${result.error}`);
        }
      }
    }
  };

  // Contact management handlers
  const handleOpenContacts = () => {
    if (engineRef.current) {
      const worldManager = engineRef.current.getWorldManager();
      const currentStation = worldManager.getCurrentStation();
      
      if (currentStation) {
        const playerManager = engineRef.current.getPlayerManager();
        const contacts = playerManager.getCurrentStationContacts(currentStation.id);
        setStationContacts(contacts);
        setActivePanel('contacts');
      }
    }
  };

  const handleEventChoice = (eventId: string, choiceId: string) => {
    if (engineRef.current) {
      const eventManager = engineRef.current.getEventManager();
      const success = eventManager.makeEventChoice(eventId, choiceId);
      
      if (success) {
        // Refresh active events
        setActiveEvents(eventManager.getActiveEvents());
        console.log(`Event choice made: ${eventId} -> ${choiceId}`);
      } else {
        console.warn(`Failed to make event choice: ${eventId} -> ${choiceId}`);
      }
    }
  };

  const handleDiscoverContacts = (): Contact[] => {
    if (engineRef.current) {
      const worldManager = engineRef.current.getWorldManager();
      const currentStation = worldManager.getCurrentStation();
      
      if (currentStation) {
        const playerManager = engineRef.current.getPlayerManager();
        const discoveredContacts = playerManager.discoverStationContacts(currentStation.id, currentStation.faction);
        setStationContacts(discoveredContacts);
        return discoveredContacts;
      }
    }
    return [];
  };

  const handleNPCLocate = (npc: NPCShip) => {
    if (engineRef.current) {
      // Move camera to NPC's position
      const npcPosition = npc.position.coordinates;
      engineRef.current.moveCameraTo(npcPosition.x, npcPosition.y);
      console.log(`Camera moved to NPC ${npc.name} at position (${npcPosition.x}, ${npcPosition.y})`);
    }
  };

  const handleInteractWithContact = (contactId: string, interactionType: string) => {
    if (engineRef.current) {
      const playerManager = engineRef.current.getPlayerManager();
      const characterManager = engineRef.current.getCharacterManager();
      const progressionSystem = engineRef.current.getCharacterProgressionSystem();
      const factionManager = playerManager.getFactionManager();
      const contactManager = factionManager.getContactManager();
      
      // Get player skills for enhanced interaction
      const character = characterManager.getCharacter();
      const playerSkills = {
        charisma: character?.attributes.charisma || 10,
        reputation: 0 // Could add faction-specific reputation here
      };
      
      // Get the contact to determine faction reputation
      const contact = contactManager.getContact(contactId);
      if (contact) {
        const factionReputation = playerManager.getReputationForFaction(contact.factionId);
        if (factionReputation) {
          playerSkills.reputation = factionReputation.standing;
        }
      }
      
      // Use enhanced interaction system if available
      let result: { outcome: string; trustChange: number; unlocked?: string[] } | boolean;
      if (typeof contactManager.performAdvancedInteraction === 'function') {
        result = contactManager.performAdvancedInteraction(contactId, interactionType as InteractionType, playerSkills);
      } else {
        // Fallback to basic interaction
        result = contactManager.recordInteraction(contactId, interactionType as InteractionType, 'success', 10);
      }
      
      if (result) {
        // Award social experience for successful interactions
        if (typeof result === 'object' && 'outcome' in result && 'trustChange' in result) {
          if (result.outcome === 'success' || result.outcome === 'exceptional') {
            // Award social experience based on trust gained
            progressionSystem.awardSocialExperience('negotiation_success', {
              value: Math.abs(result.trustChange) // Use absolute trust change as experience value
            });
            
            // Award contact experience for first-time meetings (high trust gain might indicate new contact)
            if (result.trustChange >= 15) {
              progressionSystem.awardSocialExperience('contact_made', {
                value: result.trustChange
              });
            }
          }
        }
        
        // Show interaction feedback for advanced interaction results
        if (result && typeof result === 'object' && 'outcome' in result && 'trustChange' in result) {
          const outcomeText = result.outcome === 'exceptional' ? '🌟 Exceptional!' : 
                             result.outcome === 'success' ? '✅ Success!' :
                             result.outcome === 'neutral' ? '➖ Neutral' : '❌ Failed';
          
          console.log(`Interaction result: ${outcomeText} (Trust change: ${result.trustChange > 0 ? '+' : ''}${result.trustChange})`);
          
          // Show unlocked services if any
          if (result.unlocked && result.unlocked.length > 0) {
            console.log(`🔓 Unlocked: ${result.unlocked.join(', ')}`);
          }
        }
        
        // Update the contacts display
        const worldManager = engineRef.current.getWorldManager();
        const currentStation = worldManager.getCurrentStation();
        if (currentStation) {
          const contacts = playerManager.getCurrentStationContacts(currentStation.id);
          setStationContacts(contacts);
        }
        
        // Update reputation display if needed
        setPlayerReputation(playerManager.getPlayerReputation());
      }
    }
  };



  return (
    <div className={`game-canvas-container ${className}`} style={{ width: '100%', height: '100%', position: 'relative' }}>
      {/* Loading state */}
      {isLoading && (
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: '#000',
          color: '#fff',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 10
        }}>
          <div>Loading Game Engine...</div>
          <div style={{ marginTop: '10px', fontSize: '12px', opacity: 0.7 }}>
            Initializing canvas and graphics
          </div>
        </div>
      )}

      {/* Error state */}
      {engineError && (
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: '#1a1a1a',
          color: '#fff',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          padding: '20px',
          textAlign: 'center',
          zIndex: 10
        }}>
          <div style={{ marginBottom: '20px', color: '#ff6b6b' }}>
            ⚠️ Engine Error
          </div>
          <div style={{ marginBottom: '20px', fontSize: '14px' }}>
            {engineError}
          </div>
          <button 
            onClick={retryInitialization}
            style={{
              padding: '10px 20px',
              backgroundColor: '#4a90e2',
              color: 'white',
              border: 'none',
              borderRadius: '5px',
              cursor: 'pointer'
            }}
          >
            Retry
          </button>
        </div>
      )}

      <canvas
        ref={canvasRef}
        style={{
          display: 'block',
          width: '100%',
          height: '100%',
          backgroundColor: '#000',
        }}
      />
      
      {/* UI Controls overlaid on canvas */}
      <div style={{ 
        position: 'absolute', 
        bottom: '10px', 
        left: '50%', 
        transform: 'translateX(-50%)',
        display: 'flex',
        flexWrap: 'wrap',
        justifyContent: 'center',
        gap: '5px',
        maxWidth: '95vw',
        zIndex: 1000,
        background: 'rgba(0, 0, 0, 0.7)',
        borderRadius: '8px',
        padding: '10px'
      }}>
        <button onClick={toggleEngine} disabled={!engineRef.current || !!engineError}>
          {isEngineRunning ? 'Pause' : 'Start'}
        </button>
        <button 
          onClick={() => toggleActivePanelWithTransition('navigation')} 
          disabled={!engineRef.current || !!engineError}
          style={{ 
            backgroundColor: activePanel === 'navigation' ? '#4a90e2' : undefined
          }}
          title="Navigation (N)"
        >
          Nav
        </button>
        <button 
          onClick={() => toggleActivePanelWithTransition('sectors-map')} 
          disabled={!engineRef.current || !!engineError}
          style={{ 
            backgroundColor: activePanel === 'sectors-map' ? '#4a90e2' : undefined
          }}
          title="Sectors Map (S)"
        >
          🗺️ Map
        </button>
        <button 
          onClick={handleOpenMarket} 
          disabled={!engineRef.current || !!engineError}
          style={{ 
            backgroundColor: activePanel === 'market' ? '#4a90e2' : undefined
          }}
          title="Market (M)"
        >
          Market
        </button>
        <button 
          onClick={handleOpenContracts} 
          disabled={!engineRef.current || !!engineError}
          style={{ 
            backgroundColor: activePanel === 'contracts' ? '#4a90e2' : undefined
          }}
          title="Contracts (C)"
        >
          Contracts
        </button>
        <button 
          onClick={handleOpenRouteAnalysis} 
          disabled={!engineRef.current || !!engineError}
          style={{ 
            backgroundColor: activePanel === 'routes' ? '#4a90e2' : undefined
          }}
          title="Routes (R)"
        >
          Routes
        </button>
        <button 
          onClick={() => toggleActivePanelWithTransition('inventory')} 
          disabled={!engineRef.current || !!engineError}
          style={{ 
            backgroundColor: activePanel === 'inventory' ? '#4a90e2' : undefined
          }}
          title="Inventory (I)"
        >
          Inventory
        </button>
        <button 
          onClick={() => toggleActivePanelWithTransition('ship')} 
          disabled={!engineRef.current || !!engineError}
          style={{ 
            backgroundColor: activePanel === 'ship' ? '#4a90e2' : undefined
          }}
          title="Ship (S)"
        >
          Ship
        </button>
        <button 
          onClick={() => toggleActivePanelWithTransition('character')} 
          disabled={!engineRef.current || !!engineError}
          style={{ 
            backgroundColor: activePanel === 'character' ? '#4a90e2' : undefined
          }}
          title="Character (H)"
        >
          Character
        </button>
        <button 
          onClick={handleOpenContacts} 
          disabled={!engineRef.current || !!engineError}
          style={{ 
            backgroundColor: activePanel === 'contacts' ? '#4a90e2' : undefined
          }}
          title="Contacts (P)"
        >
          Contacts
        </button>
        <button 
          onClick={() => toggleActivePanelWithTransition('events')} 
          disabled={!engineRef.current || !!engineError}
          style={{ 
            backgroundColor: activePanel === 'events' ? '#4a90e2' : undefined
          }}
          title="Events (E)"
        >
          Events {activeEvents.length > 0 && `(${activeEvents.length})`}
        </button>
        <button 
          onClick={() => toggleActivePanelWithTransition('quests')} 
          disabled={!engineRef.current || !!engineError}
          style={{ 
            backgroundColor: activePanel === 'quests' ? '#4a90e2' : undefined
          }}
          title="Quests (Q)"
        >
          Quests {(questCounts.active > 0 || questCounts.available > 0) && `(${questCounts.active}/${questCounts.available})`}
        </button>
      </div>

      {/* Navigation Panel */}
      <NavigationPanel
        isVisible={showNavigation}
        onClose={() => setActivePanel(null)}
        onNavigate={handleNavigate}
        targets={getNavigationTargets()}
      />

      {/* Sectors Map Panel */}
      <SectorsMapPanel
        isVisible={showSectorsMap}
        onClose={() => setActivePanel(null)}
        galaxy={engineRef.current?.getWorldManager()?.getGalaxy() || { sectors: [], currentPlayerLocation: { sectorId: '', systemId: '' } }}
        onNavigateToSector={handleNavigateToSector}
      />

      {/* Market Panel */}
      <MarketPanel
        market={currentMarket}
        stationName="Earth Station Alpha"
        isVisible={showMarket}
        onClose={() => setActivePanel(null)}
        onTrade={handleTrade}
        playerCredits={playerCredits}
      />
      {/* Contract Panel */}
      <ContractPanel
        contracts={availableContracts}
        playerContracts={playerContracts}
        isVisible={showContracts}
        onClose={() => setActivePanel(null)}
        onAcceptContract={handleAcceptContract}
        playerCredits={playerCredits}
      />

      {/* Trade Route Panel */}
      <TradeRoutePanel
        routeAnalysis={routeAnalysis}
        isVisible={showRouteAnalysis}
        onClose={() => setActivePanel(null)}
        playerCredits={playerCredits}
        currentStationId={engineRef.current?.getWorldManager().getCurrentStation()?.id}
      />

      {/* Player Inventory Panel */}
      <PlayerInventoryPanel
        isVisible={showInventory}
        onClose={() => setActivePanel(null)}
        cargoItems={cargoItems}
        cargoCapacity={cargoCapacity}
        cargoUsed={cargoUsed}
        playerCredits={playerCredits}
        currentStationName="Earth Station Alpha"
      />

      {/* Fleet Management Panel */}
      <Suspense fallback={<LoadingPanel />}>
        <FleetManagementPanel
          isVisible={showShipManagement}
          onClose={closePanelWithTransition}
          playerCredits={playerCredits}
          currentShipId={currentShipId}
          ownedShips={ownedShips}
          stationId={engineRef.current?.getWorldManager().getCurrentStation()?.id || 'earth-station'}
          stationName={engineRef.current?.getWorldManager().getCurrentStation()?.name || 'Earth Station Alpha'}
          stationType="trade"
          techLevel={1}
          onSwitchShip={handleSwitchShip}
        onPurchaseShip={handlePurchaseShip}
        onConstructHubShip={handleConstructHubShip}
        onStoreShip={handleStoreShip}
        onRetrieveShip={handleRetrieveShip}
      />
      </Suspense>

      {/* Equipment Market Panel */}
      {currentShip && (
        <EquipmentMarketPanel
          isVisible={showEquipmentMarket}
          onClose={() => setShowEquipmentMarket(false)}
          stationId={engineRef.current?.getWorldManager().getCurrentStation()?.id || 'earth-station'}
          stationName={engineRef.current?.getWorldManager().getCurrentStation()?.name || 'Earth Station Alpha'}
          playerCredits={playerCredits}
          currentShip={currentShip}
          onPurchaseEquipment={handlePurchaseEquipment}
        />
      )}

      {/* Faction Reputation Panel */}
      <FactionReputationPanel
        isVisible={showFactionReputation}
        onClose={() => setActivePanel(null)}
        playerReputation={playerReputation}
        factionManager={engineRef.current?.getPlayerManager().getFactionManager()}
      />

      {/* Station Contacts Panel */}
      <StationContactsPanel
        isVisible={showContacts}
        onClose={() => setActivePanel(null)}
        currentStation={engineRef.current?.getWorldManager().getCurrentStation() || null}
        contacts={stationContacts}
        onDiscoverContacts={handleDiscoverContacts}
        onInteractWithContact={handleInteractWithContact}
      />

      {/* Maintenance Panel */}
      {currentShip && engineRef.current && (
        <MaintenancePanel
          isVisible={showMaintenance}
          onClose={() => setActivePanel(null)}
          ship={currentShip}
          playerCredits={playerCredits}
          stationId={engineRef.current.getWorldManager().getCurrentStation()?.id || 'earth-station'}
          maintenanceManager={engineRef.current.getMaintenanceManager()}
          onMaintenancePerformed={handleMaintenancePerformed}
        />
      )}

      {/* Character Sheet Panel */}
      {engineRef.current && showCharacter && (
        <CharacterSheet
          characterManager={engineRef.current.getCharacterManager()}
          skillSpecializationManager={engineRef.current.getSkillSpecializationManager()}
          onClose={() => setActivePanel(null)}
        />
      )}

      {/* Starting Scenario Selection Panel */}
      {showScenarioSelection && (
        <Suspense fallback={<LoadingPanel />}>
          <ScenarioSelectionPanel
            onScenarioSelected={(scenario) => {
              setSelectedScenario(scenario);
              startTransition(() => {
                setShowScenarioSelection(false);
                setShowCharacterCreation(true);
              });
            }}
            onCustomStart={() => {
              setSelectedScenario(null);
              startTransition(() => {
                setShowScenarioSelection(false);
                setShowCharacterCreation(true);
              });
            }}
            onCancel={() => {
              startTransition(() => {
                setShowScenarioSelection(false);
              });
              // Could add logic to return to main menu here
            }}
          />
        </Suspense>
      )}

      {/* Character Creation Panel */}
      {engineRef.current && showCharacterCreation && (
        <Suspense fallback={<LoadingPanel />}>
          <CharacterCreationPanel
            characterManager={engineRef.current.getCharacterManager()}
            onComplete={(success) => {
              startTransition(() => {
                setShowCharacterCreation(false);
                if (success) {
                  setActivePanel('character');
                }
              });
              if (success && selectedScenario) {
                // Apply selected scenario after character creation
                handleScenarioApplication(selectedScenario);
              }
            }}
            onCancel={() => startTransition(() => setShowCharacterCreation(false))}
          />
        </Suspense>
      )}

      {/* Achievements Panel */}
      {engineRef.current && showAchievements && (
        <Suspense fallback={<LoadingPanel />}>
          <AchievementsPanel
            isVisible={showAchievements}
            onClose={closePanelWithTransition}
            achievementManager={engineRef.current.getAchievementManager()}
          />
        </Suspense>
      )}

      {/* Events Panel */}
      {engineRef.current && showEvents && (
        <EventsPanel
          events={activeEvents}
          onEventChoice={handleEventChoice}
          onClose={() => setActivePanel(null)}
        />
      )}

      {/* Security Panel */}
      {engineRef.current && showSecurity && (
        <Suspense fallback={<LoadingPanel />}>
          <SecurityPanel
            securityManager={engineRef.current.getSecurityManager()}
            currentLocation={engineRef.current.getWorldManager().getCurrentSystem()?.id || 'unknown'}
          />
        </Suspense>
      )}

      {/* Hacking Panel */}
      {engineRef.current && showHacking && (
        <Suspense fallback={<LoadingPanel />}>
          <HackingPanel
            hackingManager={engineRef.current.getHackingManager()}
            onClose={closePanelWithTransition}
            onCreditsChange={() => {
              // Update player credits display
              setPlayerCredits(engineRef.current!.getPlayerManager().getCredits());
            }}
          />
        </Suspense>
      )}

      {/* Combat Panel */}
      {engineRef.current && showCombat && (
        <Suspense fallback={<LoadingPanel />}>
          <CombatPanel
            combatManager={engineRef.current.getCombatManager()}
            onClose={closePanelWithTransition}
            onCreditsChange={() => {
              // Update player credits display
              setPlayerCredits(engineRef.current!.getPlayerManager().getCredits());
            }}
          />
        </Suspense>
      )}

      {/* Investment Panel */}
      {engineRef.current && showInvestment && (
        <Suspense fallback={<LoadingPanel />}>
          <InvestmentPanel
            isVisible={showInvestment}
            investmentManager={engineRef.current.getInvestmentManager()}
            playerManager={engineRef.current.getPlayerManager()}
          />
        </Suspense>
      )}



      {/* Quest Panel */}
      {engineRef.current && showQuests && (
        <Suspense fallback={<LoadingPanel />}>
          <QuestPanel
            isVisible={showQuests}
            questManager={engineRef.current.getQuestManager()}
            onClose={closePanelWithTransition}
          />
        </Suspense>
      )}

      {/* NPC Panel */}
      {engineRef.current && (
        <NPCPanel
          npcAIManager={engineRef.current.getNPCAIManager()}
          currentSystemId={engineRef.current.getWorldManager().getGalaxy().currentPlayerLocation.systemId}
          isVisible={showNPCs}
          onToggle={() => setShowNPCs(!showNPCs)}
          onNPCLocate={handleNPCLocate}
        />
      )}
      
      {/* Info Panel - shows information about selected objects */}
      <InfoPanel
        selectedObject={selectedObject}
        isVisible={showInfoPanel}
        onClose={() => {
          setShowInfoPanel(false);
          setSelectedObject(null);
          // Clear selection in the renderer
          const renderer3D = engineRef.current?.getThreeRenderer();
          if (renderer3D) {
            renderer3D.clearSelection();
          }
        }}
      />

    </div>
  );
};

export default GameCanvas;