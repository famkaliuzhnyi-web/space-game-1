import { useState } from 'react'
import './App.css'

function App() {
  const [score, setScore] = useState(0)

  return (
    <>
      <div>
        <h1>🚀 Space Game</h1>
        <p>Welcome to the Space Adventure!</p>
      </div>
      <div className="card">
        <button onClick={() => setScore((score) => score + 10)}>
          Collect Star ⭐ (Score: {score})
        </button>
        <p>
          A pure browser React + TypeScript space game
        </p>
      </div>
      <p className="read-the-docs">
        Built with React, TypeScript, and Vite
      </p>
    </>
  )
}

export default App
