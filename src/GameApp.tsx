import React from 'react';
import { GameCanvas } from './components/game';

const GameApp: React.FC = () => {
  return (
    <div style={{ 
      width: '100%', 
      height: '100vh', 
      display: 'flex', 
      flexDirection: 'column',
      overflow: 'hidden' // Prevent scrolling on mobile
    }}>
      <header style={{ 
        textAlign: 'center', 
        padding: '10px',
        flexShrink: 0 // Prevent header from shrinking
      }}>
        <h1 style={{ margin: '0 0 5px 0', fontSize: 'clamp(1.5rem, 4vw, 2.5rem)' }}>
          🚀 Space Game
        </h1>
        <p style={{ margin: '0', fontSize: 'clamp(0.8rem, 2.5vw, 1rem)' }}>
          Welcome to the Space Adventure!
        </p>
      </header>
      
      <main style={{ 
        flex: 1, 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center',
        padding: '10px',
        minHeight: 0 // Allow main to shrink below content size
      }}>
        <div style={{ 
          width: '100%', 
          height: '100%', 
          maxWidth: '800px', 
          maxHeight: '600px',
          aspectRatio: '4/3' // Maintain aspect ratio
        }}>
          <GameCanvas width={800} height={600} />
        </div>
      </main>
      
      <footer style={{ 
        textAlign: 'center', 
        padding: '10px',
        fontSize: 'clamp(0.7rem, 2vw, 0.9rem)',
        flexShrink: 0 // Prevent footer from shrinking
      }}>
        <p style={{ margin: '0' }}>Built with React, TypeScript, and Vite</p>
      </footer>
    </div>
  );
};

export default GameApp;