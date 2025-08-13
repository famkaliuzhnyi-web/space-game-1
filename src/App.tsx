import { useState } from 'react'
import './App.css'
import GameApp from './GameApp'
import { MultiplayerLobby } from './components/game'

function App() {
  const [score, setScore] = useState(0)
  const [showGame, setShowGame] = useState(false)
  const [showMultiplayer, setShowMultiplayer] = useState(false)
  const [debugMode, setDebugMode] = useState(false)
  const [debugShipConstructor, setDebugShipConstructor] = useState(false)

  if (showMultiplayer) {
    return <MultiplayerLobby onBackToMenu={() => setShowMultiplayer(false)} />;
  }

  if (showGame) {
    return <GameApp debugMode={debugMode} debugShipConstructor={debugShipConstructor} />;
  }

  return (
    <div className="space-landing">
      <div>
        <h1 className="space-title">🚀 Space Game</h1>
        <p className="space-subtitle">Welcome to the Space Adventure!</p>
      </div>
      
      <div className="space-actions">
        <button className="space-button primary" onClick={() => { setDebugMode(false); setDebugShipConstructor(false); setShowGame(true); }}>
          🚀 Launch Game
        </button>
        <button className="space-button multiplayer" onClick={() => setShowMultiplayer(true)}
                style={{ backgroundColor: '#ff6b35', border: '2px solid #ff8c42' }}>
          🌐 Multiplayer Mode
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

      <p className="space-description">
        A pure browser React + TypeScript space game with 2D canvas engine.
        Embark on an epic journey through the galaxy, trade with alien civilizations,
        and build your space empire.
      </p>

      <p className="space-multiplayer-info" style={{ fontSize: '14px', color: '#4fc3f7', marginTop: '10px' }}>
        🌐 New: Play multiplayer tic-tac-toe with up to 3 players using WebRTC!<br/>
        Host shows QR code, others scan to join. No servers required!
      </p>

      <p className="space-debug-info" style={{ fontSize: '12px', color: '#888', marginTop: '10px' }}>
        🔧 Debug Start: Skip character creation with maximum resources for testing<br/>
        🛠️ Debug Ship Constructor: Load directly into ship construction interface
      </p>
      
      <p className="space-footer">
        Built with React, TypeScript, and Vite
      </p>
    </div>
  )
}

export default App
