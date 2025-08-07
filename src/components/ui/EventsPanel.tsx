import React from 'react';
import { GameEvent, EventPriority } from '../../types/events';

interface EventsPanelProps {
  events: GameEvent[];
  onEventChoice: (eventId: string, choiceId: string) => void;
  onClose: () => void;
}

const EventsPanel: React.FC<EventsPanelProps> = ({ events, onEventChoice, onClose }) => {
  const getPriorityColor = (priority: EventPriority): string => {
    switch (priority) {
      case 'critical': return '#ff4444';
      case 'high': return '#ff8844';
      case 'normal': return '#44ff88';
      case 'low': return '#88ccff';
      default: return '#cccccc';
    }
  };

  const getPriorityIcon = (priority: EventPriority): string => {
    switch (priority) {
      case 'critical': return '🚨';
      case 'high': return '⚠️';
      case 'normal': return '📢';
      case 'low': return 'ℹ️';
      default: return '📋';
    }
  };

  const getEventTypeIcon = (type: string): string => {
    switch (type) {
      case 'space_encounter': return '🚀';
      case 'station_event': return '🏪';
      case 'system_crisis': return '⚡';
      case 'emergency_contract': return '🆘';
      case 'social_interaction': return '👥';
      case 'discovery': return '🔍';
      default: return '📋';
    }
  };

  const formatTimeRemaining = (expiryTime?: number): string => {
    if (!expiryTime) return '';
    
    const now = Date.now();
    const remaining = expiryTime - now;
    
    if (remaining <= 0) return 'EXPIRED';
    
    const minutes = Math.floor(remaining / 60000);
    const seconds = Math.floor((remaining % 60000) / 1000);
    
    if (minutes > 0) {
      return `${minutes}m ${seconds}s remaining`;
    }
    return `${seconds}s remaining`;
  };

  if (events.length === 0) {
    return (
      <div style={{
        position: 'fixed',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        backgroundColor: '#1a1a1a',
        border: '2px solid #333',
        borderRadius: '8px',
        padding: '20px',
        minWidth: '400px',
        maxHeight: '80vh',
        overflow: 'auto',
        zIndex: 1000,
        color: '#fff'
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '20px',
          borderBottom: '1px solid #333',
          paddingBottom: '10px'
        }}>
          <h3 style={{ margin: 0, color: '#4a9' }}>📡 Active Events</h3>
          <button 
            onClick={onClose}
            style={{
              backgroundColor: 'transparent',
              border: 'none',
              color: '#fff',
              fontSize: '20px',
              cursor: 'pointer'
            }}
          >
            ✕
          </button>
        </div>
        
        <div style={{
          textAlign: 'center',
          padding: '40px 20px',
          color: '#888'
        }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>🌌</div>
          <p>No active events at this time.</p>
          <p style={{ fontSize: '14px' }}>Events will appear here as you explore the galaxy.</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      position: 'fixed',
      top: '50%',
      left: '50%',
      transform: 'translate(-50%, -50%)',
      backgroundColor: '#1a1a1a',
      border: '2px solid #333',
      borderRadius: '8px',
      padding: '20px',
      minWidth: '500px',
      maxWidth: '800px',
      maxHeight: '80vh',
      overflow: 'auto',
      zIndex: 1000,
      color: '#fff'
    }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '20px',
        borderBottom: '1px solid #333',
        paddingBottom: '10px'
      }}>
        <h3 style={{ margin: 0, color: '#4a9' }}>📡 Active Events ({events.length})</h3>
        <button 
          onClick={onClose}
          style={{
            backgroundColor: 'transparent',
            border: 'none',
            color: '#fff',
            fontSize: '20px',
            cursor: 'pointer'
          }}
        >
          ✕
        </button>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {events.map((event) => (
          <div 
            key={event.id}
            style={{
              border: `2px solid ${getPriorityColor(event.priority)}`,
              borderRadius: '8px',
              padding: '16px',
              backgroundColor: '#0f0f0f'
            }}
          >
            {/* Event Header */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-start',
              marginBottom: '12px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '24px' }}>{getEventTypeIcon(event.type)}</span>
                <div>
                  <h4 style={{ 
                    margin: 0, 
                    color: '#fff',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}>
                    {event.title}
                    <span style={{ fontSize: '16px' }}>{getPriorityIcon(event.priority)}</span>
                  </h4>
                  <p style={{ 
                    margin: '4px 0 0 0', 
                    fontSize: '12px', 
                    color: '#888',
                    textTransform: 'capitalize'
                  }}>
                    {event.type.replace('_', ' ')} • {event.priority} Priority
                  </p>
                </div>
              </div>
              
              {event.expiryTime && (
                <div style={{
                  fontSize: '12px',
                  color: event.expiryTime - Date.now() < 300000 ? '#ff4444' : '#ffaa44',
                  textAlign: 'right'
                }}>
                  {formatTimeRemaining(event.expiryTime)}
                </div>
              )}
            </div>

            {/* Event Description */}
            <p style={{ 
              margin: '0 0 16px 0', 
              color: '#ccc',
              lineHeight: '1.4'
            }}>
              {event.description}
            </p>

            {/* Location Info */}
            {event.locationId && (
              <div style={{
                fontSize: '12px',
                color: '#888',
                marginBottom: '12px'
              }}>
                📍 Location: {event.locationId}
              </div>
            )}

            {/* Event Choices */}
            {event.status === 'active' || event.status === 'pending' ? (
              <div style={{
                display: 'flex',
                gap: '8px',
                flexWrap: 'wrap'
              }}>
                {event.choices.map((choice) => (
                  <button
                    key={choice.id}
                    onClick={() => onEventChoice(event.id, choice.id)}
                    style={{
                      backgroundColor: '#333',
                      border: '1px solid #555',
                      borderRadius: '4px',
                      padding: '8px 12px',
                      color: '#fff',
                      cursor: 'pointer',
                      fontSize: '14px',
                      transition: 'background-color 0.2s'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = '#444';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = '#333';
                    }}
                    title={choice.description}
                  >
                    {choice.text}
                  </button>
                ))}
              </div>
            ) : (
              <div style={{
                fontSize: '12px',
                color: '#888',
                fontStyle: 'italic'
              }}>
                Event {event.status}
                {event.selectedChoice && ` • Chose: ${event.choices.find(c => c.id === event.selectedChoice)?.text}`}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default EventsPanel;