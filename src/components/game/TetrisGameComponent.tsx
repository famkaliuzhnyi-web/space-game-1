import React, { useEffect, useRef, useState, useCallback } from 'react';
import { TetrisGame } from '../../systems/TetrisGame';
import { TetrisGameState, TETRIS_BLOCK_SIZE } from '../../types/tetris';

interface TetrisGameComponentProps {
  onScoreChange?: (score: number) => void;
  onGameOver?: (finalScore: number) => void;
}

const TetrisGameComponent: React.FC<TetrisGameComponentProps> = ({
  onScoreChange,
  onGameOver
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const gameRef = useRef<TetrisGame | null>(null);
  const [gameState, setGameState] = useState<TetrisGameState | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  // Initialize game
  useEffect(() => {
    gameRef.current = new TetrisGame();
    const state = gameRef.current.getState();
    setGameState(state);
  }, []);

  // Render game to canvas
  const renderGame = useCallback(() => {
    if (!canvasRef.current || !gameRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const state = gameRef.current.getState();
    setGameState(state);

    // Clear canvas
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw border
    ctx.strokeStyle = '#333333';
    ctx.lineWidth = 2;
    ctx.strokeRect(0, 0, canvas.width, canvas.height);

    // Draw placed blocks
    for (let y = 0; y < state.board.height; y++) {
      for (let x = 0; x < state.board.width; x++) {
        const color = state.board.grid[y][x];
        if (color) {
          drawBlock(ctx, x, y, color);
        }
      }
    }

    // Draw current piece
    if (state.currentPiece) {
      const blocks = state.currentPiece.shape.rotations[state.currentPiece.rotation];
      for (const block of blocks) {
        const x = block.x + state.currentPiece.position.x;
        const y = block.y + state.currentPiece.position.y;
        if (y >= 0) {
          drawBlock(ctx, x, y, state.currentPiece.shape.color);
        }
      }
    }

    // Draw grid lines (optional, subtle)
    ctx.strokeStyle = '#111111';
    ctx.lineWidth = 1;
    for (let x = 0; x <= state.board.width; x++) {
      ctx.beginPath();
      ctx.moveTo(x * TETRIS_BLOCK_SIZE, 0);
      ctx.lineTo(x * TETRIS_BLOCK_SIZE, canvas.height);
      ctx.stroke();
    }
    for (let y = 0; y <= state.board.height; y++) {
      ctx.beginPath();
      ctx.moveTo(0, y * TETRIS_BLOCK_SIZE);
      ctx.lineTo(canvas.width, y * TETRIS_BLOCK_SIZE);
      ctx.stroke();
    }

    // Trigger callbacks
    if (onScoreChange) {
      onScoreChange(state.score);
    }
    if (state.isGameOver && onGameOver && isPlaying) {
      onGameOver(state.score);
      setIsPlaying(false);
    }
  }, [onScoreChange, onGameOver, isPlaying]);

  const drawBlock = (ctx: CanvasRenderingContext2D, x: number, y: number, color: string) => {
    const pixelX = x * TETRIS_BLOCK_SIZE;
    const pixelY = y * TETRIS_BLOCK_SIZE;

    // Fill block
    ctx.fillStyle = color;
    ctx.fillRect(pixelX, pixelY, TETRIS_BLOCK_SIZE, TETRIS_BLOCK_SIZE);

    // Add 3D effect
    ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.fillRect(pixelX, pixelY, TETRIS_BLOCK_SIZE - 1, 2);
    ctx.fillRect(pixelX, pixelY, 2, TETRIS_BLOCK_SIZE - 1);

    ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
    ctx.fillRect(pixelX + TETRIS_BLOCK_SIZE - 2, pixelY, 2, TETRIS_BLOCK_SIZE);
    ctx.fillRect(pixelX, pixelY + TETRIS_BLOCK_SIZE - 2, TETRIS_BLOCK_SIZE, 2);

    // Border
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.8)';
    ctx.lineWidth = 1;
    ctx.strokeRect(pixelX, pixelY, TETRIS_BLOCK_SIZE, TETRIS_BLOCK_SIZE);
  };

  // Handle keyboard input
  const handleKeyPress = useCallback((event: KeyboardEvent) => {
    if (!gameRef.current || !isPlaying) return;

    switch (event.key) {
      case 'ArrowLeft':
        event.preventDefault();
        gameRef.current.moveLeft();
        break;
      case 'ArrowRight':
        event.preventDefault();
        gameRef.current.moveRight();
        break;
      case 'ArrowDown':
        event.preventDefault();
        gameRef.current.moveDown();
        break;
      case 'ArrowUp':
        event.preventDefault();
        gameRef.current.rotate();
        break;
      case ' ':
        event.preventDefault();
        gameRef.current.hardDrop();
        break;
      case 'p':
      case 'P':
        gameRef.current.pause();
        break;
    }
  }, [isPlaying]);

  // Keyboard event listeners
  useEffect(() => {
    document.addEventListener('keydown', handleKeyPress);
    return () => {
      document.removeEventListener('keydown', handleKeyPress);
    };
  }, [handleKeyPress]);

  // Game loop
  useEffect(() => {
    if (!gameRef.current) return;

    if (isPlaying) {
      gameRef.current.startGameLoop(renderGame);
    } else {
      gameRef.current.stopGameLoop();
    }

    return () => {
      gameRef.current?.stopGameLoop();
    };
  }, [isPlaying, renderGame]);

  // Initial render
  useEffect(() => {
    renderGame();
  }, [renderGame]);

  const startGame = () => {
    if (!gameRef.current) return;
    gameRef.current.start();
    setIsPlaying(true);
  };

  const pauseGame = () => {
    if (!gameRef.current) return;
    gameRef.current.pause();
  };

  const restartGame = () => {
    if (!gameRef.current) return;
    gameRef.current.restart();
    setIsPlaying(true);
  };

  const stopGame = () => {
    if (!gameRef.current) return;
    gameRef.current.stopGameLoop();
    setIsPlaying(false);
  };

  return (
    <div className="tetris-game" style={{ display: 'flex', gap: '20px', alignItems: 'flex-start' }}>
      <div className="tetris-board">
        <canvas
          ref={canvasRef}
          width={TETRIS_BLOCK_SIZE * 10}
          height={TETRIS_BLOCK_SIZE * 20}
          style={{
            border: '2px solid #333',
            backgroundColor: '#000'
          }}
        />
      </div>
      
      <div className="tetris-info" style={{ minWidth: '200px' }}>
        <div className="tetris-stats" style={{ marginBottom: '20px' }}>
          <h3 style={{ color: '#00ff00', margin: '0 0 10px 0' }}>Tetris</h3>
          {gameState && (
            <>
              <div style={{ color: '#ffffff', marginBottom: '5px' }}>
                Score: {gameState.score.toLocaleString()}
              </div>
              <div style={{ color: '#ffffff', marginBottom: '5px' }}>
                Level: {gameState.level}
              </div>
              <div style={{ color: '#ffffff', marginBottom: '5px' }}>
                Lines: {gameState.lines}
              </div>
              {gameState.isGameOver && (
                <div style={{ color: '#ff0000', fontWeight: 'bold', marginTop: '10px' }}>
                  GAME OVER
                </div>
              )}
              {gameState.isPaused && !gameState.isGameOver && (
                <div style={{ color: '#ffff00', fontWeight: 'bold', marginTop: '10px' }}>
                  PAUSED
                </div>
              )}
            </>
          )}
        </div>

        <div className="tetris-controls" style={{ marginBottom: '20px' }}>
          <div style={{ marginBottom: '10px' }}>
            {!isPlaying ? (
              <button
                onClick={startGame}
                style={{
                  backgroundColor: '#00ff00',
                  color: '#000',
                  border: 'none',
                  padding: '10px 20px',
                  borderRadius: '5px',
                  cursor: 'pointer',
                  fontWeight: 'bold'
                }}
              >
                Start Game
              </button>
            ) : (
              <button
                onClick={pauseGame}
                style={{
                  backgroundColor: '#ffff00',
                  color: '#000',
                  border: 'none',
                  padding: '10px 20px',
                  borderRadius: '5px',
                  cursor: 'pointer',
                  fontWeight: 'bold'
                }}
              >
                Pause
              </button>
            )}
          </div>
          
          <div style={{ marginBottom: '10px' }}>
            <button
              onClick={restartGame}
              style={{
                backgroundColor: '#ff6600',
                color: '#fff',
                border: 'none',
                padding: '10px 20px',
                borderRadius: '5px',
                cursor: 'pointer',
                fontWeight: 'bold'
              }}
            >
              Restart
            </button>
          </div>

          <div>
            <button
              onClick={stopGame}
              style={{
                backgroundColor: '#ff0000',
                color: '#fff',
                border: 'none',
                padding: '10px 20px',
                borderRadius: '5px',
                cursor: 'pointer',
                fontWeight: 'bold'
              }}
            >
              Stop
            </button>
          </div>
        </div>

        <div className="tetris-instructions" style={{ fontSize: '12px', color: '#cccccc' }}>
          <div style={{ marginBottom: '10px', fontWeight: 'bold' }}>Controls:</div>
          <div>← → Move left/right</div>
          <div>↓ Soft drop</div>
          <div>↑ Rotate</div>
          <div>Space: Hard drop</div>
          <div>P: Pause</div>
        </div>

        {gameState?.nextPiece && (
          <div className="next-piece" style={{ marginTop: '20px' }}>
            <div style={{ color: '#ffffff', marginBottom: '5px', fontWeight: 'bold' }}>Next:</div>
            <div 
              style={{ 
                width: '120px', 
                height: '120px', 
                backgroundColor: '#000', 
                border: '1px solid #333',
                position: 'relative'
              }}
            >
              {/* Render next piece preview */}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TetrisGameComponent;