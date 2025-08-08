import React from 'react';

const LoadingPanel: React.FC = () => (
  <div style={{
    position: 'fixed',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    background: '#1f2937',
    border: '1px solid #374151',
    borderRadius: '8px',
    padding: '20px',
    color: '#f3f4f6',
    display: 'flex',
    alignItems: 'center',
    gap: '10px'
  }}>
    <div style={{
      width: '20px',
      height: '20px',
      border: '2px solid #374151',
      borderTop: '2px solid #60a5fa',
      borderRadius: '50%',
      animation: 'spin 1s linear infinite'
    }} />
    Loading...
    <style>{`
      @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }
    `}</style>
  </div>
);

export default LoadingPanel;