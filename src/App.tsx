import { useState } from 'react'
import './App.css'
import GameApp from './GameApp'

function App() {
  const [score, setScore] = useState(0)
  const [showGame, setShowGame] = useState(false)

  if (showGame) {
    return <GameApp />;
  }

  return (
    <div className="space-landing">
      <div>
        <h1 className="space-title">🚀 Space Game</h1>
        <p className="space-subtitle">Welcome to the Space Adventure!</p>
      </div>
      
      <div className="space-actions">
        <button className="space-button primary" onClick={() => setShowGame(true)}>
          🚀 Launch Game
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
      
      <p className="space-footer">
        Built with React, TypeScript, and Vite
      </p>
    </div>
  )
}

export default App
