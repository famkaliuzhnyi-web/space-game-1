import React from 'react';
import { GameCanvas } from './components/game';

interface GameAppProps {
  debugMode?: boolean;
}

const GameApp: React.FC<GameAppProps> = ({ debugMode = false }) => {
  return (
    <div style={{ 
      width: '100vw', 
      height: '100vh', 
      overflow: 'hidden', // Prevent scrolling
      position: 'relative'
    }}>
      <GameCanvas className="full-screen-canvas" debugMode={debugMode} />
    </div>
  );
};

export default GameApp;