import React, { useState } from 'react';
import { FactionReputation } from '../../types/player';
import { FactionInfo, FactionManager } from '../../systems/FactionManager';
import { Contact } from '../../types/contacts';
import Modal from './Modal';

interface FactionReputationPanelProps {
  isVisible: boolean;
  onClose: () => void;
  playerReputation: Map<string, FactionReputation>;
  factionManager?: FactionManager;
  playerCredits?: number;
}

const FactionReputationPanel: React.FC<FactionReputationPanelProps> = ({
  isVisible,
  onClose,
  playerReputation,
  factionManager,
  playerCredits = 0
}) => {
  const [activeTab, setActiveTab] = useState<'factions' | 'contacts' | 'history'>('factions');

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

  const renderContactCard = (contact: Contact) => {
    const availableServices = factionManager.getContactManager().getAvailableServices(
      contact.id, 
      playerReputation, 
      playerCredits
    );
    const recentInteractions = factionManager.getContactManager().getRecentInteractions(contact.id, 3);

    return (
      <div
        key={contact.id}
        style={{
          backgroundColor: '#1f2937',
          border: '1px solid #374151',
          borderRadius: '12px',
          padding: '16px',
          marginBottom: '12px'
        }}
      >
        {/* Contact Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
          <div style={{ flex: 1 }}>
            <h4 style={{ 
              color: '#f3f4f6', 
              margin: '0 0 4px 0',
              fontSize: '16px',
              fontWeight: 'bold'
            }}>
              {contact.name}
            </h4>
            <p style={{ 
              color: '#9ca3af', 
              margin: '0 0 8px 0', 
              fontSize: '13px'
            }}>
              {contact.role.name} • {factionManager.getFaction(contact.factionId)?.name}
            </p>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '8px' }}>
              {contact.specialties.map(specialty => (
                <span
                  key={specialty}
                  style={{
                    backgroundColor: '#374151',
                    color: '#d1d5db',
                    padding: '2px 6px',
                    borderRadius: '8px',
                    fontSize: '11px'
                  }}
                >
                  {specialty}
                </span>
              ))}
            </div>
          </div>
          <div style={{ textAlign: 'right', minWidth: '80px' }}>
            <div style={{ 
              color: getTrustColor(contact.trustLevel), 
              fontSize: '18px', 
              fontWeight: 'bold',
              marginBottom: '2px'
            }}>
              {contact.trustLevel}
            </div>
            <div style={{ 
              color: getTrustColor(contact.trustLevel), 
              fontSize: '12px',
              fontWeight: '600'
            }}>
              {contact.relationship.name}
            </div>
          </div>
        </div>

        {/* Trust Progress Bar */}
        <div style={{ marginBottom: '12px' }}>
          <div style={{
            width: '100%',
            height: '6px',
            backgroundColor: '#374151',
            borderRadius: '3px',
            overflow: 'hidden'
          }}>
            <div style={{
              width: `${contact.trustLevel}%`,
              height: '100%',
              backgroundColor: getTrustColor(contact.trustLevel),
              transition: 'width 0.3s ease-in-out'
            }} />
          </div>
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            fontSize: '10px', 
            color: '#6b7280',
            marginTop: '2px'
          }}>
            <span>0</span>
            <span>Trust Level</span>
            <span>100</span>
          </div>
        </div>

        {/* Stats Row */}
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(60px, 1fr))', 
          gap: '8px',
          marginBottom: '12px',
          fontSize: '11px'
        }}>
          <div style={{ textAlign: 'center', padding: '6px', backgroundColor: '#374151', borderRadius: '4px' }}>
            <div style={{ color: '#9ca3af' }}>Interactions</div>
            <div style={{ color: '#f3f4f6', fontWeight: 'bold' }}>{contact.interactionCount}</div>
          </div>
          <div style={{ textAlign: 'center', padding: '6px', backgroundColor: '#374151', borderRadius: '4px' }}>
            <div style={{ color: '#9ca3af' }}>Services</div>
            <div style={{ color: '#f3f4f6', fontWeight: 'bold' }}>{availableServices.length}</div>
          </div>
          <div style={{ textAlign: 'center', padding: '6px', backgroundColor: '#374151', borderRadius: '4px' }}>
            <div style={{ color: '#9ca3af' }}>Influence</div>
            <div style={{ color: '#f3f4f6', fontWeight: 'bold' }}>{contact.role.influence}/10</div>
          </div>
        </div>

        {/* Personality Traits */}
        {contact.personalityTraits.length > 0 && (
          <div style={{ marginBottom: '12px' }}>
            <div style={{ color: '#d1d5db', fontSize: '12px', marginBottom: '4px', fontWeight: '600' }}>Personality:</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
              {contact.personalityTraits.map(trait => (
                <span
                  key={trait.id}
                  style={{
                    backgroundColor: trait.interactionModifier > 0 ? '#065f46' : '#7f1d1d',
                    color: trait.interactionModifier > 0 ? '#10b981' : '#ef4444',
                    padding: '2px 6px',
                    borderRadius: '8px',
                    fontSize: '10px',
                    fontWeight: '500'
                  }}
                >
                  {trait.name} ({trait.interactionModifier > 0 ? '+' : ''}{Math.round(trait.interactionModifier * 100)}%)
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Available Services */}
        {availableServices.length > 0 && (
          <div style={{ marginBottom: '12px' }}>
            <div style={{ color: '#d1d5db', fontSize: '12px', marginBottom: '6px', fontWeight: '600' }}>Available Services:</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              {availableServices.slice(0, 3).map(service => (
                <div
                  key={service.id}
                  style={{
                    backgroundColor: '#065f46',
                    color: '#6ee7b7',
                    padding: '4px 8px',
                    borderRadius: '6px',
                    fontSize: '11px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}
                >
                  <span>{service.name}</span>
                  <span>{service.cost.toLocaleString()} CR</span>
                </div>
              ))}
              {availableServices.length > 3 && (
                <div style={{ 
                  color: '#9ca3af', 
                  fontSize: '10px', 
                  textAlign: 'center' 
                }}>
                  +{availableServices.length - 3} more services
                </div>
              )}
            </div>
          </div>
        )}

        {/* Recent Interactions */}
        {recentInteractions.length > 0 && (
          <div>
            <div style={{ color: '#d1d5db', fontSize: '12px', marginBottom: '6px', fontWeight: '600' }}>Recent Activity:</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
              {recentInteractions.slice(0, 2).map((interaction, index) => (
                <div
                  key={index}
                  style={{
                    fontSize: '10px',
                    color: '#9ca3af',
                    display: 'flex',
                    justifyContent: 'space-between'
                  }}
                >
                  <span>
                    {interaction.type.replace('_', ' ')} ({interaction.outcome})
                  </span>
                  <span style={{ 
                    color: interaction.trustChange > 0 ? '#10b981' : '#ef4444' 
                  }}>
                    {interaction.trustChange > 0 ? '+' : ''}{interaction.trustChange}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  const getTrustColor = (trustLevel: number): string => {
    if (trustLevel >= 80) return '#10b981'; // green - friend+
    if (trustLevel >= 60) return '#22c55e'; // lighter green - ally
    if (trustLevel >= 40) return '#84cc16'; // lime - associate
    if (trustLevel >= 20) return '#eab308'; // yellow - acquaintance
    if (trustLevel >= 10) return '#a3a3a3'; // gray - neutral
    return '#ef4444'; // red - low trust
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
          <div 
            onClick={() => setActiveTab('factions')}
            style={{
              padding: '15px 20px',
              backgroundColor: activeTab === 'factions' ? '#374151' : 'transparent',
              color: activeTab === 'factions' ? '#f3f4f6' : '#9ca3af',
              borderBottom: activeTab === 'factions' ? '2px solid #60a5fa' : '2px solid transparent',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            <span>🏛️</span>
            Factions
          </div>
          <div 
            onClick={() => setActiveTab('contacts')}
            style={{
              padding: '15px 20px',
              backgroundColor: activeTab === 'contacts' ? '#374151' : 'transparent',
              color: activeTab === 'contacts' ? '#f3f4f6' : '#9ca3af',
              borderBottom: activeTab === 'contacts' ? '2px solid #60a5fa' : '2px solid transparent',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            <span>👥</span>
            Contacts ({factionManager.getContactManager().getContactsByRelationship().length})
          </div>
          <div 
            onClick={() => setActiveTab('history')}
            style={{
              padding: '15px 20px',
              backgroundColor: activeTab === 'history' ? '#374151' : 'transparent',
              color: activeTab === 'history' ? '#f3f4f6' : '#9ca3af',
              borderBottom: activeTab === 'history' ? '2px solid #60a5fa' : '2px solid transparent',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
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
          {activeTab === 'factions' && (
            <>
              <div style={{ marginBottom: '20px' }}>
                <p style={{ color: '#9ca3af', margin: '0 0 20px 0', lineHeight: '1.6' }}>
                  Your standing with the major factions affects trade prices, contract availability, 
                  and access to special equipment. Complete missions and trade to improve relationships.
                </p>
              </div>
              {/* Faction Cards */}
              {factions.map(renderFactionCard)}
            </>
          )}

          {activeTab === 'contacts' && (
            <>
              <div style={{ marginBottom: '20px' }}>
                <p style={{ color: '#9ca3af', margin: '0 0 20px 0', lineHeight: '1.6' }}>
                  Build personal relationships with individual contacts to access unique services, 
                  gain insider information, and unlock special opportunities.
                </p>
              </div>
              {/* Contact Cards */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {factionManager.getContactManager().getContactsByRelationship().length === 0 ? (
                  <div style={{ 
                    textAlign: 'center', 
                    color: '#6b7280', 
                    padding: '40px 20px',
                    backgroundColor: '#1f2937',
                    borderRadius: '12px',
                    border: '1px dashed #374151'
                  }}>
                    <div style={{ fontSize: '48px', marginBottom: '16px' }}>👋</div>
                    <h3 style={{ margin: '0 0 8px 0', color: '#9ca3af' }}>No Contacts Yet</h3>
                    <p style={{ margin: '0', fontSize: '14px' }}>
                      Visit stations and interact with NPCs to start building your contact network.
                    </p>
                  </div>
                ) : (
                  factionManager.getContactManager().getContactsByRelationship().map(renderContactCard)
                )}
              </div>
            </>
          )}

          {activeTab === 'history' && (
            <>
              <div style={{ marginBottom: '20px' }}>
                <p style={{ color: '#9ca3af', margin: '0 0 20px 0', lineHeight: '1.6' }}>
                  Recent reputation changes and significant interactions with factions and contacts.
                </p>
              </div>
              {/* Reputation History */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {factionManager.getReputationHistory(20).map((change, index) => {
                  const faction = factionManager.getFaction(change.factionId);
                  return (
                    <div
                      key={index}
                      style={{
                        backgroundColor: '#1f2937',
                        border: '1px solid #374151',
                        borderRadius: '8px',
                        padding: '12px',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center'
                      }}
                    >
                      <div>
                        <div style={{ 
                          color: '#f3f4f6', 
                          fontSize: '14px', 
                          fontWeight: '600',
                          marginBottom: '2px'
                        }}>
                          {faction?.name || 'Unknown Faction'}
                        </div>
                        <div style={{ color: '#9ca3af', fontSize: '12px' }}>
                          {change.reason} • {new Date(change.timestamp).toLocaleDateString()}
                        </div>
                      </div>
                      <div style={{
                        color: change.change > 0 ? '#10b981' : '#ef4444',
                        fontSize: '16px',
                        fontWeight: 'bold'
                      }}>
                        {change.change > 0 ? '+' : ''}{change.change}
                      </div>
                    </div>
                  );
                })}
                {factionManager.getReputationHistory().length === 0 && (
                  <div style={{ 
                    textAlign: 'center', 
                    color: '#6b7280', 
                    padding: '40px 20px',
                    backgroundColor: '#1f2937',
                    borderRadius: '12px',
                    border: '1px dashed #374151'
                  }}>
                    <div style={{ fontSize: '48px', marginBottom: '16px' }}>📜</div>
                    <h3 style={{ margin: '0 0 8px 0', color: '#9ca3af' }}>No History Yet</h3>
                    <p style={{ margin: '0', fontSize: '14px' }}>
                      Your reputation changes and interactions will appear here.
                    </p>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </Modal>
  );
};

export default FactionReputationPanel;