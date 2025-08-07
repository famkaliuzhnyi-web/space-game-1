import React, { useState, useEffect, useCallback } from 'react';
import './TutorialPanel.css';
import { 
  TutorialFlow, 
  TutorialStep, 
  TutorialState,
  TutorialSettings
} from '../../types/tutorial';

import { TutorialManager } from '../../systems/TutorialManager';

interface TutorialPanelProps {
  isVisible: boolean;
  tutorialManager: TutorialManager;
  onClose: () => void;
}

export const TutorialPanel: React.FC<TutorialPanelProps> = ({ 
  isVisible, 
  tutorialManager,
  onClose 
}) => {
  const [activeTab, setActiveTab] = useState<'active' | 'available' | 'completed' | 'settings'>('available');
  const [tutorialState, setTutorialState] = useState<TutorialState | null>(null);
  const [availableFlows, setAvailableFlows] = useState<TutorialFlow[]>([]);
  const [currentStep, setCurrentStep] = useState<TutorialStep | null>(null);
  const [settings, setSettings] = useState<TutorialSettings>({
    enabled: true,
    showHints: true,
    autoAdvance: false,
    highlightElements: true,
    tooltipsEnabled: true
  });

  const updateData = useCallback(() => {
    if (!tutorialManager) return;
    
    setTutorialState(tutorialManager.getTutorialState());
    setAvailableFlows(tutorialManager.getAvailableFlows());
    setCurrentStep(tutorialManager.getCurrentStep());
  }, [tutorialManager]);

  useEffect(() => {
    if (!isVisible || !tutorialManager) return;
    
    updateData();
  }, [isVisible, updateData]);

  const handleStartTutorial = (flowId: string) => {
    if (tutorialManager.startTutorialFlow(flowId)) {
      updateData();
      setActiveTab('active');
    }
  };

  const handleNextStep = () => {
    if (tutorialManager.nextStep()) {
      updateData();
    } else {
      // Tutorial flow completed
      setActiveTab('available');
      updateData();
    }
  };

  const handleSkipFlow = () => {
    tutorialManager.skipTutorialFlow();
    updateData();
    setActiveTab('available');
  };

  const handleSettingsChange = (newSettings: Partial<TutorialSettings>) => {
    const updatedSettings = { ...settings, ...newSettings };
    setSettings(updatedSettings);
    tutorialManager.updateSettings(updatedSettings);
  };

  if (!isVisible) return null;

  return (
    <div className="tutorial-panel">
      <div className="tutorial-header">
        <h3>Tutorial System</h3>
        <button className="close-btn" onClick={onClose}>×</button>
      </div>

      <div className="tutorial-tabs">
        <button 
          className={activeTab === 'active' ? 'active' : ''}
          onClick={() => setActiveTab('active')}
          disabled={!currentStep}
        >
          Active Tutorial
        </button>
        <button 
          className={activeTab === 'available' ? 'active' : ''}
          onClick={() => setActiveTab('available')}
        >
          Available ({availableFlows.length})
        </button>
        <button 
          className={activeTab === 'completed' ? 'active' : ''}
          onClick={() => setActiveTab('completed')}
        >
          Completed ({tutorialState?.completedFlows.length || 0})
        </button>
        <button 
          className={activeTab === 'settings' ? 'active' : ''}
          onClick={() => setActiveTab('settings')}
        >
          Settings
        </button>
      </div>

      <div className="tutorial-content">
        {activeTab === 'active' && (
          <div className="active-tutorial">
            {currentStep ? (
              <div className="tutorial-step">
                <h4>{currentStep.title}</h4>
                <p>{currentStep.description}</p>
                
                {currentStep.target && (
                  <div className="step-target">
                    <strong>Focus on:</strong> {currentStep.target}
                  </div>
                )}

                <div className="step-actions">
                  <button onClick={handleNextStep} className="primary-btn">
                    {currentStep.action === 'click' ? 'Click and Continue' : 'Continue'}
                  </button>
                  <button onClick={handleSkipFlow} className="secondary-btn">
                    Skip Tutorial
                  </button>
                </div>

                {tutorialState?.currentStep !== undefined && (
                  <div className="step-progress">
                    Step {(tutorialState.currentStep || 0) + 1} of {availableFlows.find(f => f.id === tutorialState.currentFlow)?.steps.length || 0}
                  </div>
                )}
              </div>
            ) : (
              <div className="no-active-tutorial">
                <h4>No Active Tutorial</h4>
                <p>Select a tutorial from the Available tab to get started.</p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'available' && (
          <div className="available-tutorials">
            <h4>Available Tutorial Flows</h4>
            {availableFlows.length === 0 ? (
              <div className="no-tutorials">
                <p>All tutorials completed! You've mastered the game systems.</p>
              </div>
            ) : (
              <div className="tutorial-list">
                {availableFlows.map(flow => (
                  <div key={flow.id} className={`tutorial-flow ${flow.category}`}>
                    <div className="flow-header">
                      <h5>{flow.name}</h5>
                      <span className={`category-badge ${flow.category}`}>
                        {flow.category.toUpperCase()}
                      </span>
                    </div>
                    <p>{flow.description}</p>
                    
                    <div className="flow-details">
                      <div className="steps-count">
                        {flow.steps.length} steps
                      </div>
                      {flow.rewards && flow.rewards.length > 0 && (
                        <div className="rewards">
                          <strong>Rewards:</strong>
                          <ul>
                            {flow.rewards.map((reward, index) => (
                              <li key={index}>{reward.description}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>

                    <div className="flow-actions">
                      <button 
                        onClick={() => handleStartTutorial(flow.id)}
                        className="start-tutorial-btn"
                        disabled={!!currentStep}
                      >
                        Start Tutorial
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'completed' && (
          <div className="completed-tutorials">
            <h4>Completed Tutorials</h4>
            {tutorialState?.completedFlows.length === 0 ? (
              <p>No tutorials completed yet. Start with the basics!</p>
            ) : (
              <div className="completed-list">
                {tutorialState?.completedFlows.map(flowId => {
                  const flow = availableFlows.find(f => f.id === flowId) || 
                               { id: flowId, name: flowId, category: 'unknown', description: 'Completed tutorial' };
                  return (
                    <div key={flowId} className="completed-flow">
                      <h5>{flow.name}</h5>
                      <p>{flow.description}</p>
                      <span className={`category-badge ${flow.category}`}>
                        {flow.category.toUpperCase()}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {activeTab === 'settings' && (
          <div className="tutorial-settings">
            <h4>Tutorial Settings</h4>
            
            <div className="setting-group">
              <label className="setting-item">
                <input 
                  type="checkbox"
                  checked={settings.enabled}
                  onChange={(e) => handleSettingsChange({ enabled: e.target.checked })}
                />
                <span>Enable Tutorial System</span>
                <div className="setting-description">
                  Turn off to disable all tutorial prompts and hints
                </div>
              </label>

              <label className="setting-item">
                <input 
                  type="checkbox"
                  checked={settings.showHints}
                  onChange={(e) => handleSettingsChange({ showHints: e.target.checked })}
                />
                <span>Show Contextual Hints</span>
                <div className="setting-description">
                  Display helpful hints based on your current situation
                </div>
              </label>

              <label className="setting-item">
                <input 
                  type="checkbox"
                  checked={settings.highlightElements}
                  onChange={(e) => handleSettingsChange({ highlightElements: e.target.checked })}
                />
                <span>Highlight UI Elements</span>
                <div className="setting-description">
                  Highlight buttons and panels during tutorial steps
                </div>
              </label>

              <label className="setting-item">
                <input 
                  type="checkbox"
                  checked={settings.tooltipsEnabled}
                  onChange={(e) => handleSettingsChange({ tooltipsEnabled: e.target.checked })}
                />
                <span>Enable Tooltips</span>
                <div className="setting-description">
                  Show helpful tooltips when hovering over UI elements
                </div>
              </label>

              <label className="setting-item">
                <input 
                  type="checkbox"
                  checked={settings.autoAdvance}
                  onChange={(e) => handleSettingsChange({ autoAdvance: e.target.checked })}
                />
                <span>Auto-Advance Steps</span>
                <div className="setting-description">
                  Automatically advance tutorial steps after completing actions
                </div>
              </label>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};