import React from 'react';
import { GameCanvas } from './components/game';

const GameApp: React.FC = () => {
  return (
    <div style={{ width: '100%', height: '100vh', display: 'flex', flexDirection: 'column' }}>
      <header style={{ textAlign: 'center', padding: '20px' }}>
        <h1>🚀 Space Game</h1>
        <p>Welcome to the Space Adventure!</p>
      </header>
      
      <main style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        <div style={{ width: '800px', height: '600px', maxWidth: '100%', maxHeight: '100%' }}>
          <GameCanvas width={800} height={600} />
        </div>
      </main>
      
      <footer style={{ textAlign: 'center', padding: '20px' }}>
        <p>Built with React, TypeScript, and Vite</p>
      </footer>
    </div>
  );
};

export default GameApp;