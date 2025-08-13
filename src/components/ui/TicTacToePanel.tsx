import React, { useState, useCallback } from 'react';
import './TicTacToePanel.css';

type Player = 'X' | 'O' | null;
type GameBoard = Player[];

interface GameState {
  board: GameBoard;
  currentPlayer: Player;
  winner: Player;
  isDraw: boolean;
  isGameActive: boolean;
}

interface TicTacToePanelProps {
  isVisible: boolean;
  onClose: () => void;
}

const WINNING_COMBINATIONS = [
  [0, 1, 2], [3, 4, 5], [6, 7, 8], // Rows
  [0, 3, 6], [1, 4, 7], [2, 5, 8], // Columns
  [0, 4, 8], [2, 4, 6]             // Diagonals
];

export const TicTacToePanel: React.FC<TicTacToePanelProps> = ({ 
  isVisible, 
  onClose 
}) => {
  const [gameState, setGameState] = useState<GameState>(() => ({
    board: Array(9).fill(null),
    currentPlayer: 'X',
    winner: null,
    isDraw: false,
    isGameActive: true
  }));

  const [gameStats, setGameStats] = useState({
    xWins: 0,
    oWins: 0,
    draws: 0,
    totalGames: 0
  });

  const checkWinner = useCallback((board: GameBoard): Player => {
    for (const [a, b, c] of WINNING_COMBINATIONS) {
      if (board[a] && board[a] === board[b] && board[a] === board[c]) {
        return board[a];
      }
    }
    return null;
  }, []);

  const checkDraw = useCallback((board: GameBoard): boolean => {
    return board.every(cell => cell !== null);
  }, []);

  const makeMove = useCallback((index: number) => {
    if (!gameState.isGameActive || gameState.board[index] !== null) {
      return;
    }

    const newBoard = [...gameState.board];
    newBoard[index] = gameState.currentPlayer;

    const winner = checkWinner(newBoard);
    const isDraw = !winner && checkDraw(newBoard);
    const isGameActive = !winner && !isDraw;

    setGameState({
      board: newBoard,
      currentPlayer: gameState.currentPlayer === 'X' ? 'O' : 'X',
      winner,
      isDraw,
      isGameActive
    });

    // Update stats if game ended
    if (winner || isDraw) {
      setGameStats(prev => ({
        xWins: prev.xWins + (winner === 'X' ? 1 : 0),
        oWins: prev.oWins + (winner === 'O' ? 1 : 0),
        draws: prev.draws + (isDraw ? 1 : 0),
        totalGames: prev.totalGames + 1
      }));
    }
  }, [gameState, checkWinner, checkDraw]);

  const resetGame = useCallback(() => {
    setGameState({
      board: Array(9).fill(null),
      currentPlayer: 'X',
      winner: null,
      isDraw: false,
      isGameActive: true
    });
  }, []);

  const resetStats = useCallback(() => {
    setGameStats({
      xWins: 0,
      oWins: 0,
      draws: 0,
      totalGames: 0
    });
  }, []);

  const getGameStatusMessage = (): string => {
    if (gameState.winner) {
      return `Player ${gameState.winner} wins!`;
    }
    if (gameState.isDraw) {
      return "It's a draw!";
    }
    return `Player ${gameState.currentPlayer}'s turn`;
  };

  const getCellClassName = (index: number): string => {
    const baseClass = 'game-cell';
    const player = gameState.board[index];
    
    if (!player) return baseClass;
    
    return `${baseClass} ${player.toLowerCase()}`;
  };

  if (!isVisible) return null;

  return (
    <div className="tic-tac-toe-overlay">
      <div className="tic-tac-toe-panel">
        <div className="panel-header">
          <h2>Tic Tac Toe</h2>
          <button 
            className="close-button" 
            onClick={onClose}
            aria-label="Close Tic Tac Toe"
          >
            ×
          </button>
        </div>

        <div className="panel-content">
          <div className="game-section">
            <div className="game-status">
              <h3>{getGameStatusMessage()}</h3>
            </div>

            <div className="game-board" role="grid" aria-label="Tic Tac Toe Board">
              {gameState.board.map((cell, index) => (
                <button
                  key={index}
                  className={getCellClassName(index)}
                  onClick={() => makeMove(index)}
                  disabled={!gameState.isGameActive || cell !== null}
                  aria-label={`Cell ${index + 1}, ${cell ? `occupied by ${cell}` : 'empty'}`}
                  role="gridcell"
                >
                  {cell}
                </button>
              ))}
            </div>

            <div className="game-controls">
              <button 
                className="control-button reset-button" 
                onClick={resetGame}
                aria-label="Start new game"
              >
                New Game
              </button>
            </div>
          </div>

          <div className="stats-section">
            <h3>Game Statistics</h3>
            <div className="stats-grid">
              <div className="stat-item">
                <span className="stat-label">Player X Wins:</span>
                <span className="stat-value x-wins">{gameStats.xWins}</span>
              </div>
              <div className="stat-item">
                <span className="stat-label">Player O Wins:</span>
                <span className="stat-value o-wins">{gameStats.oWins}</span>
              </div>
              <div className="stat-item">
                <span className="stat-label">Draws:</span>
                <span className="stat-value draws">{gameStats.draws}</span>
              </div>
              <div className="stat-item">
                <span className="stat-label">Total Games:</span>
                <span className="stat-value total">{gameStats.totalGames}</span>
              </div>
            </div>
            <button 
              className="control-button reset-stats-button" 
              onClick={resetStats}
              aria-label="Reset game statistics"
            >
              Reset Stats
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TicTacToePanel;