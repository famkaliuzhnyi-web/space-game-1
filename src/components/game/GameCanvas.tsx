import React, { useRef, useEffect, useState } from 'react';
import { Engine } from '../../engine';

interface GameCanvasProps {
  width?: number;
  height?: number;
  className?: string;
}

const GameCanvas: React.FC<GameCanvasProps> = ({ 
  width = 800, 
  height = 600, 
  className = '' 
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<Engine | null>(null);
  const [isEngineRunning, setIsEngineRunning] = useState(false);

  useEffect(() => {
    if (!canvasRef.current) return;

    // Initialize the game engine
    engineRef.current = new Engine(canvasRef.current);
    
    // Start the engine
    engineRef.current.start();
    setIsEngineRunning(true);

    // Handle canvas resize
    const handleResize = () => {
      if (engineRef.current && canvasRef.current) {
        const container = canvasRef.current.parentElement;
        if (container) {
          const containerWidth = container.clientWidth;
          const containerHeight = container.clientHeight;
          
          // Maintain aspect ratio
          const aspectRatio = width / height;
          let newWidth = containerWidth;
          let newHeight = containerWidth / aspectRatio;
          
          if (newHeight > containerHeight) {
            newHeight = containerHeight;
            newWidth = containerHeight * aspectRatio;
          }
          
          engineRef.current.resizeCanvas(newWidth, newHeight);
        }
      }
    };

    // Set initial size
    engineRef.current.resizeCanvas(width, height);
    
    // Listen for window resize
    window.addEventListener('resize', handleResize);

    // Cleanup
    return () => {
      window.removeEventListener('resize', handleResize);
      if (engineRef.current) {
        engineRef.current.dispose();
        setIsEngineRunning(false);
      }
    };
  }, [width, height]);

  const toggleEngine = () => {
    if (!engineRef.current) return;
    
    if (isEngineRunning) {
      engineRef.current.stop();
      setIsEngineRunning(false);
    } else {
      engineRef.current.start();
      setIsEngineRunning(true);
    }
  };

  return (
    <div className={`game-canvas-container ${className}`} style={{ width: '100%', height: '100%' }}>
      <canvas
        ref={canvasRef}
        width={width}
        height={height}
        style={{
          display: 'block',
          maxWidth: '100%',
          maxHeight: '100%',
          backgroundColor: '#000',
        }}
      />
      <div style={{ marginTop: '10px', textAlign: 'center' }}>
        <button onClick={toggleEngine}>
          {isEngineRunning ? 'Pause Engine' : 'Start Engine'}
        </button>
      </div>
    </div>
  );
};

export default GameCanvas;