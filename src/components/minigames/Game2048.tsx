import React, { useState, useEffect, useCallback } from 'react';

export interface Game2048Props {
  gridSize: number;
  targetTile: number;
  moveLimit: number;
  startingTiles: number;
  onGameEnd: (success: boolean, score: number) => void;
}

type Direction = 'up' | 'down' | 'left' | 'right';
type Grid = (number | null)[][];

export const Game2048: React.FC<Game2048Props> = ({ 
  gridSize, 
  targetTile, 
  moveLimit, 
  startingTiles,
  onGameEnd 
}) => {
  const [grid, setGrid] = useState<Grid>(() => 
    Array(gridSize).fill(null).map(() => Array(gridSize).fill(null))
  );
  const [score, setScore] = useState(0);
  const [moves, setMoves] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [gameWon, setGameWon] = useState(false);
  
  // Touch gesture state
  const [touchStart, setTouchStart] = useState<{ x: number; y: number } | null>(null);
  const [touchEnd, setTouchEnd] = useState<{ x: number; y: number } | null>(null);

  // Initialize game with starting tiles
  useEffect(() => {
    const newGrid = Array(gridSize).fill(null).map(() => Array(gridSize).fill(null));
    
    for (let i = 0; i < startingTiles; i++) {
      addRandomTile(newGrid);
    }
    
    setGrid(newGrid);
  }, [gridSize, startingTiles]);

  // Add a random tile (2 or 4) to an empty cell
  const addRandomTile = (currentGrid: Grid) => {
    const emptyCells: [number, number][] = [];
    
    for (let i = 0; i < gridSize; i++) {
      for (let j = 0; j < gridSize; j++) {
        if (currentGrid[i][j] === null) {
          emptyCells.push([i, j]);
        }
      }
    }
    
    if (emptyCells.length > 0) {
      const [row, col] = emptyCells[Math.floor(Math.random() * emptyCells.length)];
      currentGrid[row][col] = Math.random() < 0.9 ? 2 : 4;
    }
  };

  // Deep copy grid
  const copyGrid = (grid: Grid): Grid => 
    grid.map(row => [...row]);

  // Move tiles in specified direction
  const move = useCallback((direction: Direction) => {
    if (gameOver || gameWon) return;

    const newGrid = copyGrid(grid);
    let moved = false;
    let newScore = score;

    const moveRow = (row: (number | null)[], reverse = false) => {
      const filtered = row.filter(cell => cell !== null) as number[];
      if (reverse) filtered.reverse();
      
      const merged: number[] = [];
      let skip = false;
      
      for (let i = 0; i < filtered.length; i++) {
        if (skip) {
          skip = false;
          continue;
        }
        
        if (i < filtered.length - 1 && filtered[i] === filtered[i + 1]) {
          const mergedValue = filtered[i] * 2;
          merged.push(mergedValue);
          newScore += mergedValue;
          skip = true;
          
          // Check for winning condition
          if (mergedValue >= targetTile) {
            setGameWon(true);
          }
        } else {
          merged.push(filtered[i]);
        }
      }
      
      while (merged.length < gridSize) {
        merged.push(null as any);
      }
      
      if (reverse) merged.reverse();
      return merged as (number | null)[];
    };

    // Apply movement based on direction
    if (direction === 'left' || direction === 'right') {
      for (let i = 0; i < gridSize; i++) {
        const originalRow = [...newGrid[i]];
        newGrid[i] = moveRow(newGrid[i], direction === 'right');
        if (JSON.stringify(originalRow) !== JSON.stringify(newGrid[i])) {
          moved = true;
        }
      }
    } else {
      // Transpose for vertical movement
      for (let j = 0; j < gridSize; j++) {
        const column: (number | null)[] = [];
        for (let i = 0; i < gridSize; i++) {
          column.push(newGrid[i][j]);
        }
        
        const originalColumn = [...column];
        const movedColumn = moveRow(column, direction === 'down');
        
        if (JSON.stringify(originalColumn) !== JSON.stringify(movedColumn)) {
          moved = true;
        }
        
        for (let i = 0; i < gridSize; i++) {
          newGrid[i][j] = movedColumn[i];
        }
      }
    }

    if (moved) {
      addRandomTile(newGrid);
      setGrid(newGrid);
      setScore(newScore);
      setMoves(prev => prev + 1);
      
      // Check for game over conditions
      if (moves + 1 >= moveLimit) {
        setGameOver(true);
        onGameEnd(false, newScore);
      } else if (isGameOver(newGrid)) {
        setGameOver(true);
        onGameEnd(false, newScore);
      }
    }
  }, [grid, score, moves, gameOver, gameWon, gridSize, targetTile, moveLimit, onGameEnd]);

  // Check if no more moves are possible
  const isGameOver = (currentGrid: Grid): boolean => {
    // Check for empty cells
    for (let i = 0; i < gridSize; i++) {
      for (let j = 0; j < gridSize; j++) {
        if (currentGrid[i][j] === null) return false;
      }
    }
    
    // Check for possible merges
    for (let i = 0; i < gridSize; i++) {
      for (let j = 0; j < gridSize; j++) {
        const current = currentGrid[i][j];
        if (
          (i < gridSize - 1 && currentGrid[i + 1][j] === current) ||
          (j < gridSize - 1 && currentGrid[i][j + 1] === current)
        ) {
          return false;
        }
      }
    }
    
    return true;
  };

  // Handle game won
  useEffect(() => {
    if (gameWon && !gameOver) {
      setTimeout(() => {
        onGameEnd(true, score);
      }, 1000);
    }
  }, [gameWon, gameOver, score, onGameEnd]);

  // Touch/swipe gesture handling
  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      setTouchEnd(null);
      setTouchStart({
        x: e.touches[0].clientX,
        y: e.touches[0].clientY,
      });
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      setTouchEnd({
        x: e.touches[0].clientX,
        y: e.touches[0].clientY,
      });
    }
  };

  const handleTouchEnd = () => {
    if (!touchStart || !touchEnd) return;

    const deltaX = touchEnd.x - touchStart.x;
    const deltaY = touchEnd.y - touchStart.y;
    const minSwipeDistance = 50;

    // Determine swipe direction
    if (Math.abs(deltaX) > Math.abs(deltaY)) {
      // Horizontal swipe
      if (Math.abs(deltaX) > minSwipeDistance) {
        move(deltaX > 0 ? 'right' : 'left');
      }
    } else {
      // Vertical swipe
      if (Math.abs(deltaY) > minSwipeDistance) {
        move(deltaY > 0 ? 'down' : 'up');
      }
    }

    setTouchStart(null);
    setTouchEnd(null);
  };

  // Keyboard controls
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      e.preventDefault();
      
      switch (e.key) {
        case 'ArrowUp':
          move('up');
          break;
        case 'ArrowDown':
          move('down');
          break;
        case 'ArrowLeft':
          move('left');
          break;
        case 'ArrowRight':
          move('right');
          break;
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [move]);

  // Get tile color based on value - now using data attributes for CSS
  const getTileColor = (_value: number | null): string => {
    // Colors are now handled in CSS via data-value attributes
    return 'rgba(238, 228, 218, 0.35)'; // Default empty cell color
  };

  const getTileTextColor = (value: number | null): string => {
    // Text colors are now handled in CSS via data-value attributes
    return value ? '#776e65' : 'transparent';
  };

  return (
    <div className="game-2048" role="application" aria-label="2048 puzzle game">
      <div className="game-2048-header">
        <div className="game-2048-info" role="group" aria-label="Game statistics">
          <div aria-label={`Target: ${targetTile.toLocaleString()}`}>Target: {targetTile.toLocaleString()}</div>
          <div aria-label={`Score: ${score.toLocaleString()}`}>Score: {score.toLocaleString()}</div>
          <div aria-label={`Moves: ${moves} out of ${moveLimit}`}>Moves: {moves}/{moveLimit}</div>
        </div>
        {gameWon && <div className="game-status won" role="alert">🎉 Success!</div>}
        {gameOver && !gameWon && <div className="game-status lost" role="alert">Game Over</div>}
      </div>
      
      <div 
        className="game-2048-grid" 
        style={{ gridTemplateColumns: `repeat(${gridSize}, 1fr)` }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        role="grid"
        aria-label={`${gridSize}x${gridSize} game grid`}
      >
        {grid.map((row, i) =>
          row.map((cell, j) => (
            <div
              key={`${i}-${j}`}
              className="game-2048-cell"
              data-value={cell || undefined}
              role="gridcell"
              aria-label={cell ? `Tile with value ${cell.toLocaleString()}` : 'Empty cell'}
              style={{
                backgroundColor: getTileColor(cell),
                color: getTileTextColor(cell),
              }}
            >
              {cell ? cell.toLocaleString() : ''}
            </div>
          ))
        )}
      </div>
      
      <div className="game-2048-controls">
        <p>Use arrow keys, swipe gestures, or buttons to move tiles</p>
        <div className="control-buttons">
          <button onClick={() => move('up')} aria-label="Move tiles up">↑</button>
          <div>
            <button onClick={() => move('left')} aria-label="Move tiles left">←</button>
            <button onClick={() => move('down')} aria-label="Move tiles down">↓</button>
            <button onClick={() => move('right')} aria-label="Move tiles right">→</button>
          </div>
        </div>
      </div>
    </div>
  );
};