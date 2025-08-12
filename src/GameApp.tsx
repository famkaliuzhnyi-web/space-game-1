import React from 'react';
import { GameCanvas } from './components/game';

interface GameAppProps {
  debugMode?: boolean;
  debugShipConstructor?: boolean;
}

const GameApp: React.FC<GameAppProps> = ({ debugMode = false, debugShipConstructor = false }) => {
  return (
    <div style={{ 
      width: '100vw', 
      height: '100vh', 
      overflow: 'hidden', // Prevent scrolling
      position: 'relative'
    }}>
      <GameCanvas className="full-screen-canvas" debugMode={debugMode} debugShipConstructor={debugShipConstructor} />
    </div>
  );
};

export default GameApp;