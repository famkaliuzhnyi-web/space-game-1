import { useState, useEffect } from 'react'
import './App.css'
import GameApp from './GameApp'
import { QRScannerPanel } from './components/ui/QRScannerPanel'
import { MultiplayerManager } from './systems/MultiplayerManager'

function App() {
  const [score, setScore] = useState(0)
  const [showGame, setShowGame] = useState(false)
  const [debugMode, setDebugMode] = useState(false)
  const [debugShipConstructor, setDebugShipConstructor] = useState(false)
  const [showQRScanner, setShowQRScanner] = useState(false)
  const [isJoining, setIsJoining] = useState(false)
  const [joinError, setJoinError] = useState<string | null>(null)
  const [isMultiplayer, setIsMultiplayer] = useState(false)

  // Check URL parameters for auto-join functionality
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const joinCode = urlParams.get('join') || urlParams.get('session');
    
    if (joinCode) {
      console.log('Auto-joining session from URL:', joinCode);
      handleJoinGame(joinCode);
    }
  }, []);

  const handleQRScanResult = async (result: string) => {
    setShowQRScanner(false);
    await handleJoinGame(result);
  };

  const handleJoinGame = async (joinCode: string) => {
    setIsJoining(true);
    setJoinError(null);
    
    try {
      const multiplayerManager = MultiplayerManager.getInstance();
      const playerName = prompt('Enter your player name:') || 'Anonymous Player';
      
      const result = await multiplayerManager.joinSession(joinCode, playerName);
      
      if (result.success) {
        console.log('Successfully joined multiplayer session');
        setIsMultiplayer(true);
        setIsJoining(false);
        setShowGame(true);
      } else {
        setJoinError(result.error || 'Failed to join game');
        setIsJoining(false);
      }
    } catch (error) {
      console.error('Error joining game:', error);
      setJoinError(error instanceof Error ? error.message : 'An unknown error occurred');
      setIsJoining(false);
    }
  };

  if (showGame) {
    return <GameApp 
      debugMode={debugMode} 
      debugShipConstructor={debugShipConstructor}
      isMultiplayer={isMultiplayer}
    />;
  }

  return (
    <div className="space-landing">
      <div>
        <h1 className="space-title">🚀 Space Game</h1>
        <p className="space-subtitle">Welcome to the Space Adventure!</p>
      </div>
      
      <div className="space-actions">
        <button className="space-button primary" onClick={() => { setDebugMode(false); setDebugShipConstructor(false); setIsMultiplayer(false); setShowGame(true); }}>
          🚀 Launch Game
        </button>
        
        <button 
          className="space-button multiplayer" 
          onClick={() => setShowQRScanner(true)}
          disabled={isJoining}
          style={{ 
            backgroundColor: '#4a9eff', 
            border: '2px solid #6bb6ff',
            opacity: isJoining ? 0.6 : 1 
          }}
        >
          {isJoining ? '🔄 Joining...' : '📱 Join Game (QR)'}
        </button>
        
        <button className="space-button debug" onClick={() => { setDebugMode(true); setDebugShipConstructor(false); setShowGame(true); }} 
                style={{ backgroundColor: '#ff6b35', border: '2px solid #ff8c42' }}>
          🔧 Debug Start
        </button>
        <button className="space-button debug" onClick={() => { setDebugMode(false); setDebugShipConstructor(true); setShowGame(true); }} 
                style={{ backgroundColor: '#35a7ff', border: '2px solid #42a7ff' }}>
          🛠️ Debug Ship Constructor
        </button>
        <button className="space-button secondary" onClick={() => setScore((score) => score + 10)}>
          Collect Star ⭐ (Score: {score})
        </button>
      </div>

      {joinError && (
        <div style={{
          backgroundColor: '#ff4444',
          color: 'white',
          padding: '12px',
          borderRadius: '6px',
          margin: '16px 0',
          maxWidth: '500px',
          marginLeft: 'auto',
          marginRight: 'auto'
        }}>
          <strong>❌ Connection Failed:</strong> {joinError}
          <button 
            onClick={() => setJoinError(null)}
            style={{
              background: 'none',
              border: 'none',
              color: 'white',
              float: 'right',
              cursor: 'pointer',
              fontSize: '16px'
            }}
          >
            ✕
          </button>
        </div>
      )}

      <p className="space-description">
        A pure browser React + TypeScript space game with 2D canvas engine.
        Embark on an epic journey through the galaxy, trade with alien civilizations,
        and build your space empire. <strong>Now with multiplayer support!</strong>
      </p>

      <p className="space-debug-info" style={{ fontSize: '12px', color: '#888', marginTop: '10px' }}>
        🚀 Launch Game: Start single-player adventure<br/>
        📱 Join Game: Scan QR code to join multiplayer session<br/>
        🔧 Debug Start: Skip character creation with maximum resources for testing<br/>
        🛠️ Debug Ship Constructor: Load directly into ship construction interface
      </p>
      
      <p className="space-footer">
        Built with React, TypeScript, and Vite
      </p>
      
      <QRScannerPanel
        isOpen={showQRScanner}
        onScanResult={handleQRScanResult}
        onClose={() => setShowQRScanner(false)}
      />
    </div>
  )
}

export default App
