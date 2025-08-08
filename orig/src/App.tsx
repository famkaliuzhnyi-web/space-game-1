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
    <>
      <div>
        <h1>🚀 Space Game</h1>
        <p>Welcome to the Space Adventure!</p>
      </div>
      
      <div className="card">
        <button onClick={() => setShowGame(true)}>
          🚀 Launch Game
        </button>
        <button onClick={() => setScore((score) => score + 10)}>
          Collect Star ⭐ (Score: {score})
        </button>
        <p>
          A pure browser React + TypeScript space game with 2D canvas engine
        </p>
      </div>
      <p className="read-the-docs">
        Built with React, TypeScript, and Vite
      </p>
    </>
  )
}

export default App
