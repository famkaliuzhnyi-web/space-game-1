import React, { useRef, useEffect, useState } from 'react';
import { Engine } from '../../engine';
import { NavigationPanel, MarketPanel, ContractPanel, TradeRoutePanel } from '../ui';
import PlayerInventoryPanel from '../ui/PlayerInventoryPanel';
import { Market, TradeContract, RouteAnalysis } from '../../types/economy';
import { CargoItem } from '../../types/player';

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
  const [activePanel, setActivePanel] = useState<'navigation' | 'market' | 'contracts' | 'routes' | 'inventory' | null>(null);
  
  // Computed panel visibility states for backward compatibility
  const showNavigation = activePanel === 'navigation';
  const showMarket = activePanel === 'market';
  const showContracts = activePanel === 'contracts';
  const showRouteAnalysis = activePanel === 'routes';
  const showInventory = activePanel === 'inventory';
  const [currentMarket, setCurrentMarket] = useState<Market | null>(null);
  const [availableContracts, setAvailableContracts] = useState<TradeContract[]>([]);
  const [playerContracts, setPlayerContracts] = useState<TradeContract[]>([]);
  const [routeAnalysis, setRouteAnalysis] = useState<RouteAnalysis | null>(null);
  const [playerCredits, setPlayerCredits] = useState(10000);
  const [cargoItems, setCargoItems] = useState<CargoItem[]>([]);
  const [cargoUsed, setCargoUsed] = useState(0);
  const [cargoCapacity, setCargoCapacity] = useState(100);

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
      }
    };
    window.addEventListener('keydown', handleKeyDown);

    // Cleanup
    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('keydown', handleKeyDown);
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
      
      // Use the new integrated trading method
      const result = economicSystem.executeTradeWithPlayer(
        currentMarket.stationId, 
        commodityId, 
        quantity, 
        isBuying,
        playerManager
      );
      
      if (result.success) {
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
      engineRef.current.getWorldManager().navigateToTarget(targetId);
    }
  };

  const getNavigationTargets = () => {
    if (engineRef.current) {
      return engineRef.current.getWorldManager().getAvailableTargets();
    }
    return [];
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
    </div>
  );
};

export default GameCanvas;