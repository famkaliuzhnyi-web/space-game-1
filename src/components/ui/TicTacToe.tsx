import React, { useState, useCallback } from 'react';
import './TicTacToe.css';

interface TicTacToeProps {
  onBack: () => void;
}

type Player = 'X' | 'O';
type Cell = Player | null;
type Board = Cell[];

const WINNING_COMBINATIONS = [
  [0, 1, 2], [3, 4, 5], [6, 7, 8], // rows
  [0, 3, 6], [1, 4, 7], [2, 5, 8], // columns
  [0, 4, 8], [2, 4, 6] // diagonals
];

const TicTacToe: React.FC<TicTacToeProps> = ({ onBack }) => {
  const [board, setBoard] = useState<Board>(Array(9).fill(null));
  const [currentPlayer, setCurrentPlayer] = useState<Player>('X');
  const [winner, setWinner] = useState<Player | null>(null);
  const [gameOver, setGameOver] = useState(false);

  const checkWinner = useCallback((newBoard: Board): Player | null => {
    for (const [a, b, c] of WINNING_COMBINATIONS) {
      if (newBoard[a] && newBoard[a] === newBoard[b] && newBoard[a] === newBoard[c]) {
        return newBoard[a] as Player;
      }
    }
    return null;
  }, []);

  const checkDraw = useCallback((newBoard: Board): boolean => {
    return newBoard.every(cell => cell !== null);
  }, []);

  const handleCellClick = useCallback((index: number) => {
    if (board[index] || gameOver) return;

    const newBoard = [...board];
    newBoard[index] = currentPlayer;
    setBoard(newBoard);

    const gameWinner = checkWinner(newBoard);
    if (gameWinner) {
      setWinner(gameWinner);
      setGameOver(true);
    } else if (checkDraw(newBoard)) {
      setGameOver(true);
    } else {
      setCurrentPlayer(currentPlayer === 'X' ? 'O' : 'X');
    }
  }, [board, currentPlayer, gameOver, checkWinner, checkDraw]);

  const resetGame = useCallback(() => {
    setBoard(Array(9).fill(null));
    setCurrentPlayer('X');
    setWinner(null);
    setGameOver(false);
  }, []);

  const getGameStatus = () => {
    if (winner) {
      return `🎉 Player ${winner} Wins!`;
    }
    if (gameOver) {
      return "🤝 It's a Draw!";
    }
    return `Current Player: ${currentPlayer}`;
  };

  return (
    <div className="tic-tac-toe-container">
      <div className="tic-tac-toe-header">
        <button className="space-button secondary" onClick={onBack}>
          ← Back to Menu
        </button>
        <h1 className="tic-tac-toe-title">🎮 Tic Tac Toe</h1>
      </div>

      <div className="tic-tac-toe-game">
        <div className="game-status">
          {getGameStatus()}
        </div>

        <div className="game-board">
          {board.map((cell, index) => (
            <button
              key={index}
              className={`game-cell ${cell ? 'filled' : ''} ${cell === 'X' ? 'player-x' : cell === 'O' ? 'player-o' : ''}`}
              onClick={() => handleCellClick(index)}
              disabled={!!cell || gameOver}
            >
              {cell}
            </button>
          ))}
        </div>

        <div className="game-controls">
          <button className="space-button primary" onClick={resetGame}>
            🔄 New Game
          </button>
        </div>
      </div>
    </div>
  );
};

export default TicTacToe;