import React, { useState, useEffect, useRef } from 'react';
import QRCode from 'react-qr-code';
import { WebRTCService, Player } from '../../services/WebRTCService';
import TicTacToeGame from './TicTacToeGame';
import './MultiplayerLobby.css';

interface MultiplayerLobbyProps {
  onBackToMenu: () => void;
}

type LobbyState = 'menu' | 'hosting' | 'joining' | 'in-game';

const MultiplayerLobby: React.FC<MultiplayerLobbyProps> = ({ onBackToMenu }) => {
  const [lobbyState, setLobbyState] = useState<LobbyState>('menu');
  const [webrtcService] = useState(() => new WebRTCService());
  const [sessionToken, setSessionToken] = useState<string>('');
  const [players, setPlayers] = useState<Player[]>([]);
  const [connectionStatus, setConnectionStatus] = useState<string>('disconnected');
  const [joinToken, setJoinToken] = useState<string>('');
  const [isHost, setIsHost] = useState<boolean>(false);

  const sessionTokenRef = useRef<string>('');

  // Handle player joins
  const handlePlayerJoin = (player: Player) => {
    setPlayers(prev => [...prev.filter(p => p.id !== player.id), player]);
  };

  // Handle player leaves
  const handlePlayerLeave = (playerId: string) => {
    setPlayers(prev => prev.filter(p => p.id !== playerId));
  };

  // Handle connection state changes
  const handleConnectionStateChange = (state: string) => {
    setConnectionStatus(state);
  };

  // Set up WebRTC event listeners
  useEffect(() => {
    webrtcService.onPlayerJoin(handlePlayerJoin);
    webrtcService.onPlayerLeave(handlePlayerLeave);
    webrtcService.onConnectionStateChange(handleConnectionStateChange);

    return () => {
      webrtcService.disconnect();
    };
  }, [webrtcService]);

  // Host a game
  const hostGame = async () => {
    try {
      const token = await webrtcService.createSession();
      setSessionToken(token);
      sessionTokenRef.current = token;
      setIsHost(true);
      setLobbyState('hosting');
      console.log('Hosting session with token:', token);
    } catch (error) {
      console.error('Failed to host game:', error);
      alert('Failed to host game. Please try again.');
    }
  };

  // Join a game
  const joinGame = async () => {
    if (!joinToken.trim()) {
      alert('Please enter a session token');
      return;
    }

    try {
      setLobbyState('joining');
      const success = await webrtcService.joinSession(joinToken.trim());
      
      if (success) {
        setIsHost(false);
        console.log('Successfully joined session');
      } else {
        alert('Failed to join session. Please check the token and try again.');
        setLobbyState('menu');
      }
    } catch (error) {
      console.error('Failed to join game:', error);
      alert('Failed to join game. Please try again.');
      setLobbyState('menu');
    }
  };

  // Start the actual game
  const startGame = () => {
    setLobbyState('in-game');
  };

  // Back to menu from game
  const backToLobby = () => {
    if (isHost) {
      setLobbyState('hosting');
    } else {
      setLobbyState('joining');
    }
  };

  // Get QR code data URL
  const getQRCodeData = () => {
    // Create a simple URL-like structure that could be scanned
    return `space-game-multiplayer://${sessionToken}`;
  };

  // Parse token from QR code data (for manual entry)
  const parseTokenFromQRData = (data: string): string => {
    if (data.startsWith('space-game-multiplayer://')) {
      return data.replace('space-game-multiplayer://', '');
    }
    return data; // Return as-is if it's just a token
  };

  // Handle manual token input
  const handleTokenInput = (value: string) => {
    setJoinToken(parseTokenFromQRData(value));
  };

  // Get connected player count
  const getConnectedPlayerCount = () => {
    return webrtcService.getConnectedPlayerCount();
  };

  // Copy session token to clipboard
  const copyTokenToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(sessionToken);
      alert('Session token copied to clipboard!');
    } catch (error) {
      console.error('Failed to copy to clipboard:', error);
      // Fallback: select the text
      const tokenElement = document.getElementById('session-token');
      if (tokenElement) {
        const range = document.createRange();
        range.selectNode(tokenElement);
        window.getSelection()?.removeAllRanges();
        window.getSelection()?.addRange(range);
      }
    }
  };

  if (lobbyState === 'in-game') {
    return (
      <TicTacToeGame 
        webrtcService={webrtcService}
        onGameEnd={backToLobby}
      />
    );
  }

  return (
    <div className="multiplayer-lobby">
      {lobbyState === 'menu' && (
        <div className="lobby-menu">
          <h1>🌐 Multiplayer Mode</h1>
          <p>Play tic-tac-toe with up to 3 players using WebRTC!</p>
          
          <div className="menu-options">
            <button onClick={hostGame} className="host-btn">
              🏠 Host Game
            </button>
            <button onClick={() => setLobbyState('joining')} className="join-btn">
              🔗 Join Game
            </button>
            <button onClick={onBackToMenu} className="back-btn">
              ← Back to Main Menu
            </button>
          </div>
        </div>
      )}

      {lobbyState === 'hosting' && (
        <div className="hosting-lobby">
          <h2>🏠 Hosting Game</h2>
          <p>Share this QR code or session token with other players:</p>
          
          <div className="qr-code-section">
            <div className="qr-code-container">
              <QRCode 
                value={getQRCodeData()}
                size={200}
                bgColor="#ffffff"
                fgColor="#000000"
              />
            </div>
            
            <div className="session-info">
              <p><strong>Session Token:</strong></p>
              <div className="token-container">
                <code id="session-token" className="session-token">
                  {sessionToken}
                </code>
                <button onClick={copyTokenToClipboard} className="copy-btn">
                  📋 Copy
                </button>
              </div>
              <p className="token-hint">
                Players can scan the QR code or manually enter this token
              </p>
            </div>
          </div>

          <div className="lobby-status">
            <h3>Players ({getConnectedPlayerCount()}/3):</h3>
            <div className="players-list">
              <div className="player-item host">
                👑 {webrtcService.getLocalPlayer().name} (You - Host)
              </div>
              {players.filter(p => p.isConnected).map(player => (
                <div key={player.id} className="player-item">
                  👤 {player.name}
                </div>
              ))}
            </div>
          </div>

          <div className="lobby-controls">
            {getConnectedPlayerCount() >= 2 ? (
              <button onClick={startGame} className="start-game-btn">
                🎮 Start Tic-Tac-Toe Game
              </button>
            ) : (
              <p className="waiting-message">
                Waiting for at least 1 more player to join...
              </p>
            )}
            <button onClick={() => setLobbyState('menu')} className="back-btn">
              ← Back to Menu
            </button>
          </div>
        </div>
      )}

      {lobbyState === 'joining' && (
        <div className="joining-lobby">
          <h2>🔗 Join Game</h2>
          <p>Enter the session token or scan a QR code to join a game:</p>
          
          <div className="join-form">
            <div className="input-group">
              <label htmlFor="join-token">Session Token:</label>
              <input
                id="join-token"
                type="text"
                value={joinToken}
                onChange={(e) => handleTokenInput(e.target.value)}
                placeholder="Enter session token here..."
                className="token-input"
              />
            </div>
            
            <div className="join-controls">
              <button 
                onClick={joinGame} 
                disabled={!joinToken.trim()}
                className="join-submit-btn"
              >
                🎮 Join Game
              </button>
              <button onClick={() => setLobbyState('menu')} className="back-btn">
                ← Back to Menu
              </button>
            </div>
          </div>

          <div className="connection-status">
            Status: <span className={`status-${connectionStatus}`}>{connectionStatus}</span>
          </div>

          {players.length > 0 && (
            <div className="lobby-status">
              <h3>Connected Players:</h3>
              <div className="players-list">
                {players.filter(p => p.isConnected).map(player => (
                  <div key={player.id} className="player-item">
                    {player.isHost ? '👑' : '👤'} {player.name}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default MultiplayerLobby;