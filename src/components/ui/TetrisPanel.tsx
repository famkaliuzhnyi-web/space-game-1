import React, { useState } from 'react';
import TetrisGameComponent from '../game/TetrisGameComponent';
import './TetrisPanel.css';

interface TetrisPanelProps {
  onClose: () => void;
}

const TetrisPanel: React.FC<TetrisPanelProps> = ({ onClose }) => {
  const [highScore, setHighScore] = useState(() => {
    const saved = localStorage.getItem('tetris-high-score');
    return saved ? parseInt(saved, 10) : 0;
  });
  const [currentScore, setCurrentScore] = useState(0);

  const handleScoreChange = (score: number) => {
    setCurrentScore(score);
    if (score > highScore) {
      setHighScore(score);
      localStorage.setItem('tetris-high-score', score.toString());
    }
  };

  const handleGameOver = (finalScore: number) => {
    if (finalScore > highScore) {
      setHighScore(finalScore);
      localStorage.setItem('tetris-high-score', finalScore.toString());
    }
  };

  return (
    <div className="panel tetris-panel" style={{
      position: 'fixed',
      top: '50%',
      left: '50%',
      transform: 'translate(-50%, -50%)',
      backgroundColor: 'rgba(0, 0, 0, 0.95)',
      border: '2px solid #00ff00',
      borderRadius: '10px',
      padding: '20px',
      zIndex: 1000,
      maxWidth: '90vw',
      maxHeight: '90vh',
      overflow: 'auto'
    }}>
      <div className="panel-header" style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '20px',
        borderBottom: '1px solid #333',
        paddingBottom: '10px'
      }}>
        <h2 style={{ 
          color: '#00ff00', 
          margin: 0, 
          fontSize: '24px',
          fontFamily: 'monospace'
        }}>
          🎮 Tetris Arcade
        </h2>
        <button
          onClick={onClose}
          style={{
            backgroundColor: 'transparent',
            border: '1px solid #ff0000',
            color: '#ff0000',
            padding: '5px 10px',
            borderRadius: '3px',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: 'bold'
          }}
          onMouseOver={(e) => {
            e.currentTarget.style.backgroundColor = '#ff0000';
            e.currentTarget.style.color = '#000';
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.backgroundColor = 'transparent';
            e.currentTarget.style.color = '#ff0000';
          }}
        >
          ✕ Close
        </button>
      </div>

      <div className="tetris-content" style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '20px'
      }}>
        <div className="tetris-stats-header" style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '10px',
          backgroundColor: 'rgba(0, 255, 0, 0.1)',
          border: '1px solid #00ff00',
          borderRadius: '5px'
        }}>
          <div style={{ color: '#ffffff' }}>
            <strong>High Score:</strong> {highScore.toLocaleString()}
          </div>
          <div style={{ color: '#ffff00' }}>
            <strong>Current Score:</strong> {currentScore.toLocaleString()}
          </div>
        </div>

        <TetrisGameComponent 
          onScoreChange={handleScoreChange}
          onGameOver={handleGameOver}
        />

        <div className="tetris-info" style={{
          backgroundColor: 'rgba(0, 100, 255, 0.1)',
          border: '1px solid #0066ff',
          borderRadius: '5px',
          padding: '15px',
          color: '#ffffff',
          fontSize: '14px',
          lineHeight: '1.5'
        }}>
          <h3 style={{ color: '#0066ff', margin: '0 0 10px 0' }}>About Tetris</h3>
          <p style={{ margin: '0 0 10px 0' }}>
            Tetris is a classic puzzle game where you arrange falling geometric shapes (tetrominoes) 
            to create complete horizontal lines, which then disappear and award points.
          </p>
          <p style={{ margin: '0 0 10px 0' }}>
            <strong>Scoring:</strong> Lines cleared simultaneously give exponentially more points. 
            Your level increases every 10 lines, making pieces fall faster.
          </p>
          <p style={{ margin: '0' }}>
            <strong>Strategy:</strong> Try to clear multiple lines at once (especially 4 lines - a "Tetris") 
            for maximum points. Keep your stack low and avoid creating gaps!
          </p>
        </div>
      </div>
    </div>
  );
};

export default TetrisPanel;