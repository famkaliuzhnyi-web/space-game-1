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

  // Get tile color based on value
  const getTileColor = (value: number | null): string => {
    if (!value) return 'var(--color-card-bg)';
    
    const colors: { [key: number]: string } = {
      2: '#eee4da',
      4: '#ede0c8',
      8: '#f2b179',
      16: '#f59563',
      32: '#f67c5f',
      64: '#f65e3b',
      128: '#edcf72',
      256: '#edcc61',
      512: '#edc850',
      1024: '#edc53f',
      2048: '#edc22e',
      4096: '#3c3a32',
    };
    
    return colors[value] || '#3c3a32';
  };

  const getTileTextColor = (value: number | null): string => {
    if (!value) return 'transparent';
    return value <= 4 ? '#776e65' : '#f9f6f2';
  };

  return (
    <div className="game-2048">
      <div className="game-2048-header">
        <div className="game-2048-info">
          <div>Target: {targetTile.toLocaleString()}</div>
          <div>Score: {score.toLocaleString()}</div>
          <div>Moves: {moves}/{moveLimit}</div>
        </div>
        {gameWon && <div className="game-status won">🎉 Success!</div>}
        {gameOver && !gameWon && <div className="game-status lost">Game Over</div>}
      </div>
      
      <div 
        className="game-2048-grid" 
        style={{ gridTemplateColumns: `repeat(${gridSize}, 1fr)` }}
      >
        {grid.map((row, i) =>
          row.map((cell, j) => (
            <div
              key={`${i}-${j}`}
              className="game-2048-cell"
              style={{
                backgroundColor: getTileColor(cell),
                color: getTileTextColor(cell),
              }}
            >
              {cell || ''}
            </div>
          ))
        )}
      </div>
      
      <div className="game-2048-controls">
        <p>Use arrow keys or buttons to move tiles</p>
        <div className="control-buttons">
          <button onClick={() => move('up')}>↑</button>
          <div>
            <button onClick={() => move('left')}>←</button>
            <button onClick={() => move('down')}>↓</button>
            <button onClick={() => move('right')}>→</button>
          </div>
        </div>
      </div>
    </div>
  );
};