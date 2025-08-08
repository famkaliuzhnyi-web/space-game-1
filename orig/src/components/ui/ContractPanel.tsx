import React, { useState } from 'react';
import { TradeContract } from '../../types/economy';

interface ContractPanelProps {
  contracts: TradeContract[];
  playerContracts: TradeContract[];
  isVisible: boolean;
  onClose: () => void;
  onAcceptContract?: (contractId: string) => void;
  playerCredits?: number;
}

const ContractPanel: React.FC<ContractPanelProps> = ({
  contracts,
  playerContracts,
  isVisible,
  onClose,
  onAcceptContract,
  playerCredits = 0
}) => {
  const [selectedContract, setSelectedContract] = useState<TradeContract | null>(null);
  const [activeTab, setActiveTab] = useState<'available' | 'active'>('available');

  if (!isVisible) return null;

  const getContractTypeIcon = (type: string): string => {
    switch (type) {
      case 'delivery': return '📦';
      case 'transport': return '🚛';
      case 'bulk': return '🏗️';
      case 'purchase': return '💰';
      default: return '📋';
    }
  };

  const getContractStatusColor = (status: string): string => {
    switch (status) {
      case 'available': return '#27ae60';
      case 'accepted': return '#3498db';
      case 'in-progress': return '#f39c12';
      case 'completed': return '#2ecc71';
      case 'failed': return '#e74c3c';
      case 'expired': return '#95a5a6';
      default: return '#95a5a6';
    }
  };

  const formatTimeRemaining = (deadline: number): string => {
    const timeLeft = deadline - Date.now();
    if (timeLeft <= 0) return 'Expired';
    
    const hours = Math.floor(timeLeft / 3600000);
    const minutes = Math.floor((timeLeft % 3600000) / 60000);
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  const getSecurityLevelColor = (level: number): string => {
    if (level >= 8) return '#27ae60'; // High security - green
    if (level >= 5) return '#f39c12'; // Medium security - orange
    return '#e74c3c'; // Low security - red
  };

  const handleAcceptContract = (contract: TradeContract) => {
    if (onAcceptContract) {
      onAcceptContract(contract.id);
      // Optimistically move contract to active tab
      setActiveTab('active');
    }
  };

  const displayContracts = activeTab === 'available' ? contracts : playerContracts;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.8)',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 1000,
      padding: '20px'
    }}>
      <div style={{
        backgroundColor: '#1e1e1e',
        borderRadius: '8px',
        padding: '20px',
        maxWidth: '1200px',
        width: '100%',
        maxHeight: '90vh',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        border: '2px solid #444'
      }}>
        {/* Header */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '20px',
          borderBottom: '1px solid #444',
          paddingBottom: '10px'
        }}>
          <h2 style={{ margin: 0, color: '#fff', fontSize: '1.5rem' }}>
            📋 Mission Contracts
          </h2>
          <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
            <span style={{ color: '#4a90e2', fontSize: '1rem' }}>
              💰 {playerCredits.toLocaleString()} credits
            </span>
            <button
              onClick={onClose}
              style={{
                background: 'none',
                border: 'none',
                color: '#fff',
                fontSize: '1.5rem',
                cursor: 'pointer',
                padding: '5px'
              }}
            >
              ✕
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div style={{ 
          display: 'flex', 
          marginBottom: '20px',
          borderBottom: '1px solid #444'
        }}>
          <button
            onClick={() => setActiveTab('available')}
            style={{
              padding: '10px 20px',
              backgroundColor: activeTab === 'available' ? '#3498db' : 'transparent',
              color: '#fff',
              border: 'none',
              borderRadius: '4px 4px 0 0',
              cursor: 'pointer',
              fontSize: '1rem',
              marginRight: '5px'
            }}
          >
            Available Contracts ({contracts.length})
          </button>
          <button
            onClick={() => setActiveTab('active')}
            style={{
              padding: '10px 20px',
              backgroundColor: activeTab === 'active' ? '#3498db' : 'transparent',
              color: '#fff',
              border: 'none',
              borderRadius: '4px 4px 0 0',
              cursor: 'pointer',
              fontSize: '1rem'
            }}
          >
            My Contracts ({playerContracts.length})
          </button>
        </div>

        <div style={{ display: 'flex', gap: '20px', flex: 1, minHeight: 0 }}>
          {/* Contract List */}
          <div style={{
            flex: 2,
            border: '1px solid #444',
            borderRadius: '4px',
            overflow: 'hidden'
          }}>
            <div style={{
              backgroundColor: '#333',
              padding: '10px',
              borderBottom: '1px solid #444',
              fontWeight: 'bold',
              color: '#fff',
              fontSize: '0.9rem'
            }}>
              {activeTab === 'available' ? 'Available Missions' : 'Active Missions'}
            </div>
            
            <div style={{ height: '500px', overflowY: 'auto' }}>
              {displayContracts.length === 0 ? (
                <div style={{
                  padding: '40px',
                  textAlign: 'center',
                  color: '#888',
                  fontSize: '1.1rem'
                }}>
                  {activeTab === 'available' 
                    ? 'No contracts available at this time' 
                    : 'No active contracts'}
                </div>
              ) : (
                displayContracts.map((contract) => (
                  <div
                    key={contract.id}
                    onClick={() => setSelectedContract(contract)}
                    style={{
                      padding: '15px',
                      backgroundColor: selectedContract?.id === contract.id ? '#444' : '#2a2a2a',
                      borderBottom: '1px solid #333',
                      cursor: 'pointer',
                      transition: 'background-color 0.2s ease'
                    }}
                    onMouseEnter={(e) => {
                      if (selectedContract?.id !== contract.id) {
                        (e.currentTarget as HTMLElement).style.backgroundColor = '#333';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (selectedContract?.id !== contract.id) {
                        (e.currentTarget as HTMLElement).style.backgroundColor = '#2a2a2a';
                      }
                    }}
                  >
                    <div style={{ 
                      display: 'flex', 
                      justifyContent: 'space-between',
                      alignItems: 'flex-start',
                      marginBottom: '8px'
                    }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ 
                          color: '#fff', 
                          fontWeight: 'bold',
                          fontSize: '1rem',
                          marginBottom: '4px'
                        }}>
                          {getContractTypeIcon(contract.type)} {contract.title}
                        </div>
                        <div style={{ color: '#888', fontSize: '0.8rem' }}>
                          {contract.issuer}
                        </div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ 
                          color: '#27ae60', 
                          fontWeight: 'bold',
                          fontSize: '1rem'
                        }}>
                          {contract.baseReward.toLocaleString()} cr
                        </div>
                        <div style={{ 
                          color: getContractStatusColor(contract.status),
                          fontSize: '0.8rem',
                          textTransform: 'capitalize'
                        }}>
                          {contract.status}
                        </div>
                      </div>
                    </div>
                    
                    <div style={{ 
                      display: 'grid', 
                      gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
                      gap: '10px',
                      fontSize: '0.8rem',
                      color: '#ccc'
                    }}>
                      <div>
                        <strong>Cargo:</strong> {contract.quantity} units
                      </div>
                      <div>
                        <strong>Route:</strong> {contract.origin} → {contract.destination}
                      </div>
                      <div>
                        <strong>Time:</strong> {formatTimeRemaining(contract.deadline)}
                      </div>
                      {contract.securityClearance && (
                        <div>
                          <strong>Security:</strong> 
                          <span style={{ color: getSecurityLevelColor(contract.securityClearance) }}>
                            {contract.securityClearance}/10
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Contract Details */}
          {selectedContract && (
            <div style={{
              flex: 1,
              border: '1px solid #444',
              borderRadius: '4px',
              padding: '15px',
              backgroundColor: '#2a2a2a',
              display: 'flex',
              flexDirection: 'column'
            }}>
              <h3 style={{ 
                margin: '0 0 15px 0', 
                color: '#fff',
                fontSize: '1.2rem'
              }}>
                {getContractTypeIcon(selectedContract.type)} {selectedContract.title}
              </h3>
              
              <div style={{ marginBottom: '15px', fontSize: '0.9rem', color: '#ccc' }}>
                <p style={{ margin: '0 0 15px 0', lineHeight: '1.4' }}>
                  {selectedContract.description}
                </p>
                
                <div style={{ 
                  display: 'grid', 
                  gridTemplateColumns: '1fr 1fr', 
                  gap: '10px',
                  marginBottom: '15px'
                }}>
                  <div><strong>Type:</strong> {selectedContract.type}</div>
                  <div><strong>Issuer:</strong> {selectedContract.issuer}</div>
                  <div><strong>Commodity:</strong> {selectedContract.commodity}</div>
                  <div><strong>Quantity:</strong> {selectedContract.quantity} units</div>
                  <div><strong>Value:</strong> {selectedContract.totalValue.toLocaleString()} cr</div>
                  <div><strong>Cargo Space:</strong> {selectedContract.minimumCargoCapacity} units</div>
                </div>

                <div style={{ 
                  padding: '10px',
                  backgroundColor: '#333',
                  borderRadius: '4px',
                  marginBottom: '15px'
                }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                    <div>
                      <strong>Origin:</strong> {selectedContract.origin}
                    </div>
                    <div>
                      <strong>Destination:</strong> {selectedContract.destination}
                    </div>
                    <div>
                      <strong>Time Limit:</strong> {selectedContract.timeLimit} hours
                    </div>
                    <div>
                      <strong>Time Remaining:</strong> 
                      <span style={{ 
                        color: formatTimeRemaining(selectedContract.deadline) === 'Expired' ? '#e74c3c' : '#27ae60'
                      }}>
                        {formatTimeRemaining(selectedContract.deadline)}
                      </span>
                    </div>
                  </div>
                </div>

                <div style={{ 
                  padding: '10px',
                  backgroundColor: '#333',
                  borderRadius: '4px',
                  marginBottom: '15px'
                }}>
                  <div style={{ marginBottom: '10px' }}>
                    <strong>Rewards:</strong>
                  </div>
                  <div style={{ fontSize: '0.8rem' }}>
                    <div>Base Reward: <span style={{ color: '#27ae60' }}>{selectedContract.baseReward.toLocaleString()} credits</span></div>
                    {selectedContract.bonusReward && (
                      <div>Time Bonus: <span style={{ color: '#f39c12' }}>{selectedContract.bonusReward.toLocaleString()} credits</span></div>
                    )}
                    {selectedContract.reputationReward && (
                      <div>Reputation: <span style={{ color: '#3498db' }}>+{selectedContract.reputationReward.amount} {selectedContract.reputationReward.faction}</span></div>
                    )}
                  </div>
                </div>

                {selectedContract.securityClearance && (
                  <div style={{ 
                    padding: '8px',
                    backgroundColor: '#444',
                    borderRadius: '4px',
                    marginBottom: '15px',
                    fontSize: '0.8rem'
                  }}>
                    <strong>⚠️ Security Clearance Required:</strong> Level {selectedContract.securityClearance}/10
                  </div>
                )}
              </div>

              {activeTab === 'available' && selectedContract.status === 'available' && (
                <div style={{ marginTop: 'auto' }}>
                  <button
                    onClick={() => handleAcceptContract(selectedContract)}
                    disabled={formatTimeRemaining(selectedContract.deadline) === 'Expired'}
                    style={{
                      width: '100%',
                      padding: '12px',
                      backgroundColor: formatTimeRemaining(selectedContract.deadline) === 'Expired' ? '#555' : '#27ae60',
                      color: '#fff',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: formatTimeRemaining(selectedContract.deadline) === 'Expired' ? 'not-allowed' : 'pointer',
                      fontSize: '1rem',
                      fontWeight: 'bold'
                    }}
                  >
                    {formatTimeRemaining(selectedContract.deadline) === 'Expired' 
                      ? 'Contract Expired' 
                      : '✅ Accept Contract'}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ContractPanel;