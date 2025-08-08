import React from 'react';
import { GameCanvas } from './components/game';

const GameApp: React.FC = () => {
  return (
    <div style={{ 
      width: '100vw', 
      height: '100vh', 
      overflow: 'hidden', // Prevent scrolling
      position: 'relative'
    }}>
      <GameCanvas className="full-screen-canvas" />
    </div>
  );
};

export default GameApp;