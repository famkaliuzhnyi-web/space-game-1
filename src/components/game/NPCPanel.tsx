import React, { useState, useEffect } from 'react';
import { NPCShip, NPCConversation } from '../../types/npc';
import { NPCAIManager } from '../../systems/NPCAIManager';
import './NPCPanel.css';

interface NPCPanelProps {
  npcAIManager: NPCAIManager;
  currentSystemId: string;
  isVisible: boolean;
  onToggle: () => void;
  onNPCLocate?: (npc: NPCShip) => void;
}

export const NPCPanel: React.FC<NPCPanelProps> = ({ 
  npcAIManager, 
  currentSystemId, 
  isVisible, 
  onToggle,
  onNPCLocate
}) => {
  const [npcs, setNpcs] = useState<NPCShip[]>([]);
  const [activeConversation, setActiveConversation] = useState<NPCConversation | null>(null);
  const [selectedNPC, setSelectedNPC] = useState<NPCShip | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Refresh NPCs every few seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setRefreshTrigger(prev => prev + 1);
    }, 5000); // Refresh every 5 seconds

    return () => clearInterval(interval);
  }, []);

  // Update NPCs when system changes or refresh is triggered
  useEffect(() => {
    if (currentSystemId && npcAIManager) {
      const systemNPCs = npcAIManager.getNPCsInSystem(currentSystemId);
      setNpcs(systemNPCs);
      
      // Clear conversation if NPC is no longer in system
      if (activeConversation && !systemNPCs.find(npc => npc.id === activeConversation.npcId)) {
        setActiveConversation(null);
        setSelectedNPC(null);
      }
    }
  }, [currentSystemId, npcAIManager, refreshTrigger]);

  const startConversation = (npc: NPCShip) => {
    const conversation = npcAIManager.startConversation(npc.id);
    setActiveConversation(conversation);
    setSelectedNPC(npc);
  };

  const endConversation = () => {
    if (activeConversation) {
      npcAIManager.endConversation(activeConversation.npcId);
    }
    setActiveConversation(null);
    setSelectedNPC(null);
  };

  const getStatusText = (npc: NPCShip): string => {
    const goal = npc.ai.currentGoal;
    switch (goal.type) {
      case 'trade':
        return 'Trading';
      case 'patrol':
        return 'Patrolling';
      case 'pirate':
        return 'Hunting';
      case 'idle':
        return 'Idle';
      default:
        return 'Active';
    }
  };

  const getTypeIcon = (npc: NPCShip): string => {
    switch (npc.type) {
      case 'trader': return '💼';
      case 'pirate': return '☠️';
      case 'patrol': return '🛡️';
      case 'civilian': return '👤';
      case 'transport': return '📦';
      default: return '🚀';
    }
  };

  const getReputationColor = (reputation: number): string => {
    if (reputation > 30) return '#4ade80'; // green-400
    if (reputation > 10) return '#84cc16'; // lime-500  
    if (reputation > -10) return '#f59e0b'; // amber-500
    if (reputation > -30) return '#f97316'; // orange-500
    return '#ef4444'; // red-500
  };

  const getCurrentDialogueNode = () => {
    if (!activeConversation) return null;
    return activeConversation.dialogue.find(node => node.id === activeConversation.currentNodeId);
  };

  const handleChoice = (nextNodeId: string) => {
    if (!activeConversation) return;
    
    // Update conversation state
    setActiveConversation(prev => prev ? {
      ...prev,
      currentNodeId: nextNodeId
    } : null);

    // If conversation ended, close it
    if (nextNodeId === 'end') {
      setTimeout(() => {
        endConversation();
      }, 2000);
    }
  };

  if (!isVisible) {
    return (
      <button 
        className="npc-toggle-button"
        onClick={onToggle}
        title="NPCs (N)"
      >
        👥 NPCs ({npcs.length})
      </button>
    );
  }

  return (
    <div className="npc-panel">
      <div className="npc-panel-header">
        <h3>NPCs in System</h3>
        <button className="close-button" onClick={onToggle}>✕</button>
      </div>

      {activeConversation ? (
        <div className="conversation-panel">
          <div className="conversation-header">
            <h4>Conversation with {selectedNPC?.name}</h4>
            <button className="end-conversation-button" onClick={endConversation}>
              End Conversation
            </button>
          </div>

          <div className="conversation-content">
            {(() => {
              const currentNode = getCurrentDialogueNode();
              if (!currentNode) return null;

              return (
                <div className="dialogue-node">
                  <div className={`dialogue-text ${currentNode.speakerType === 'npc' ? 'npc-text' : 'player-text'}`}>
                    <strong>{currentNode.speakerType === 'npc' ? selectedNPC?.name : 'You'}:</strong>
                    <p>{currentNode.text}</p>
                  </div>

                  {currentNode.choices && currentNode.choices.length > 0 && (
                    <div className="dialogue-choices">
                      {currentNode.choices.map(choice => (
                        <button
                          key={choice.id}
                          className="dialogue-choice"
                          onClick={() => handleChoice(choice.nextNodeId)}
                        >
                          {choice.text}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              );
            })()}
          </div>
        </div>
      ) : (
        <div className="npc-list">
          {npcs.length === 0 ? (
            <div className="no-npcs">
              <p>No NPCs detected in this system</p>
              <p className="hint">NPCs spawn and despawn dynamically</p>
            </div>
          ) : (
            npcs.map(npc => (
              <div key={npc.id} className="npc-card">
                <div className="npc-header">
                  <div className="npc-icon">{getTypeIcon(npc)}</div>
                  <div className="npc-info">
                    <div className="npc-name">{npc.name}</div>
                    <div className="npc-type">{npc.type.charAt(0).toUpperCase() + npc.type.slice(1)}</div>
                  </div>
                  <div className="npc-status">
                    <div className="status-text">{getStatusText(npc)}</div>
                    <div 
                      className="reputation-badge"
                      style={{ backgroundColor: getReputationColor(npc.reputation) }}
                      title={`Reputation: ${npc.reputation > 0 ? '+' : ''}${npc.reputation}`}
                    >
                      {npc.reputation > 0 ? '+' : ''}{npc.reputation}
                    </div>
                  </div>
                </div>

                <div className="npc-details">
                  <div className="detail-item">
                    <span className="detail-label">Faction:</span>
                    <span className="detail-value">{npc.faction}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Credits:</span>
                    <span className="detail-value">{npc.credits.toLocaleString()} CR</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Ship:</span>
                    <span className="detail-value">{npc.ship.class}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Condition:</span>
                    <span className="detail-value">{npc.ship.condition}%</span>
                  </div>
                </div>

                <div className="npc-actions">
                  <button 
                    className="interact-button"
                    onClick={() => startConversation(npc)}
                    disabled={activeConversation !== null}
                  >
                    💬 Talk
                  </button>
                  <button 
                    className="locate-button"
                    onClick={() => onNPCLocate?.(npc)}
                    title="Move camera to this NPC's location"
                  >
                    📍 Locate
                  </button>
                  {npc.type === 'trader' && (
                    <button 
                      className="trade-button"
                      disabled={true}
                      title="Trading with NPCs coming soon"
                    >
                      💰 Trade
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};

export default NPCPanel;