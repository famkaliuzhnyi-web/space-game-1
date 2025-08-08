import React, { useState, useCallback, useEffect } from 'react';
import { StoryQuest } from '../../types/quests';

interface QuestPanelProps {
  questManager: any; // Will be properly typed once integrated
  isVisible: boolean;
  onClose: () => void;
}

export const QuestPanel: React.FC<QuestPanelProps> = ({
  questManager,
  isVisible,
  onClose
}) => {
  const [activeTab, setActiveTab] = useState<'available' | 'active' | 'completed' | 'storylines'>('active');
  const [availableQuests, setAvailableQuests] = useState<StoryQuest[]>([]);
  const [activeQuests, setActiveQuests] = useState<StoryQuest[]>([]);
  const [completedQuests, setCompletedQuests] = useState<StoryQuest[]>([]);
  const [selectedQuest, setSelectedQuest] = useState<StoryQuest | null>(null);
  const [questCounts, setQuestCounts] = useState({ available: 0, active: 0, completed: 0 });

  // Refresh quest data
  const refreshQuestData = useCallback(() => {
    if (!questManager) return;

    try {
      const available = questManager.getAvailableQuests();
      const active = questManager.getActiveQuests();
      const completed = questManager.getCompletedQuests();

      setAvailableQuests(available);
      setActiveQuests(active);
      setCompletedQuests(completed);
      setQuestCounts({
        available: available.length,
        active: active.length,
        completed: completed.length
      });
    } catch (error) {
      console.error('Error refreshing quest data:', error);
    }
  }, [questManager]);

  useEffect(() => {
    if (isVisible) {
      refreshQuestData();
    }
  }, [isVisible, refreshQuestData]);

  // Handle quest start
  const handleStartQuest = useCallback((questId: string) => {
    if (!questManager) return;

    try {
      const success = questManager.startQuest(questId);
      if (success) {
        refreshQuestData();
        setSelectedQuest(null);
        setActiveTab('active');
      }
    } catch (error) {
      console.error('Error starting quest:', error);
    }
  }, [questManager, refreshQuestData]);

  // Get priority color
  const getPriorityColor = (priority: number): string => {
    if (priority >= 8) return '#F44336'; // High priority - red
    if (priority >= 5) return '#FF9800'; // Medium priority - orange
    return '#4CAF50'; // Low priority - green
  };

  // Get category icon
  const getCategoryIcon = (category: string): string => {
    switch (category) {
      case 'trading': return '💰';
      case 'combat': return '⚔️';
      case 'exploration': return '🚀';
      case 'diplomacy': return '🤝';
      case 'investigation': return '🔍';
      case 'construction': return '🔧';
      case 'mystery': return '❓';
      case 'character': return '👤';
      default: return '📋';
    }
  };

  // Render quest list
  const renderQuestList = (quests: StoryQuest[], showStartButton: boolean = false) => (
    <div className="quest-list">
      {quests.length === 0 ? (
        <div className="no-quests">
          <p>No quests {activeTab}</p>
        </div>
      ) : (
        quests.map((quest) => (
          <div
            key={quest.id}
            className={`quest-item ${selectedQuest?.id === quest.id ? 'selected' : ''}`}
            onClick={() => setSelectedQuest(quest)}
          >
            <div className="quest-header">
              <div className="quest-title">
                <span className="category-icon">{getCategoryIcon(quest.category)}</span>
                <span className="title">{quest.title}</span>
                <span 
                  className="priority-indicator"
                  style={{ backgroundColor: getPriorityColor(quest.priority || 0) }}
                >
                  {quest.priority || 0}
                </span>
              </div>
              <div className="quest-meta">
                <span className="quest-type">{quest.type.replace('_', ' ')}</span>
                {quest.factionId && (
                  <span className="faction-badge">{quest.factionId.replace('_', ' ')}</span>
                )}
              </div>
            </div>
            
            <div className="quest-description">
              {quest.description}
            </div>

            <div className="quest-objectives">
              {quest.objectives.map((objective) => (
                <div key={objective.id} className={`objective ${objective.completed ? 'completed' : ''}`}>
                  <span className="objective-icon">{objective.completed ? '✅' : '⏳'}</span>
                  <span className="objective-text">{objective.description}</span>
                  {objective.quantity && (
                    <span className="objective-progress">
                      ({objective.currentProgress || 0}/{objective.quantity})
                    </span>
                  )}
                </div>
              ))}
            </div>

            {quest.rewards && (
              <div className="quest-rewards">
                <strong>Rewards:</strong>
                {quest.rewards.credits && <span className="reward">💰 {quest.rewards.credits.toLocaleString()}</span>}
                {quest.rewards.experience && <span className="reward">⭐ {quest.rewards.experience} XP</span>}
                {quest.rewards.reputation && Object.entries(quest.rewards.reputation).map(([faction, rep]) => (
                  <span key={faction} className="reward">👥 {faction}: +{rep}</span>
                ))}
              </div>
            )}

            {showStartButton && selectedQuest?.id === quest.id && (
              <div className="quest-actions">
                <button 
                  className="start-quest-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleStartQuest(quest.id);
                  }}
                >
                  Start Quest
                </button>
              </div>
            )}
          </div>
        ))
      )}
    </div>
  );

  // Render storylines tab
  const renderStorylinesTab = () => (
    <div className="storylines-tab">
      <div className="storylines-info">
        <h3>📖 Faction Storylines</h3>
        <p>Major story arcs that develop your relationships with different factions and unlock unique content.</p>
      </div>
      
      <div className="storyline-list">
        <div className="storyline-item">
          <h4>🏪 Traders Guild: Rise of Commerce</h4>
          <p>Help the Traders Guild expand their influence across the galaxy and become a dominant commercial force.</p>
          <div className="storyline-progress">
            <div className="progress-bar">
              <div className="progress-fill" style={{ width: '25%' }}></div>
            </div>
            <span>Arc 1 of 4 - Guild Initiation</span>
          </div>
        </div>

        <div className="storyline-item locked">
          <h4>🏛️ Federation Conspiracy</h4>
          <p>Uncover a conspiracy within the Earth Federation that threatens the stability of the galaxy.</p>
          <div className="unlock-requirement">
            Requires: Level 10, Investigation 5
          </div>
        </div>

        <div className="storyline-item locked">
          <h4>🚀 Outer Colonies Rebellion</h4>
          <p>Navigate the complex politics of the outer colonies' struggle for independence.</p>
          <div className="unlock-requirement">
            Requires: Outer Colonies reputation 50+
          </div>
        </div>

        <div className="storyline-item locked">
          <h4>🔬 Ancient Technology</h4>
          <p>Discover and unlock the secrets of ancient alien technology scattered across the galaxy.</p>
          <div className="unlock-requirement">
            Requires: Exploration 8, Science 6
          </div>
        </div>
      </div>
    </div>
  );

  if (!isVisible) return null;

  return (
    <div className="quest-panel">
      <div className="panel-header">
        <h2>📋 Quest Log</h2>
        <button className="close-btn" onClick={onClose}>×</button>
      </div>

      <div className="quest-tabs">
        <button 
          className={`tab ${activeTab === 'active' ? 'active' : ''}`}
          onClick={() => setActiveTab('active')}
        >
          Active ({questCounts.active})
        </button>
        <button 
          className={`tab ${activeTab === 'available' ? 'active' : ''}`}
          onClick={() => setActiveTab('available')}
        >
          Available ({questCounts.available})
        </button>
        <button 
          className={`tab ${activeTab === 'completed' ? 'active' : ''}`}
          onClick={() => setActiveTab('completed')}
        >
          Completed ({questCounts.completed})
        </button>
        <button 
          className={`tab ${activeTab === 'storylines' ? 'active' : ''}`}
          onClick={() => setActiveTab('storylines')}
        >
          Storylines
        </button>
      </div>

      <div className="quest-content">
        {activeTab === 'active' && renderQuestList(activeQuests)}
        {activeTab === 'available' && renderQuestList(availableQuests, true)}
        {activeTab === 'completed' && renderQuestList(completedQuests)}
        {activeTab === 'storylines' && renderStorylinesTab()}
      </div>

      <style>{`
        .quest-panel {
          position: fixed;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          width: 900px;
          max-width: 95vw;
          height: 700px;
          max-height: 90vh;
          background: linear-gradient(135deg, rgba(15, 23, 42, 0.98), rgba(30, 41, 59, 0.98));
          border: 2px solid #3b82f6;
          border-radius: 12px;
          box-shadow: 0 25px 50px rgba(0, 0, 0, 0.5);
          backdrop-filter: blur(10px);
          color: white;
          font-family: 'Courier New', monospace;
          z-index: 1000;
          display: flex;
          flex-direction: column;
        }

        .panel-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 20px;
          border-bottom: 1px solid #334155;
        }

        .panel-header h2 {
          margin: 0;
          color: #3b82f6;
          font-size: 24px;
        }

        .close-btn {
          background: #ef4444;
          border: none;
          color: white;
          width: 30px;
          height: 30px;
          border-radius: 50%;
          cursor: pointer;
          font-size: 18px;
          transition: background-color 0.3s;
        }

        .close-btn:hover {
          background: #dc2626;
        }

        .quest-tabs {
          display: flex;
          padding: 0 20px;
          border-bottom: 1px solid #334155;
        }

        .tab {
          background: none;
          border: none;
          color: #94a3b8;
          padding: 12px 24px;
          cursor: pointer;
          border-bottom: 2px solid transparent;
          transition: all 0.3s;
          font-family: inherit;
        }

        .tab:hover {
          color: #e2e8f0;
        }

        .tab.active {
          color: #3b82f6;
          border-bottom-color: #3b82f6;
        }

        .quest-content {
          flex: 1;
          padding: 20px;
          overflow-y: auto;
        }

        .quest-list {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .quest-item {
          background: rgba(15, 23, 42, 0.8);
          border: 1px solid #334155;
          border-radius: 8px;
          padding: 16px;
          cursor: pointer;
          transition: all 0.3s;
        }

        .quest-item:hover {
          border-color: #3b82f6;
          background: rgba(30, 41, 59, 0.8);
        }

        .quest-item.selected {
          border-color: #3b82f6;
          box-shadow: 0 0 20px rgba(59, 130, 246, 0.3);
        }

        .quest-header {
          margin-bottom: 12px;
        }

        .quest-title {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 4px;
        }

        .category-icon {
          font-size: 18px;
        }

        .title {
          font-weight: bold;
          font-size: 18px;
          color: #e2e8f0;
        }

        .priority-indicator {
          color: white;
          font-size: 12px;
          font-weight: bold;
          padding: 2px 6px;
          border-radius: 12px;
          min-width: 20px;
          text-align: center;
        }

        .quest-meta {
          display: flex;
          gap: 12px;
          font-size: 12px;
          color: #94a3b8;
        }

        .quest-type {
          text-transform: uppercase;
          font-weight: bold;
        }

        .faction-badge {
          background: rgba(59, 130, 246, 0.2);
          color: #93c5fd;
          padding: 2px 8px;
          border-radius: 4px;
          text-transform: capitalize;
        }

        .quest-description {
          color: #cbd5e1;
          margin-bottom: 12px;
          line-height: 1.5;
        }

        .quest-objectives {
          margin-bottom: 12px;
        }

        .objective {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 4px 0;
          font-size: 14px;
        }

        .objective.completed {
          color: #4ade80;
        }

        .objective-progress {
          color: #94a3b8;
          font-size: 12px;
        }

        .quest-rewards {
          display: flex;
          flex-wrap: wrap;
          gap: 12px;
          font-size: 14px;
          color: #fbbf24;
          margin-bottom: 12px;
        }

        .reward {
          background: rgba(251, 191, 36, 0.1);
          padding: 4px 8px;
          border-radius: 4px;
          font-size: 12px;
        }

        .quest-actions {
          margin-top: 12px;
          display: flex;
          justify-content: flex-end;
        }

        .start-quest-btn {
          background: #10b981;
          border: none;
          color: white;
          padding: 8px 16px;
          border-radius: 4px;
          cursor: pointer;
          font-family: inherit;
          transition: background-color 0.3s;
        }

        .start-quest-btn:hover {
          background: #059669;
        }

        .no-quests {
          text-align: center;
          color: #94a3b8;
          padding: 40px;
        }

        .storylines-info {
          margin-bottom: 24px;
          text-align: center;
        }

        .storylines-info h3 {
          color: #3b82f6;
          margin-bottom: 8px;
        }

        .storyline-list {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .storyline-item {
          background: rgba(15, 23, 42, 0.8);
          border: 1px solid #334155;
          border-radius: 8px;
          padding: 20px;
        }

        .storyline-item.locked {
          opacity: 0.6;
          border-color: #475569;
        }

        .storyline-item h4 {
          margin: 0 0 8px 0;
          color: #e2e8f0;
        }

        .storyline-progress {
          margin-top: 12px;
        }

        .progress-bar {
          width: 100%;
          height: 8px;
          background: #334155;
          border-radius: 4px;
          overflow: hidden;
          margin-bottom: 8px;
        }

        .progress-fill {
          height: 100%;
          background: linear-gradient(90deg, #10b981, #3b82f6);
          transition: width 0.3s;
        }

        .unlock-requirement {
          margin-top: 12px;
          font-size: 14px;
          color: #94a3b8;
          font-style: italic;
        }

        /* Scrollbar styling */
        .quest-content::-webkit-scrollbar {
          width: 8px;
        }

        .quest-content::-webkit-scrollbar-track {
          background: rgba(51, 65, 85, 0.5);
          border-radius: 4px;
        }

        .quest-content::-webkit-scrollbar-thumb {
          background: #475569;
          border-radius: 4px;
        }

        .quest-content::-webkit-scrollbar-thumb:hover {
          background: #64748b;
        }
      `}</style>
    </div>
  );
};