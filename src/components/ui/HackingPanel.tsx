import React, { useState } from 'react';
import { HackingManager } from '../../systems/HackingManager';
import { 
  HackingTarget, 
  HackingMinigame 
} from '../../types/hacking';
import './HackingPanel.css';

interface HackingPanelProps {
  hackingManager: HackingManager;
  onClose: () => void;
  onCreditsChange: (newCredits: number) => void;
}

export const HackingPanel: React.FC<HackingPanelProps> = ({ 
  hackingManager, 
  onClose, 
  onCreditsChange 
}) => {
  const [activeTab, setActiveTab] = useState<'targets' | 'equipment' | 'data' | 'market' | 'stats' | 'active'>('targets');
  const [selectedTarget, setSelectedTarget] = useState<HackingTarget | null>(null);
  const [selectedEquipment, setSelectedEquipment] = useState<string>('');
  const [selectedSoftware, setSelectedSoftware] = useState<string[]>([]);
  const [activeMinigame, setActiveMinigame] = useState<HackingMinigame | null>(null);
  const [minigameInput, setMinigameInput] = useState<string>('');

  const hackingState = hackingManager.getHackingState();
  const availableTargets = hackingManager.getAvailableTargets();
  const availableEquipment = hackingManager.getAvailableEquipment();
  const availableSoftware = hackingManager.getAvailableSoftware();
  const activeAttempts = hackingManager.getActiveAttempts();
  const stolenData = hackingManager.getStolenData();
  const dataMarkets = hackingManager.getAvailableDataMarkets();
  const stats = hackingManager.getHackingStats();

  const renderTabButton = (tabId: string, label: string, badge?: number) => (
    <button
      key={tabId}
      className={`tab-button ${activeTab === tabId ? 'active' : ''}`}
      onClick={() => setActiveTab(tabId as 'targets' | 'equipment' | 'data' | 'market' | 'stats' | 'active')}
    >
      {label}
      {badge !== undefined && badge > 0 && (
        <span className="badge">{badge}</span>
      )}
    </button>
  );

  const renderTargets = () => (
    <div className="targets-tab">
      <h3>Available Targets</h3>
      <div className="targets-grid">
        {availableTargets.map(target => (
          <div 
            key={target.id} 
            className={`target-card ${selectedTarget?.id === target.id ? 'selected' : ''}`}
            onClick={() => setSelectedTarget(target)}
          >
            <div className="target-header">
              <h4>{target.name}</h4>
              <div className={`security-level level-${target.security.accessLevel}`}>
                Level {target.security.accessLevel}
              </div>
            </div>
            
            <div className="target-info">
              <div className="info-row">
                <span className="label">Type:</span>
                <span className="value">{target.type.replace('-', ' ')}</span>
              </div>
              <div className="info-row">
                <span className="label">Value:</span>
                <span className="value">{target.value.informationWorth.toLocaleString()} CR</span>
              </div>
              <div className="info-row">
                <span className="label">Risk:</span>
                <div className={`risk-level level-${Math.floor(target.value.riskLevel / 3)}`}>
                  {target.value.riskLevel}/10
                </div>
              </div>
            </div>
            
            <div className="security-details">
              <div className="security-stat">
                <span>Encryption: {target.security.encryptionStrength}/5</span>
              </div>
              <div className="security-stat">
                <span>Monitoring: {target.security.monitoring}/5</span>
              </div>
              {target.security.countermeasures && (
                <div className="countermeasures">⚠️ Active Countermeasures</div>
              )}
            </div>
            
            <p className="target-description">{target.description}</p>
          </div>
        ))}
      </div>

      {selectedTarget && (
        <div className="hacking-setup">
          <h3>Setup Hacking Attempt</h3>
          
          <div className="equipment-selection">
            <label>Hardware:</label>
            <select 
              value={selectedEquipment} 
              onChange={(e) => setSelectedEquipment(e.target.value)}
            >
              <option value="">Select Equipment...</option>
              {hackingState.ownedEquipment.map(eq => (
                <option key={eq.id} value={eq.id}>
                  {eq.name} (Max Level {eq.capabilities.maxAccessLevel})
                </option>
              ))}
            </select>
          </div>

          <div className="software-selection">
            <label>Software:</label>
            <div className="software-checkboxes">
              {hackingState.ownedSoftware.map(sw => (
                <label key={sw.id} className="software-checkbox">
                  <input
                    type="checkbox"
                    checked={selectedSoftware.includes(sw.id)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedSoftware([...selectedSoftware, sw.id]);
                      } else {
                        setSelectedSoftware(selectedSoftware.filter(id => id !== sw.id));
                      }
                    }}
                  />
                  {sw.name} ({sw.category})
                </label>
              ))}
            </div>
          </div>

          <div className="attempt-actions">
            <button 
              className="hack-button"
              onClick={() => handleStartHacking()}
              disabled={!selectedEquipment || selectedSoftware.length === 0}
            >
              Begin Hacking
            </button>
          </div>
        </div>
      )}
    </div>
  );

  const renderEquipment = () => (
    <div className="equipment-tab">
      <div className="equipment-section">
        <h3>Owned Equipment</h3>
        <div className="equipment-grid">
          {hackingState.ownedEquipment.map(eq => (
            <div key={eq.id} className="equipment-card owned">
              <h4>{eq.name}</h4>
              <div className="equipment-type">{eq.type}</div>
              <div className="equipment-specs">
                <div>Max Access: Level {eq.capabilities.maxAccessLevel}</div>
                <div>Encryption Breaking: {eq.capabilities.encryptionBreaking}/5</div>
                <div>Stealth Bonus: +{(eq.capabilities.stealthBonus * 100).toFixed(0)}%</div>
                <div>Processing Power: {eq.capabilities.processingPower}</div>
              </div>
              <p>{eq.description}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="equipment-section">
        <h3>Available Equipment</h3>
        <div className="equipment-grid">
          {availableEquipment
            .filter(eq => !hackingState.ownedEquipment.find(owned => owned.id === eq.id))
            .map(eq => (
              <div key={eq.id} className="equipment-card available">
                <h4>{eq.name}</h4>
                <div className="equipment-type">{eq.type}</div>
                <div className="equipment-price">{eq.cost.toLocaleString()} CR</div>
                <div className="equipment-specs">
                  <div>Max Access: Level {eq.capabilities.maxAccessLevel}</div>
                  <div>Encryption Breaking: {eq.capabilities.encryptionBreaking}/5</div>
                  <div>Stealth Bonus: +{(eq.capabilities.stealthBonus * 100).toFixed(0)}%</div>
                  <div>Processing Power: {eq.capabilities.processingPower}</div>
                </div>
                <div className="availability">{eq.availability}</div>
                <p>{eq.description}</p>
                <button 
                  className="purchase-button"
                  onClick={() => handlePurchaseEquipment(eq.id)}
                >
                  Purchase
                </button>
              </div>
            ))}
        </div>
      </div>

      <div className="equipment-section">
        <h3>Owned Software</h3>
        <div className="software-grid">
          {hackingState.ownedSoftware.map(sw => (
            <div key={sw.id} className="software-card owned">
              <h4>{sw.name}</h4>
              <div className="software-category">{sw.category} - {sw.type}</div>
              <div className="software-stats">
                <div>Effectiveness: {sw.effectiveness}/5</div>
                <div>Detection Risk: {(sw.detectionRisk * 100).toFixed(0)}%</div>
                <div>Skill Required: {sw.skillRequired}</div>
              </div>
              <p>{sw.description}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="equipment-section">
        <h3>Available Software</h3>
        <div className="software-grid">
          {availableSoftware
            .filter(sw => !hackingState.ownedSoftware.find(owned => owned.id === sw.id))
            .map(sw => (
              <div key={sw.id} className="software-card available">
                <h4>{sw.name}</h4>
                <div className="software-category">{sw.category} - {sw.type}</div>
                <div className="software-price">{sw.cost.toLocaleString()} CR</div>
                <div className="software-stats">
                  <div>Effectiveness: {sw.effectiveness}/5</div>
                  <div>Detection Risk: {(sw.detectionRisk * 100).toFixed(0)}%</div>
                  <div>Skill Required: {sw.skillRequired}</div>
                </div>
                <p>{sw.description}</p>
                <button 
                  className="purchase-button"
                  onClick={() => handlePurchaseSoftware(sw.id)}
                >
                  Purchase
                </button>
              </div>
            ))}
        </div>
      </div>
    </div>
  );

  const renderData = () => (
    <div className="data-tab">
      <h3>Stolen Data</h3>
      {stolenData.length === 0 ? (
        <p>No data stolen yet.</p>
      ) : (
        <div className="data-grid">
          {stolenData.map(data => (
            <div key={data.id} className="data-card">
              <div className="data-header">
                <h4>{data.content.title}</h4>
                <div className="data-type">{data.type.replace('-', ' ')}</div>
              </div>
              
              <div className="data-stats">
                <div className="stat">
                  <span className="label">Quality:</span>
                  <span className="value">{data.quality}/5</span>
                </div>
                <div className="stat">
                  <span className="label">Age:</span>
                  <span className="value">{data.freshness.toFixed(1)}h</span>
                </div>
                <div className="stat">
                  <span className="label">Value:</span>
                  <span className="value">{data.marketValue.toLocaleString()} CR</span>
                </div>
                <div className="stat">
                  <span className="label">Risk:</span>
                  <span className="value">{data.restrictions.legalRisk}/10</span>
                </div>
              </div>
              
              <p className="data-description">{data.content.description}</p>
              
              {data.restrictions.sellable && (
                <div className="data-actions">
                  <button 
                    className="sell-button"
                    onClick={() => handleSellData(data.id)}
                  >
                    Sell Data
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );

  const renderMarket = () => (
    <div className="market-tab">
      <h3>Information Markets</h3>
      {dataMarkets.length === 0 ? (
        <p>No accessible markets found. Improve your reputation and hacking skills to access more markets.</p>
      ) : (
        <div className="markets-grid">
          {dataMarkets.map(market => (
            <div key={market.id} className="market-card">
              <h4>{market.name}</h4>
              <div className="market-location">{market.location}</div>
              <div className="market-reputation">{market.reputation}</div>
              
              <div className="market-requirements">
                <div>Reputation Required: {market.accessibility.reputationRequired}</div>
                <div>Skill Required: {market.accessibility.skillRequired}</div>
              </div>
              
              <div className="market-pricing">
                <div>Base Price: {(market.pricing.basePriceMultiplier * 100).toFixed(0)}%</div>
                <div>Quality Bonus: +{(market.pricing.qualityBonus * 100).toFixed(0)}%</div>
                <div>Freshness Bonus: +{(market.pricing.freshnessBonus * 100).toFixed(0)}%</div>
              </div>
              
              <div className="market-reputation-value">
                Your Reputation: {hackingState.marketReputation.get(market.id) || 0}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  const renderActive = () => (
    <div className="active-tab">
      <h3>Active Hacking Attempts</h3>
      {activeAttempts.length === 0 ? (
        <p>No active hacking attempts.</p>
      ) : (
        <div className="attempts-list">
          {activeAttempts.map(attempt => (
            <div key={attempt.id} className="attempt-card">
              <div className="attempt-header">
                <h4>Target: {attempt.targetId}</h4>
                <div className={`status ${attempt.status}`}>{attempt.status}</div>
              </div>
              
              <div className="attempt-progress">
                <div className="phase">Phase: {attempt.phase}</div>
                <div className="progress-bar">
                  <div 
                    className="progress-fill" 
                    style={{ width: `${attempt.progress.overallProgress}%` }}
                  ></div>
                </div>
                <div className="progress-text">
                  {attempt.progress.overallProgress.toFixed(1)}%
                </div>
              </div>
              
              <div className="attempt-stats">
                <div>Detection Risk: {attempt.detection.riskAccumulated.toFixed(1)}%</div>
                <div>Detected: {attempt.detection.detected ? 'Yes' : 'No'}</div>
                <div>Traceback Level: {attempt.detection.tracebackLevel}</div>
              </div>
              
              {attempt.status === 'active' && (
                <div className="attempt-actions">
                  <button 
                    className="minigame-button"
                    onClick={() => handleStartMinigame(attempt.id)}
                  >
                    Continue Hacking
                  </button>
                  <button 
                    className="abort-button"
                    onClick={() => handleAbortAttempt(attempt.id)}
                  >
                    Abort
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
      
      {activeMinigame && renderMinigame()}
    </div>
  );

  const renderStats = () => (
    <div className="stats-tab">
      <h3>Hacking Statistics</h3>
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-value">{stats.attemptsTotal}</div>
          <div className="stat-label">Total Attempts</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{stats.attemptsSuccessful}</div>
          <div className="stat-label">Successful</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{((stats.attemptsSuccessful / Math.max(1, stats.attemptsTotal)) * 100).toFixed(1)}%</div>
          <div className="stat-label">Success Rate</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{stats.timesDetected}</div>
          <div className="stat-label">Times Detected</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{stats.dataStolen}</div>
          <div className="stat-label">Data Files Stolen</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{stats.creditsEarned.toLocaleString()}</div>
          <div className="stat-label">Credits Earned</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{stats.systemsCompromised}</div>
          <div className="stat-label">Systems Compromised</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{stats.skillLevel}</div>
          <div className="stat-label">Skill Level</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{stats.highestAccessLevel}</div>
          <div className="stat-label">Highest Access Level</div>
        </div>
      </div>
      
      <div className="progression-info">
        <h4>Skill Progression</h4>
        <div className="experience-bar">
          <div 
            className="experience-fill" 
            style={{ width: `${(stats.experience / (stats.skillLevel * 1000)) * 100}%` }}
          ></div>
        </div>
        <div className="experience-text">
          {stats.experience} / {stats.skillLevel * 1000} XP to next level
        </div>
      </div>
      
      {stats.specializations.length > 0 && (
        <div className="specializations">
          <h4>Specializations</h4>
          <div className="specialization-list">
            {stats.specializations.map(spec => (
              <div key={spec} className="specialization">{spec}</div>
            ))}
          </div>
        </div>
      )}
    </div>
  );

  const renderMinigame = () => {
    if (!activeMinigame) return null;
    
    return (
      <div className="minigame-overlay">
        <div className="minigame-modal">
          <h3>Hacking Minigame: {activeMinigame.type.replace('-', ' ')}</h3>
          <div className="minigame-difficulty">Difficulty: {activeMinigame.difficulty}</div>
          {activeMinigame.timeLimit && (
            <div className="time-limit">Time Limit: {activeMinigame.timeLimit}s</div>
          )}
          
          <div className="minigame-content">
            {renderMinigameContent(activeMinigame)}
          </div>
          
          <div className="minigame-actions">
            <button onClick={() => handleMinigameComplete(true, 80)}>
              Success (80%)
            </button>
            <button onClick={() => handleMinigameComplete(false, 30)}>
              Fail (30%)
            </button>
            <button onClick={() => setActiveMinigame(null)}>
              Cancel
            </button>
          </div>
        </div>
      </div>
    );
  };

  const renderMinigameContent = (minigame: HackingMinigame) => {
    switch (minigame.type) {
      case 'password-crack':
        return (
          <div className="password-crack">
            <p>Crack the password using the given constraints:</p>
            <div>Length: {minigame.parameters.length}</div>
            <div>Complexity: {minigame.parameters.complexity}/4</div>
            <div>Attempts remaining: {minigame.parameters.attempts}</div>
            <input 
              type="text" 
              placeholder="Enter password guess..."
              value={minigameInput}
              onChange={(e) => setMinigameInput(e.target.value)}
            />
          </div>
        );
      
      case 'pattern-match':
        return (
          <div className="pattern-match">
            <p>Match the patterns in the correct sequence:</p>
            <div>Grid Size: {minigame.parameters.gridSize}x{minigame.parameters.gridSize}</div>
            <div>Patterns: {minigame.parameters.patternCount}</div>
            <div>Time per pattern: {minigame.parameters.timePerPattern}s</div>
          </div>
        );
      
      case 'circuit-bypass':
        return (
          <div className="circuit-bypass">
            <p>Bypass the circuit security:</p>
            <div>Complexity: {minigame.parameters.complexity}/10</div>
            <div>Components: {minigame.parameters.components}</div>
            <div>Error tolerance: {minigame.parameters.errorTolerance}</div>
          </div>
        );
      
      case 'code-inject':
        return (
          <div className="code-inject">
            <p>Inject code into the system:</p>
            <div>Code length: {minigame.parameters.codeLength}</div>
            <div>Syntax complexity: {minigame.parameters.syntaxComplexity}/5</div>
            <div>Injection points: {minigame.parameters.injectionPoints}</div>
          </div>
        );
      
      default:
        return <div>Unknown minigame type</div>;
    }
  };

  const handleStartHacking = () => {
    if (!selectedTarget || !selectedEquipment) return;
    
    const attempt = hackingManager.startHackingAttempt(
      selectedTarget.id,
      selectedEquipment,
      selectedSoftware
    );
    
    if (attempt) {
      setSelectedTarget(null);
      setSelectedEquipment('');
      setSelectedSoftware([]);
      setActiveTab('active');
    }
  };

  const handleStartMinigame = (attemptId: string) => {
    const minigame = hackingManager.generateMinigame(attemptId);
    if (minigame) {
      setActiveMinigame(minigame);
    }
  };

  const handleMinigameComplete = (success: boolean, score: number) => {
    if (activeMinigame) {
      const activeAttempt = activeAttempts.find(attempt => attempt.status === 'active');
      if (activeAttempt) {
        hackingManager.completeMinigame(activeAttempt.id, success, score);
      }
      setActiveMinigame(null);
      setMinigameInput('');
    }
  };

  const handleAbortAttempt = (attemptId: string) => {
    // Implementation would abort the hacking attempt
    console.log('Aborting attempt:', attemptId);
  };

  const handlePurchaseEquipment = (equipmentId: string) => {
    if (hackingManager.purchaseEquipment(equipmentId)) {
      // Update credits if purchase successful
      // This would be handled by the parent component
      console.log('Equipment purchased:', equipmentId);
    }
  };

  const handlePurchaseSoftware = (softwareId: string) => {
    if (hackingManager.purchaseSoftware(softwareId)) {
      // Update credits if purchase successful
      // This would be handled by the parent component
      console.log('Software purchased:', softwareId);
    }
  };

  const handleSellData = (dataId: string) => {
    // For simplicity, sell to first available market
    const market = dataMarkets[0];
    if (market) {
      const transaction = hackingManager.sellDataToMarket(dataId, market.id);
      if (transaction) {
        onCreditsChange(transaction.price);
        console.log('Data sold for', transaction.price, 'credits');
      }
    }
  };

  return (
    <div className="hacking-panel">
      <div className="panel-header">
        <h2>🖥️ Hacking & Electronic Warfare</h2>
        <button className="close-button" onClick={onClose}>×</button>
      </div>

      <div className="panel-tabs">
        {renderTabButton('targets', 'Targets', availableTargets.length)}
        {renderTabButton('equipment', 'Equipment')}
        {renderTabButton('data', 'Data', stolenData.length)}
        {renderTabButton('market', 'Market', dataMarkets.length)}
        {renderTabButton('active', 'Active', activeAttempts.length)}
        {renderTabButton('stats', 'Stats')}
      </div>

      <div className="panel-content">
        {activeTab === 'targets' && renderTargets()}
        {activeTab === 'equipment' && renderEquipment()}
        {activeTab === 'data' && renderData()}
        {activeTab === 'market' && renderMarket()}
        {activeTab === 'active' && renderActive()}
        {activeTab === 'stats' && renderStats()}
      </div>
    </div>
  );
};