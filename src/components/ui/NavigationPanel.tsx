import React from 'react';
import { NavigationTarget } from '../../types/world';

interface NavigationPanelProps {
  targets: NavigationTarget[];
  onNavigate: (targetId: string) => void;
  isVisible: boolean;
  onClose: () => void;
}

const NavigationPanel: React.FC<NavigationPanelProps> = ({
  targets,
  onNavigate,
  isVisible,
  onClose
}) => {
  if (!isVisible) return null;

  const handleNavigate = (targetId: string) => {
    onNavigate(targetId);
    onClose();
  };

  const formatTime = (time: number): string => {
    if (time < 1) return `${Math.round(time * 60)}s`;
    if (time < 60) return `${Math.round(time)}m`;
    return `${Math.round(time / 60)}h`;
  };

  const formatDistance = (distance: number): string => {
    if (distance < 1000) return `${Math.round(distance)}km`;
    return `${Math.round(distance / 1000)}Gkm`;
  };

  const getTargetIcon = (type: string): string => {
    switch (type) {
      case 'system': return '⭐';
      case 'station': return '🏗️';
      case 'planet': return '🪐';
      default: return '📍';
    }
  };

  return (
    <div style={{
      position: 'absolute',
      top: '50%',
      left: '50%',
      transform: 'translate(-50%, -50%)',
      backgroundColor: 'rgba(0, 0, 0, 0.9)',
      border: '2px solid #4a90e2',
      borderRadius: '8px',
      padding: '20px',
      color: '#ffffff',
      fontFamily: 'monospace',
      fontSize: '14px',
      maxWidth: '400px',
      maxHeight: '70vh',
      overflowY: 'auto',
      zIndex: 1000
    }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '15px',
        borderBottom: '1px solid #333',
        paddingBottom: '10px'
      }}>
        <h3 style={{ margin: 0, color: '#4a90e2' }}>Navigation Targets</h3>
        <button
          onClick={onClose}
          style={{
            background: 'none',
            border: 'none',
            color: '#ffffff',
            fontSize: '18px',
            cursor: 'pointer',
            padding: '5px'
          }}
        >
          ✕
        </button>
      </div>

      {targets.length === 0 ? (
        <div style={{ textAlign: 'center', color: '#888', fontStyle: 'italic' }}>
          No navigation targets available
        </div>
      ) : (
        <div>
          {targets.map((target, index) => (
            <div
              key={target.id}
              onClick={() => handleNavigate(target.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                padding: '10px',
                margin: '5px 0',
                backgroundColor: index % 2 === 0 ? 'rgba(255, 255, 255, 0.05)' : 'transparent',
                borderRadius: '4px',
                cursor: 'pointer',
                border: '1px solid transparent',
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'rgba(74, 144, 226, 0.2)';
                e.currentTarget.style.borderColor = '#4a90e2';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = index % 2 === 0 ? 'rgba(255, 255, 255, 0.05)' : 'transparent';
                e.currentTarget.style.borderColor = 'transparent';
              }}
            >
              <div style={{ fontSize: '20px', marginRight: '10px', minWidth: '30px' }}>
                {getTargetIcon(target.type)}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 'bold', marginBottom: '2px' }}>
                  {target.name}
                </div>
                <div style={{ fontSize: '12px', color: '#aaa', textTransform: 'capitalize' }}>
                  {target.type}
                </div>
              </div>
              <div style={{ textAlign: 'right', fontSize: '12px', color: '#ccc' }}>
                <div>{formatDistance(target.distance)}</div>
                <div style={{ color: '#4a90e2' }}>{formatTime(target.estimatedTravelTime)}</div>
              </div>
            </div>
          ))}
        </div>
      )}

      <div style={{
        marginTop: '15px',
        paddingTop: '10px',
        borderTop: '1px solid #333',
        fontSize: '12px',
        color: '#888',
        textAlign: 'center'
      }}>
        Click a target to navigate • Press ESC to close
      </div>
    </div>
  );
};

export default NavigationPanel;