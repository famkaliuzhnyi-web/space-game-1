import React, { useState, useEffect } from 'react';
import Modal from './Modal';
import { AchievementManager } from '../../systems/AchievementManager';
import { Achievement, PlayerAchievements, AchievementNotification } from '../../types/achievements';

// Extended notification interface for UI with timestamp
interface NotificationWithTimestamp extends AchievementNotification {
  timestamp: number;
}

interface AchievementsPanelProps {
  isVisible: boolean;
  onClose: () => void;
  achievementManager?: AchievementManager;
}

const AchievementsPanel: React.FC<AchievementsPanelProps> = ({
  isVisible,
  onClose,
  achievementManager
}) => {
  const [activeTab, setActiveTab] = useState<'unlocked' | 'progress' | 'all'>('unlocked');
  const [playerAchievements, setPlayerAchievements] = useState<PlayerAchievements | null>(null);
  const [allAchievements, setAllAchievements] = useState<Achievement[]>([]);
  const [notifications, setNotifications] = useState<NotificationWithTimestamp[]>([]);

  useEffect(() => {
    if (achievementManager) {
      setPlayerAchievements(achievementManager.getPlayerAchievements());
      setAllAchievements(achievementManager.getAvailableAchievements());
      
      // Listen for achievement notifications
      const handleNotification = (notification: AchievementNotification) => {
        const notificationWithTimestamp: NotificationWithTimestamp = { ...notification, timestamp: Date.now() };
        setNotifications(prev => [...prev, notificationWithTimestamp]);
        // Clear notification after 5 seconds
        setTimeout(() => {
          setNotifications(prev => prev.filter(n => n.timestamp !== notificationWithTimestamp.timestamp));
        }, 5000);
      };

      if (typeof achievementManager.addEventListener === 'function') {
        achievementManager.addEventListener('achievement_unlocked', handleNotification);
        
        return () => {
          if (typeof achievementManager.removeEventListener === 'function') {
            achievementManager.removeEventListener('achievement_unlocked', handleNotification);
          }
        };
      }
    }
  }, [achievementManager]);

  if (!isVisible || !achievementManager || !playerAchievements) return null;

  const getRarityColor = (rarity: string): string => {
    switch (rarity) {
      case 'legendary': return '#fbbf24'; // golden
      case 'epic': return '#8b5cf6'; // purple
      case 'rare': return '#3b82f6'; // blue
      case 'uncommon': return '#10b981'; // green
      case 'common': return '#6b7280'; // gray
      default: return '#6b7280';
    }
  };

  const getCategoryIcon = (category: string): string => {
    switch (category) {
      case 'trading': return '💰';
      case 'exploration': return '🗺️';
      case 'combat': return '⚔️';
      case 'social': return '🤝';
      case 'technical': return '🔧';
      case 'progression': return '📈';
      default: return '🏆';
    }
  };

  const getProgressPercentage = (achievementId: string): number => {
    const progress = playerAchievements.progress.get(achievementId);
    if (!progress) return 0;
    
    const achievement = allAchievements.find(a => a.id === achievementId);
    if (!achievement || achievement.requirements.length === 0) return 0;

    const requirement = achievement.requirements[0];
    const current = progress.progress.get(requirement.key) || 0;
    const total = typeof requirement.value === 'number' ? requirement.value : 1;
    
    return Math.min(100, (current / total) * 100);
  };

  const isUnlocked = (achievementId: string): boolean => {
    return playerAchievements.unlocked.includes(achievementId);
  };

  const renderAchievementCard = (achievement: Achievement) => {
    const unlocked = isUnlocked(achievement.id);
    const progress = playerAchievements.progress.get(achievement.id);
    const progressPercentage = getProgressPercentage(achievement.id);
    
    return (
      <div
        key={achievement.id}
        className={`achievement-card ${unlocked ? 'unlocked' : 'locked'}`}
        style={{
          border: `2px solid ${getRarityColor(achievement.rarity)}`,
          borderRadius: '8px',
          padding: '16px',
          margin: '8px 0',
          backgroundColor: unlocked ? '#1f2937' : '#0f172a',
          opacity: unlocked ? 1 : 0.7,
          transition: 'all 0.3s ease'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: '8px' }}>
          <span style={{ fontSize: '24px', marginRight: '12px' }}>
            {unlocked ? achievement.icon : '🔒'}
          </span>
          <div style={{ flex: 1 }}>
            <h3 style={{ 
              margin: 0, 
              color: getRarityColor(achievement.rarity),
              fontSize: '18px'
            }}>
              {achievement.name}
            </h3>
            <p style={{ margin: '4px 0', color: '#9ca3af', fontSize: '14px' }}>
              {achievement.description}
            </p>
          </div>
          <div style={{ textAlign: 'right' }}>
            <span style={{ 
              fontSize: '14px', 
              color: '#6b7280',
              display: 'block'
            }}>
              {getCategoryIcon(achievement.category)} {achievement.category}
            </span>
            <span style={{ 
              fontSize: '12px', 
              color: getRarityColor(achievement.rarity),
              textTransform: 'uppercase',
              fontWeight: 'bold'
            }}>
              {achievement.rarity}
            </span>
          </div>
        </div>
        
        {!unlocked && progress && (
          <div style={{ marginTop: '8px' }}>
            <div style={{ 
              fontSize: '12px', 
              color: '#9ca3af', 
              marginBottom: '4px'
            }}>
              Progress: {progress.progress.get(achievement.requirements[0]?.key) || 0}/{achievement.requirements[0]?.value || 0}
            </div>
            <div style={{ 
              width: '100%', 
              height: '6px', 
              backgroundColor: '#374151',
              borderRadius: '3px',
              overflow: 'hidden'
            }}>
              <div style={{
                width: `${progressPercentage}%`,
                height: '100%',
                backgroundColor: getRarityColor(achievement.rarity),
                transition: 'width 0.3s ease'
              }} />
            </div>
          </div>
        )}
        
        {unlocked && (
          <div style={{ 
            fontSize: '12px', 
            color: '#10b981',
            marginTop: '8px'
          }}>
            ✓ Unlocked • +{achievement.points} points
          </div>
        )}
      </div>
    );
  };

  const unlockedAchievements = allAchievements.filter(a => isUnlocked(a.id));
  const inProgressAchievements = allAchievements.filter(a => 
    !isUnlocked(a.id) && playerAchievements.progress.has(a.id)
  );

  return (
    <Modal isOpen={isVisible} onClose={onClose} title="Achievements" size="large">
      <div style={{ maxHeight: '70vh', overflow: 'auto' }}>
        {/* Achievement Notifications */}
        {notifications.length > 0 && (
          <div style={{ 
            position: 'fixed', 
            top: '20px', 
            right: '20px', 
            zIndex: 1000 
          }}>
            {notifications.map((notification: NotificationWithTimestamp) => (
              <div
                key={notification.timestamp}
                style={{
                  backgroundColor: '#10b981',
                  color: 'white',
                  padding: '12px 16px',
                  borderRadius: '8px',
                  marginBottom: '8px',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
                  animation: 'slideInRight 0.3s ease-out'
                }}
              >
                🏆 Achievement Unlocked: {notification.achievement?.name || 'Unknown Achievement'}!
              </div>
            ))}
          </div>
        )}

        {/* Summary Stats */}
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-around',
          backgroundColor: '#1f2937',
          borderRadius: '8px',
          padding: '16px',
          marginBottom: '16px'
        }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#fbbf24' }}>
              {playerAchievements.totalPoints}
            </div>
            <div style={{ fontSize: '12px', color: '#9ca3af' }}>Total Points</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#10b981' }}>
              {unlockedAchievements.length}
            </div>
            <div style={{ fontSize: '12px', color: '#9ca3af' }}>Unlocked</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#3b82f6' }}>
              {inProgressAchievements.length}
            </div>
            <div style={{ fontSize: '12px', color: '#9ca3af' }}>In Progress</div>
          </div>
        </div>

        {/* Tabs */}
        <div style={{ 
          display: 'flex', 
          marginBottom: '16px',
          borderBottom: '1px solid #374151'
        }}>
          {[
            { key: 'unlocked', label: 'Unlocked', count: unlockedAchievements.length },
            { key: 'progress', label: 'In Progress', count: inProgressAchievements.length },
            { key: 'all', label: 'All', count: allAchievements.length }
          ].map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as 'unlocked' | 'progress' | 'all')}
              style={{
                padding: '8px 16px',
                backgroundColor: activeTab === tab.key ? '#3b82f6' : 'transparent',
                color: activeTab === tab.key ? 'white' : '#9ca3af',
                border: 'none',
                borderRadius: '4px 4px 0 0',
                cursor: 'pointer',
                fontSize: '14px'
              }}
            >
              {tab.label} ({tab.count})
            </button>
          ))}
        </div>

        {/* Achievement Lists */}
        <div>
          {activeTab === 'unlocked' && unlockedAchievements.map(achievement => 
            renderAchievementCard(achievement)
          )}
          
          {activeTab === 'progress' && inProgressAchievements.map(achievement =>
            renderAchievementCard(achievement)
          )}
          
          {activeTab === 'all' && allAchievements.map(achievement =>
            renderAchievementCard(achievement)
          )}
        </div>

        {/* Empty States */}
        {activeTab === 'unlocked' && unlockedAchievements.length === 0 && (
          <div style={{ 
            textAlign: 'center', 
            padding: '32px',
            color: '#9ca3af'
          }}>
            No achievements unlocked yet. Start playing to unlock your first achievement!
          </div>
        )}
        
        {activeTab === 'progress' && inProgressAchievements.length === 0 && (
          <div style={{ 
            textAlign: 'center', 
            padding: '32px',
            color: '#9ca3af'
          }}>
            No achievements in progress. Complete more activities to start making progress!
          </div>
        )}
      </div>
    </Modal>
  );
};

export default AchievementsPanel;