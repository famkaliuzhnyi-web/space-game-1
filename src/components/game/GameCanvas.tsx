import React, { useRef, useEffect, useState } from 'react';
import { Engine } from '../../engine';
import { NavigationPanel, MarketPanel, ContractPanel, TradeRoutePanel, EquipmentMarketPanel, FleetManagementPanel, FactionReputationPanel, CharacterSheet, CharacterCreationPanel, AchievementsPanel, EventsPanel } from '../ui';
import MaintenancePanel from '../ui/MaintenancePanel';
import PlayerInventoryPanel from '../ui/PlayerInventoryPanel';
import StationContactsPanel from '../ui/StationContactsPanel';
import { Market, TradeContract, RouteAnalysis } from '../../types/economy';
import { CargoItem, Ship, EquipmentItem, FactionReputation } from '../../types/player';
import { ShipConstructionConfig } from '../../systems/ShipConstructionSystem';
import { ShipHubDesign } from '../../types/shipHubs';
import { HubShipConstructionSystem } from '../../systems/HubShipConstructionSystem';
import { Contact } from '../../types/contacts';

interface GameCanvasProps {
  width?: number;
  height?: number;
  className?: string;
}

const GameCanvas: React.FC<GameCanvasProps> = ({ 
  width = 800, 
  height = 600, 
  className = '' 
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<Engine | null>(null);
  const [isEngineRunning, setIsEngineRunning] = useState(false);
  const [engineError, setEngineError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activePanel, setActivePanel] = useState<'navigation' | 'market' | 'contracts' | 'routes' | 'inventory' | 'ship' | 'factions' | 'maintenance' | 'character' | 'contacts' | 'achievements' | 'events' | null>(null);
  const [showEquipmentMarket, setShowEquipmentMarket] = useState(false);
  const [showCharacterCreation, setShowCharacterCreation] = useState(false);
  const [stationContacts, setStationContacts] = useState<Contact[]>([]);
  
  // Computed panel visibility states for backward compatibility
  const showNavigation = activePanel === 'navigation';
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
  const [activeEvents, setActiveEvents] = useState<any[]>([]);

  useEffect(() => {
    if (!canvasRef.current) return;

    const initializeEngine = async () => {
      try {
        setIsLoading(true);
        setEngineError(null);

        // Add a small delay to ensure canvas is properly mounted
        await new Promise(resolve => setTimeout(resolve, 100));

        if (!canvasRef.current) {
          throw new Error('Canvas element not available');
        }

        // Check if canvas context is available
        const testContext = canvasRef.current.getContext('2d');
        if (!testContext) {
          throw new Error('Failed to get 2D context - your device may not support canvas rendering');
        }

        // Initialize the game engine
        engineRef.current = new Engine(canvasRef.current);
        
        // Start the engine
        engineRef.current.start();
        setIsEngineRunning(true);
        setIsLoading(false);
        
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

        // Set up periodic sync for events (every 5 seconds)
        const eventSyncInterval = setInterval(() => {
          if (engineRef.current) {
            const eventManager = engineRef.current.getEventManager();
            setActiveEvents(eventManager.getActiveEvents());
          }
        }, 5000);

        // Store interval ID for cleanup
        (window as any).eventSyncInterval = eventSyncInterval;

        // Check if character exists, prompt for creation if needed
        const characterManager = engineRef.current.getCharacterManager();
        const existingCharacter = characterManager.getCharacter();
        if (!existingCharacter) {
          setShowCharacterCreation(true);
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
          
          // Maintain aspect ratio
          const aspectRatio = width / height;
          let newWidth = containerWidth;
          let newHeight = containerWidth / aspectRatio;
          
          if (newHeight > containerHeight) {
            newHeight = containerHeight;
            newWidth = containerHeight * aspectRatio;
          }
          
          engineRef.current.resizeCanvas(newWidth, newHeight);
        }
      }
    };
    
    // Listen for window resize
    window.addEventListener('resize', handleResize);

    // Listen for ESC key to close active panel
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.code === 'Escape') {
        setActivePanel(null);
      } else if (event.code === 'KeyN') {
        setActivePanel(activePanel === 'navigation' ? null : 'navigation');
      } else if (event.code === 'KeyS') {
        setActivePanel(activePanel === 'ship' ? null : 'ship');
      } else if (event.code === 'KeyF') {
        setActivePanel(activePanel === 'factions' ? null : 'factions');
      } else if (event.code === 'KeyP') {
        handleOpenContacts();
      } else if (event.code === 'KeyE') {
        setActivePanel(activePanel === 'events' ? null : 'events');
      }
    };
    window.addEventListener('keydown', handleKeyDown);

    // Cleanup
    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('keydown', handleKeyDown);
      
      // Clear event sync interval
      if ((window as any).eventSyncInterval) {
        clearInterval((window as any).eventSyncInterval);
        delete (window as any).eventSyncInterval;
      }
      
      if (engineRef.current) {
        engineRef.current.dispose();
        setIsEngineRunning(false);
      }
    };
  }, [width, height]);

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

  const handleOpenMaintenance = () => {
    if (engineRef.current && currentShip) {
      setActivePanel('maintenance');
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
      const worldManager = engineRef.current.getWorldManager();
      const progressionSystem = engineRef.current.getCharacterProgressionSystem();
      
      // Track previous location for first-visit detection
      const previousLocation = worldManager.getCurrentSystem();
      
      // Navigate to target
      worldManager.navigateToTarget(targetId);
      
      // Award exploration experience for visiting new systems
      const currentLocation = worldManager.getCurrentSystem();
      if (currentLocation && currentLocation.id !== previousLocation?.id) {
        // Award system visit experience
        progressionSystem.awardExplorationExperience('system_visit', {
          riskLevel: currentLocation.securityLevel ? (10 - currentLocation.securityLevel) / 2 : 1 // Lower security = higher risk = more XP
        });
        
        // If this is a station, award additional discovery experience
        const currentStation = worldManager.getCurrentStation();
        if (currentStation) {
          progressionSystem.awardExplorationExperience('station_discovery', {
            riskLevel: currentLocation.securityLevel ? (10 - currentLocation.securityLevel) / 2 : 1
          });
        }
      }
    }
  };

  const getNavigationTargets = () => {
    if (engineRef.current) {
      return engineRef.current.getWorldManager().getAvailableTargets();
    }
    return [];
  };

  const handlePurchaseEquipment = (equipment: EquipmentItem, cost: number) => {
    if (engineRef.current) {
      const playerManager = engineRef.current.getPlayerManager();
      
      // Deduct credits
      if (playerManager.getCredits() >= cost) {
        playerManager.spendCredits(cost);
        
        // Add equipment to player's inventory (for now, we'll store it separately)
        // TODO: Implement proper equipment inventory system
        
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

  const handleConstructShip = (config: ShipConstructionConfig) => {
    if (engineRef.current) {
      const playerManager = engineRef.current.getPlayerManager();
      const constructionSystem = new (require('../../systems/ShipConstructionSystem').ShipConstructionSystem)();
      
      try {
        const cost = constructionSystem.calculateConstructionCost(config);
        
        if (playerManager.getCredits() >= cost.totalCredits) {
          const station = engineRef.current.getWorldManager().getCurrentStation();
          if (station) {
            const newShip = constructionSystem.constructShip(config, station.id);
            
            // Add ship to player's fleet
            playerManager.getOwnedShipsMap().set(newShip.id, newShip);
            
            // Deduct credits
            playerManager.spendCredits(cost.totalCredits);
            
            // Update UI
            setPlayerCredits(playerManager.getCredits());
            setOwnedShips(playerManager.getOwnedShips());
            
            console.log(`Constructed ship: ${config.shipName}`);
            alert(`Successfully constructed ${config.shipName}!`);
          } else {
            alert('No station available for construction');
          }
        } else {
          alert('Insufficient credits for construction');
        }
      } catch (error) {
        console.error('Construction failed:', error);
        alert(`Construction failed: ${error}`);
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
      let result: any;
      if (typeof contactManager.performAdvancedInteraction === 'function') {
        result = contactManager.performAdvancedInteraction(contactId, interactionType as any, playerSkills);
      } else {
        // Fallback to basic interaction
        result = contactManager.recordInteraction(contactId, interactionType as any, 'success', 10);
      }
      
      if (result) {
        // Award social experience for successful interactions
        if (result && typeof result === 'object' && 'outcome' in result && 'trustChange' in result) {
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
        width={width}
        height={height}
        style={{
          display: 'block',
          maxWidth: '100%',
          maxHeight: '100%',
          backgroundColor: '#000',
          margin: '0 auto',
        }}
      />
      
      <div style={{ marginTop: '10px', textAlign: 'center' }}>
        <button onClick={toggleEngine} disabled={!engineRef.current || !!engineError}>
          {isEngineRunning ? 'Pause Engine' : 'Start Engine'}
        </button>
        <button 
          onClick={() => setActivePanel(activePanel === 'navigation' ? null : 'navigation')} 
          disabled={!engineRef.current || !!engineError}
          style={{ 
            marginLeft: '10px',
            backgroundColor: activePanel === 'navigation' ? '#4a90e2' : undefined
          }}
        >
          Navigation (N)
        </button>
        <button 
          onClick={handleOpenMarket} 
          disabled={!engineRef.current || !!engineError}
          style={{ 
            marginLeft: '10px',
            backgroundColor: activePanel === 'market' ? '#4a90e2' : undefined
          }}
        >
          Market (M)
        </button>
        <button 
          onClick={handleOpenContracts} 
          disabled={!engineRef.current || !!engineError}
          style={{ 
            marginLeft: '10px',
            backgroundColor: activePanel === 'contracts' ? '#4a90e2' : undefined
          }}
        >
          Contracts (C)
        </button>
        <button 
          onClick={handleOpenRouteAnalysis} 
          disabled={!engineRef.current || !!engineError}
          style={{ 
            marginLeft: '10px',
            backgroundColor: activePanel === 'routes' ? '#4a90e2' : undefined
          }}
        >
          Routes (R)
        </button>
        <button 
          onClick={() => setActivePanel(activePanel === 'inventory' ? null : 'inventory')} 
          disabled={!engineRef.current || !!engineError}
          style={{ 
            marginLeft: '10px',
            backgroundColor: activePanel === 'inventory' ? '#4a90e2' : undefined
          }}
        >
          Inventory (I)
        </button>
        <button 
          onClick={() => setActivePanel(activePanel === 'ship' ? null : 'ship')} 
          disabled={!engineRef.current || !!engineError}
          style={{ 
            marginLeft: '10px',
            backgroundColor: activePanel === 'ship' ? '#4a90e2' : undefined
          }}
        >
          Ship (S)
        </button>
        <button 
          onClick={() => setActivePanel(activePanel === 'factions' ? null : 'factions')} 
          disabled={!engineRef.current || !!engineError}
          style={{ 
            marginLeft: '10px',
            backgroundColor: activePanel === 'factions' ? '#4a90e2' : undefined
          }}
        >
          Factions (F)
        </button>
        <button 
          onClick={() => setActivePanel(activePanel === 'character' ? null : 'character')} 
          disabled={!engineRef.current || !!engineError}
          style={{ 
            marginLeft: '10px',
            backgroundColor: activePanel === 'character' ? '#4a90e2' : undefined
          }}
        >
          Character (H)
        </button>
        <button 
          onClick={handleOpenContacts} 
          disabled={!engineRef.current || !!engineError}
          style={{ 
            marginLeft: '10px',
            backgroundColor: activePanel === 'contacts' ? '#4a90e2' : undefined
          }}
        >
          Contacts (P)
        </button>
        <button 
          onClick={() => setActivePanel(activePanel === 'achievements' ? null : 'achievements')} 
          disabled={!engineRef.current || !!engineError}
          style={{ 
            marginLeft: '10px',
            backgroundColor: activePanel === 'achievements' ? '#4a90e2' : undefined
          }}
        >
          Achievements (A)
        </button>
        <button 
          onClick={() => setActivePanel(activePanel === 'events' ? null : 'events')} 
          disabled={!engineRef.current || !!engineError}
          style={{ 
            marginLeft: '10px',
            backgroundColor: activePanel === 'events' ? '#4a90e2' : undefined
          }}
        >
          Events (E) {activeEvents.length > 0 && `(${activeEvents.length})`}
        </button>
        <button 
          onClick={handleOpenMaintenance} 
          disabled={!engineRef.current || !!engineError || !currentShip}
          style={{ 
            marginLeft: '10px',
            backgroundColor: activePanel === 'maintenance' ? '#4a90e2' : undefined
          }}
        >
          Maintenance (X)
        </button>
        {/* Temporary test button for ship damage */}
        <button 
          onClick={() => {
            if (engineRef.current) {
              engineRef.current.getPlayerManager().simulateShipDamage();
              setCurrentShip(engineRef.current.getPlayerManager().getShip());
            }
          }}
          disabled={!engineRef.current || !!engineError}
          style={{ 
            marginLeft: '10px',
            backgroundColor: '#dc2626',
            color: 'white',
            fontSize: '12px'
          }}
        >
          🔥 Damage Ship (Test)
        </button>
      </div>

      {/* Navigation Panel */}
      <NavigationPanel
        isVisible={showNavigation}
        onClose={() => setActivePanel(null)}
        onNavigate={handleNavigate}
        targets={getNavigationTargets()}
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
      <FleetManagementPanel
        isVisible={showShipManagement}
        onClose={() => setActivePanel(null)}
        playerCredits={playerCredits}
        currentShipId={currentShipId}
        ownedShips={ownedShips}
        stationId={engineRef.current?.getWorldManager().getCurrentStation()?.id || 'earth-station'}
        stationName={engineRef.current?.getWorldManager().getCurrentStation()?.name || 'Earth Station Alpha'}
        stationType="trade"
        techLevel={1}
        onSwitchShip={handleSwitchShip}
        onPurchaseShip={handlePurchaseShip}
        onConstructShip={handleConstructShip}
        onConstructHubShip={handleConstructHubShip}
        onStoreShip={handleStoreShip}
        onRetrieveShip={handleRetrieveShip}
      />

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

      {/* Character Creation Panel */}
      {engineRef.current && showCharacterCreation && (
        <CharacterCreationPanel
          characterManager={engineRef.current.getCharacterManager()}
          onComplete={(success) => {
            setShowCharacterCreation(false);
            if (success) {
              setActivePanel('character');
            }
          }}
          onCancel={() => setShowCharacterCreation(false)}
        />
      )}

      {/* Achievements Panel */}
      {engineRef.current && showAchievements && (
        <AchievementsPanel
          isVisible={showAchievements}
          onClose={() => setActivePanel(null)}
          achievementManager={engineRef.current.getAchievementManager()}
        />
      )}

      {/* Events Panel */}
      {engineRef.current && showEvents && (
        <EventsPanel
          events={activeEvents}
          onEventChoice={handleEventChoice}
          onClose={() => setActivePanel(null)}
        />
      )}
    </div>
  );
};

export default GameCanvas;