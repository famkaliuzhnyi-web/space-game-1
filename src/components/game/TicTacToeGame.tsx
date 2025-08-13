import React, { useState, useEffect, useCallback } from 'react';
import { WebRTCService, GameMessage, Player } from '../../services/WebRTCService';
import './TicTacToeGame.css';

export type CellValue = 'X' | 'O' | null;
export type GameBoard = CellValue[];
export type GameStatus = 'waiting' | 'playing' | 'finished';

interface TicTacToeGameState {
  board: GameBoard;
  currentPlayer: string;
  currentSymbol: 'X' | 'O';
  status: GameStatus;
  winner: string | null;
  isDraw: boolean;
  scores: Record<string, number>;
}

interface TicTacToeGameProps {
  webrtcService: WebRTCService;
  onGameEnd?: () => void;
}

const initialGameState: TicTacToeGameState = {
  board: Array(9).fill(null),
  currentPlayer: '',
  currentSymbol: 'X',
  status: 'waiting',
  winner: null,
  isDraw: false,
  scores: {}
};

const TicTacToeGame: React.FC<TicTacToeGameProps> = ({ webrtcService, onGameEnd }) => {
  const [gameState, setGameState] = useState<TicTacToeGameState>(initialGameState);
  const [players, setPlayers] = useState<Player[]>([]);
  const [localPlayerId] = useState(webrtcService.getLocalPlayer().id);
  const [playerSymbols, setPlayerSymbols] = useState<Record<string, 'X' | 'O'>>({});

  // Initialize game when players are ready
  const initializeGame = useCallback(() => {
    const connectedPlayers = [webrtcService.getLocalPlayer(), ...webrtcService.getPlayers().filter(p => p.isConnected)];
    
    if (connectedPlayers.length >= 2) {
      // Assign symbols to first two players
      const symbols: Record<string, 'X' | 'O'> = {};
      symbols[connectedPlayers[0].id] = 'X';
      symbols[connectedPlayers[1].id] = 'O';
      
      setPlayerSymbols(symbols);
      
      const newGameState: TicTacToeGameState = {
        ...initialGameState,
        currentPlayer: connectedPlayers[0].id,
        currentSymbol: 'X',
        status: 'playing',
        scores: connectedPlayers.reduce((acc, p) => ({ ...acc, [p.id]: 0 }), {})
      };
      
      setGameState(newGameState);
      
      // Host broadcasts the game start
      if (webrtcService.isHostPlayer()) {
        webrtcService.sendMessage({
          type: 'game_start',
          data: { 
            gameState: newGameState,
            playerSymbols: symbols
          }
        });
      }
    }
  }, [webrtcService]);

  // Handle incoming WebRTC messages
  const handleMessage = useCallback((message: GameMessage) => {
    switch (message.type) {
      case 'game_start':
        setGameState(message.data.gameState);
        setPlayerSymbols(message.data.playerSymbols);
        break;
        
      case 'game_move':
        setGameState(message.data.gameState);
        break;
        
      case 'game_state':
        setGameState(message.data.gameState);
        break;
        
      case 'game_end':
        setGameState(message.data.gameState);
        break;
    }
  }, []);

  // Handle player join/leave
  const handlePlayerJoin = useCallback((player: Player) => {
    setPlayers(prev => [...prev.filter(p => p.id !== player.id), player]);
  }, []);

  const handlePlayerLeave = useCallback((playerId: string) => {
    setPlayers(prev => prev.filter(p => p.id !== playerId));
  }, []);

  // Set up WebRTC event listeners
  useEffect(() => {
    webrtcService.onMessage(handleMessage);
    webrtcService.onPlayerJoin(handlePlayerJoin);
    webrtcService.onPlayerLeave(handlePlayerLeave);

    // Initialize players list
    setPlayers(webrtcService.getPlayers());
    
    return () => {
      // Cleanup would go here if the service supported removing listeners
    };
  }, [webrtcService, handleMessage, handlePlayerJoin, handlePlayerLeave]);

  // Check for winner
  const checkWinner = (board: GameBoard): { winner: CellValue; line: number[] | null } => {
    const lines = [
      [0, 1, 2], [3, 4, 5], [6, 7, 8], // rows
      [0, 3, 6], [1, 4, 7], [2, 5, 8], // columns
      [0, 4, 8], [2, 4, 6] // diagonals
    ];

    for (const line of lines) {
      const [a, b, c] = line;
      if (board[a] && board[a] === board[b] && board[a] === board[c]) {
        return { winner: board[a], line };
      }
    }

    return { winner: null, line: null };
  };

  // Make a move
  const makeMove = (index: number) => {
    if (gameState.status !== 'playing' || 
        gameState.board[index] !== null || 
        gameState.currentPlayer !== localPlayerId) {
      return;
    }

    const newBoard = [...gameState.board];
    newBoard[index] = playerSymbols[localPlayerId];

    const { winner } = checkWinner(newBoard);
    const isDraw = !winner && newBoard.every(cell => cell !== null);
    
    // Get next player
    const allPlayers = [webrtcService.getLocalPlayer(), ...players.filter(p => p.isConnected)];
    const gamePlayingPlayers = allPlayers.filter(p => playerSymbols[p.id]);
    const currentPlayerIndex = gamePlayingPlayers.findIndex(p => p.id === gameState.currentPlayer);
    const nextPlayerIndex = (currentPlayerIndex + 1) % gamePlayingPlayers.length;
    const nextPlayer = gamePlayingPlayers[nextPlayerIndex];

    const newGameState: TicTacToeGameState = {
      ...gameState,
      board: newBoard,
      currentPlayer: winner || isDraw ? '' : nextPlayer.id,
      currentSymbol: winner || isDraw ? gameState.currentSymbol : playerSymbols[nextPlayer.id],
      status: winner || isDraw ? 'finished' : 'playing',
      winner: winner ? localPlayerId : null,
      isDraw,
      scores: winner ? { 
        ...gameState.scores, 
        [localPlayerId]: gameState.scores[localPlayerId] + 1 
      } : gameState.scores
    };

    setGameState(newGameState);

    // Broadcast the move
    webrtcService.sendMessage({
      type: 'game_move',
      data: { gameState: newGameState }
    });
  };

  // Start a new game
  const startNewGame = () => {
    const connectedPlayers = [webrtcService.getLocalPlayer(), ...players.filter(p => p.isConnected)];
    
    if (connectedPlayers.length >= 2) {
      const newGameState: TicTacToeGameState = {
        ...gameState,
        board: Array(9).fill(null),
        currentPlayer: connectedPlayers[0].id,
        currentSymbol: 'X',
        status: 'playing',
        winner: null,
        isDraw: false
      };
      
      setGameState(newGameState);
      
      // Broadcast new game start
      webrtcService.sendMessage({
        type: 'game_start',
        data: { 
          gameState: newGameState,
          playerSymbols
        }
      });
    }
  };

  // Get player name by ID
  const getPlayerName = (playerId: string): string => {
    if (playerId === localPlayerId) {
      return webrtcService.getLocalPlayer().name;
    }
    const player = players.find(p => p.id === playerId);
    return player?.name || 'Unknown Player';
  };

  // Render game cell
  const renderCell = (index: number) => {
    return (
      <button
        key={index}
        className="tic-tac-toe-cell"
        onClick={() => makeMove(index)}
        disabled={gameState.status !== 'playing' || 
                 gameState.board[index] !== null || 
                 gameState.currentPlayer !== localPlayerId}
      >
        {gameState.board[index]}
      </button>
    );
  };

  return (
    <div className="tic-tac-toe-game">
      <div className="game-header">
        <h2>🎮 Multiplayer Tic-Tac-Toe</h2>
        <div className="game-info">
          <div>Players: {webrtcService.getConnectedPlayerCount()}</div>
          {gameState.status === 'playing' && (
            <div>
              Current Turn: {getPlayerName(gameState.currentPlayer)} ({gameState.currentSymbol})
              {gameState.currentPlayer === localPlayerId && <span> - Your turn!</span>}
            </div>
          )}
        </div>
      </div>

      {gameState.status === 'waiting' && (
        <div className="waiting-message">
          <p>Waiting for players to join...</p>
          <p>Need at least 2 players to start</p>
          {webrtcService.getConnectedPlayerCount() >= 2 && (
            <button onClick={initializeGame} className="start-game-btn">
              Start Game
            </button>
          )}
        </div>
      )}

      {(gameState.status === 'playing' || gameState.status === 'finished') && (
        <>
          <div className="game-board">
            {Array.from({ length: 9 }, (_, index) => renderCell(index))}
          </div>

          {gameState.status === 'finished' && (
            <div className="game-result">
              {gameState.winner ? (
                <p>🎉 {getPlayerName(gameState.winner)} wins!</p>
              ) : gameState.isDraw ? (
                <p>🤝 It's a draw!</p>
              ) : null}
              <button onClick={startNewGame} className="new-game-btn">
                New Game
              </button>
            </div>
          )}

          <div className="scores">
            <h3>Scores:</h3>
            {Object.entries(gameState.scores).map(([playerId, score]) => (
              <div key={playerId}>
                {getPlayerName(playerId)} ({playerSymbols[playerId]}): {score}
              </div>
            ))}
          </div>
        </>
      )}

      <div className="game-controls">
        <button onClick={onGameEnd} className="back-btn">
          Back to Menu
        </button>
      </div>
    </div>
  );
};

export default TicTacToeGame;