import React from 'react';
import { FactionReputation } from '../../types/player';
import { FactionInfo, FactionManager } from '../../systems/FactionManager';
import Modal from './Modal';

interface FactionReputationPanelProps {
  isVisible: boolean;
  onClose: () => void;
  playerReputation: Map<string, FactionReputation>;
  factionManager?: FactionManager;
}

const FactionReputationPanel: React.FC<FactionReputationPanelProps> = ({
  isVisible,
  onClose,
  playerReputation,
  factionManager
}) => {
  if (!isVisible || !factionManager) return null;

  const factions = factionManager.getFactions();

  const getReputationColor = (standing: number): string => {
    if (standing >= 60) return '#4ade80'; // green - ally+
    if (standing >= 20) return '#22c55e'; // lighter green - friend+
    if (standing >= 5) return '#84cc16'; // lime - liked
    if (standing >= -5) return '#a3a3a3'; // gray - neutral
    if (standing >= -20) return '#facc15'; // yellow - disliked
    if (standing >= -40) return '#fb923c'; // orange - enemy
    return '#ef4444'; // red - hostile+
  };

  const getProgressWidth = (standing: number): number => {
    return Math.max(5, ((standing + 100) / 200) * 100); // Convert -100 to 100 range to 0-100%
  };

  const formatStanding = (standing: number): string => {
    return standing > 0 ? `+${standing}` : `${standing}`;
  };

  const renderFactionCard = (faction: FactionInfo) => {
    const reputation = playerReputation.get(faction.id);
    if (!reputation) return null;

    const benefits = factionManager.getFactionBenefits(reputation.standing);
    const progressWidth = getProgressWidth(reputation.standing);
    const reputationColor = getReputationColor(reputation.standing);

    return (
      <div
        key={faction.id}
        style={{
          backgroundColor: '#1f2937',
          border: `2px solid ${faction.colors.primary}20`,
          borderRadius: '12px',
          padding: '20px',
          marginBottom: '15px'
        }}
      >
        {/* Faction Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
          <div>
            <h3 style={{ 
              color: faction.colors.primary, 
              margin: '0 0 5px 0',
              fontSize: '18px',
              fontWeight: 'bold'
            }}>
              {faction.name}
            </h3>
            <p style={{ 
              color: '#9ca3af', 
              margin: 0, 
              fontSize: '14px',
              lineHeight: '1.4'
            }}>
              {faction.description}
            </p>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ 
              color: reputationColor, 
              fontSize: '24px', 
              fontWeight: 'bold',
              marginBottom: '2px'
            }}>
              {formatStanding(reputation.standing)}
            </div>
            <div style={{ 
              color: reputationColor, 
              fontSize: '14px',
              fontWeight: '600'
            }}>
              {reputation.rank}
            </div>
          </div>
        </div>

        {/* Reputation Progress Bar */}
        <div style={{ marginBottom: '15px' }}>
          <div style={{
            width: '100%',
            height: '8px',
            backgroundColor: '#374151',
            borderRadius: '4px',
            overflow: 'hidden',
            position: 'relative'
          }}>
            <div style={{
              width: `${progressWidth}%`,
              height: '100%',
              backgroundColor: reputationColor,
              transition: 'width 0.3s ease-in-out'
            }} />
            {/* Neutral marker */}
            <div style={{
              position: 'absolute',
              left: '50%',
              top: '0',
              width: '2px',
              height: '100%',
              backgroundColor: '#6b7280',
              transform: 'translateX(-50%)'
            }} />
          </div>
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            fontSize: '11px', 
            color: '#9ca3af',
            marginTop: '4px'
          }}>
            <span>Hostile</span>
            <span>Neutral</span>
            <span>Allied</span>
          </div>
        </div>

        {/* Stats */}
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', 
          gap: '10px',
          marginBottom: '15px'
        }}>
          <div style={{ textAlign: 'center', padding: '8px', backgroundColor: '#374151', borderRadius: '6px' }}>
            <div style={{ color: '#9ca3af', fontSize: '12px' }}>Missions</div>
            <div style={{ color: '#f3f4f6', fontSize: '16px', fontWeight: 'bold' }}>{reputation.missions}</div>
          </div>
          {benefits.tradingDiscount > 0 && (
            <div style={{ textAlign: 'center', padding: '8px', backgroundColor: '#065f46', borderRadius: '6px' }}>
              <div style={{ color: '#6ee7b7', fontSize: '12px' }}>Trade Discount</div>
              <div style={{ color: '#10b981', fontSize: '16px', fontWeight: 'bold' }}>{benefits.tradingDiscount}%</div>
            </div>
          )}
          {benefits.serviceDiscount > 0 && (
            <div style={{ textAlign: 'center', padding: '8px', backgroundColor: '#1e3a8a', borderRadius: '6px' }}>
              <div style={{ color: '#93c5fd', fontSize: '12px' }}>Service Discount</div>
              <div style={{ color: '#3b82f6', fontSize: '16px', fontWeight: 'bold' }}>{benefits.serviceDiscount}%</div>
            </div>
          )}
        </div>

        {/* Benefits */}
        {(benefits.contractAccess.length > 0 || benefits.equipmentAccess.length > 0) && (
          <div>
            <h4 style={{ color: '#d1d5db', fontSize: '14px', margin: '0 0 8px 0' }}>Special Access:</h4>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
              {benefits.contractAccess.map(access => (
                <span
                  key={access}
                  style={{
                    backgroundColor: '#7c3aed',
                    color: '#e0e7ff',
                    padding: '4px 8px',
                    borderRadius: '12px',
                    fontSize: '11px',
                    fontWeight: '500'
                  }}
                >
                  📋 {access.replace('-', ' ')}
                </span>
              ))}
              {benefits.equipmentAccess.map(access => (
                <span
                  key={access}
                  style={{
                    backgroundColor: '#dc2626',
                    color: '#fecaca',
                    padding: '4px 8px',
                    borderRadius: '12px',
                    fontSize: '11px',
                    fontWeight: '500'
                  }}
                >
                  ⚙️ {access.replace('-', ' ')}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <Modal isOpen={isVisible} onClose={onClose} size="large">
      <div style={{ 
        backgroundColor: '#111827', 
        borderRadius: '8px', 
        border: '1px solid #374151',
        maxHeight: '85vh',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column'
      }}>
        {/* Header */}
        <div style={{ 
          padding: '20px', 
          borderBottom: '1px solid #374151',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <h2 style={{ color: '#f3f4f6', margin: 0, display: 'flex', alignItems: 'center', gap: '10px' }}>
            🤝 Faction Reputation
          </h2>
          <button 
            onClick={onClose}
            style={{ 
              background: 'none', 
              border: 'none', 
              color: '#9ca3af', 
              fontSize: '18px', 
              cursor: 'pointer',
              padding: '4px 8px'
            }}
          >
            ✕
          </button>
        </div>

        {/* Tabs */}
        <div style={{ 
          display: 'flex', 
          borderBottom: '1px solid #374151',
          backgroundColor: '#1f2937'
        }}>
          <div style={{
            padding: '15px 20px',
            backgroundColor: '#374151',
            color: '#f3f4f6',
            borderBottom: '2px solid #60a5fa',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <span>🏛️</span>
            Factions
          </div>
          <div style={{
            padding: '15px 20px',
            color: '#9ca3af',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <span>📜</span>
            Recent Activity
          </div>
        </div>

        {/* Content */}
        <div style={{ 
          flex: 1, 
          overflow: 'auto',
          padding: '20px'
        }}>
          <div style={{ marginBottom: '20px' }}>
            <p style={{ color: '#9ca3af', margin: '0 0 20px 0', lineHeight: '1.6' }}>
              Your standing with the major factions affects trade prices, contract availability, 
              and access to special equipment. Complete missions and trade to improve relationships.
            </p>
          </div>

          {/* Faction Cards */}
          {factions.map(renderFactionCard)}
        </div>
      </div>
    </Modal>
  );
};

export default FactionReputationPanel;