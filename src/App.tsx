import { useState } from 'react'
import './App.css'

/**
 * Main Space Game Application Component
 * 
 * A simple mobile-friendly space adventure game built with React and TypeScript.
 * Features star collection gameplay with real-time scoring.
 * 
 * @returns JSX.Element The main game interface
 */
function App() {
  // Game state: Current player score
  const [score, setScore] = useState(0)

  /**
   * Handle star collection click/tap
   * Increases score by 10 points per interaction
   */
  const handleStarClick = () => setScore((score) => score + 10)

  return (
    <>
      {/* Game Header */}
      <div>
        <h1>🚀 Space Game</h1>
        <p>Welcome to the Space Adventure!</p>
      </div>
      
      {/* Main Game Content */}
      <div className="card">
        <button 
          onClick={handleStarClick}
          className="star-button"
          aria-label={`Collect star to increase score. Current score: ${score}`}
        >
          Collect Star ⭐ (Score: {score})
        </button>
        <p>
          A pure browser React + TypeScript space game
        </p>
      </div>
      
      {/* Game Footer */}
      <p className="read-the-docs">
        Built with React, TypeScript, and Vite
      </p>
    </>
  )
}

export default App
