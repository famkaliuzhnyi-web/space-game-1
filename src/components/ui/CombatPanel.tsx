import React, { useState } from 'react';
import { CombatManager } from '../../systems/CombatManager';
import { 
  Weapon, 
  Shield 
} from '../../types/combat';
import './CombatPanel.css';

interface CombatPanelProps {
  combatManager: CombatManager;
  onClose: () => void;
  onCreditsChange?: (newCredits: number) => void;
}

export const CombatPanel: React.FC<CombatPanelProps> = ({ 
  combatManager, 
  onClose
}) => {
  const [activeTab, setActiveTab] = useState<'encounters' | 'weapons' | 'shields' | 'licenses' | 'stats'>('encounters');
  const [selectedWeapon, setSelectedWeapon] = useState<Weapon | null>(null);
  const [selectedShield, setSelectedShield] = useState<Shield | null>(null);

  const combatState = combatManager.getCombatState();
  const activeEncounters = combatManager.getActiveEncounters();
  const availableWeapons = combatManager.getAvailableWeapons();
  const availableShields = combatManager.getAvailableShields();
  const playerLicenses = combatManager.getPlayerLicenses();
  const combatStats = combatManager.getCombatStats();

  const renderTabButton = (tabId: string, label: string, badge?: number) => (
    <button
      key={tabId}
      className={`tab-button ${activeTab === tabId ? 'active' : ''}`}
      onClick={() => setActiveTab(tabId as any)}
    >
      {label}
      {badge !== undefined && badge > 0 && (
        <span className="badge">{badge}</span>
      )}
    </button>
  );

  const renderEncounters = () => (
    <div className="encounters-tab">
      <div className="encounter-controls">
        <button 
          className="trigger-encounter-btn"
          onClick={() => handleTriggerEncounter()}
        >
          🎯 Trigger Random Encounter
        </button>
      </div>

      <h3>Active Combat Encounters</h3>
      {activeEncounters.length === 0 ? (
        <div className="no-encounters">
          <p>No active combat encounters</p>
          <p className="help-text">Click "Trigger Random Encounter" to start a combat scenario</p>
        </div>
      ) : (
        <div className="encounters-list">
          {activeEncounters.map(encounter => (
            <div key={encounter.id} className="encounter-card">
              <div className="encounter-header">
                <h4>{getEncounterTypeName(encounter.type)}</h4>
                <div className={`status ${encounter.status}`}>{encounter.status}</div>
              </div>
              
              <div className="encounter-info">
                <div className="info-row">
                  <span className="label">Location:</span>
                  <span className="value">{encounter.location.systemId}</span>
                </div>
                <div className="info-row">
                  <span className="label">Participants:</span>
                  <span className="value">{encounter.participants.length}</span>
                </div>
                <div className="info-row">
                  <span className="label">Duration:</span>
                  <span className="value">{formatDuration(Date.now() - encounter.startTime)}</span>
                </div>
              </div>

              <div className="participants-list">
                <h5>Participants:</h5>
                {encounter.participants.map(participant => (
                  <div key={participant.id} className={`participant ${participant.type}`}>
                    <div className="participant-info">
                      <span className="name">{participant.name}</span>
                      <span className={`status ${participant.status}`}>{participant.status}</span>
                    </div>
                    <div className="ship-status">
                      <div className="hull-bar">
                        <div className="bar-label">Hull</div>
                        <div className="bar">
                          <div 
                            className="bar-fill hull" 
                            style={{ width: `${(participant.ship.hull.current / participant.ship.hull.maximum) * 100}%` }}
                          ></div>
                        </div>
                        <div className="bar-value">
                          {participant.ship.hull.current}/{participant.ship.hull.maximum}
                        </div>
                      </div>
                      <div className="shields-bar">
                        <div className="bar-label">Shields</div>
                        <div className="bar">
                          <div 
                            className="bar-fill shields" 
                            style={{ width: `${(participant.ship.shields.current / participant.ship.shields.maximum) * 100}%` }}
                          ></div>
                        </div>
                        <div className="bar-value">
                          {participant.ship.shields.current}/{participant.ship.shields.maximum}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="encounter-actions">
                <button 
                  className="combat-action-btn attack"
                  onClick={() => handleCombatAction(encounter.id, 'attack')}
                >
                  ⚔️ Attack
                </button>
                <button 
                  className="combat-action-btn defend"
                  onClick={() => handleCombatAction(encounter.id, 'defend')}
                >
                  🛡️ Defend
                </button>
                <button 
                  className="combat-action-btn retreat"
                  onClick={() => handleCombatAction(encounter.id, 'retreat')}
                >
                  🏃 Retreat
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  const renderWeapons = () => (
    <div className="weapons-tab">
      <div className="weapons-section">
        <h3>Owned Weapons</h3>
        <div className="weapons-grid">
          {combatState.playerWeapons.map((weapon, index) => (
            <div key={`${weapon.id}-${index}`} className="weapon-card owned">
              <div className="weapon-header">
                <h4>{weapon.name}</h4>
                <div className={`weapon-type ${weapon.type}`}>{weapon.type.toUpperCase()}</div>
              </div>
              
              <div className="weapon-stats">
                <div className="stat">
                  <span className="label">Damage:</span>
                  <span className="value">{weapon.stats.damage}</span>
                </div>
                <div className="stat">
                  <span className="label">Accuracy:</span>
                  <span className="value">{(weapon.stats.accuracy * 100).toFixed(0)}%</span>
                </div>
                <div className="stat">
                  <span className="label">Range:</span>
                  <span className="value">{weapon.stats.range.toLocaleString()}km</span>
                </div>
                <div className="stat">
                  <span className="label">Fire Rate:</span>
                  <span className="value">{weapon.stats.fireRate}/min</span>
                </div>
              </div>

              <div className="damage-type">
                <span className={`damage-badge ${weapon.damageType}`}>
                  {weapon.damageType.toUpperCase()}
                </span>
              </div>

              <p className="weapon-description">{weapon.description}</p>
              
              {weapon.license.required && (
                <div className="license-required">
                  ⚠️ Requires {weapon.license.type} license
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="weapons-section">
        <h3>Available Weapons</h3>
        <div className="weapons-grid">
          {availableWeapons
            .filter(weapon => !combatState.playerWeapons.find(owned => owned.id === weapon.id))
            .map(weapon => (
              <div 
                key={weapon.id} 
                className={`weapon-card available ${selectedWeapon?.id === weapon.id ? 'selected' : ''}`}
                onClick={() => setSelectedWeapon(selectedWeapon?.id === weapon.id ? null : weapon)}
              >
                <div className="weapon-header">
                  <h4>{weapon.name}</h4>
                  <div className={`weapon-type ${weapon.type}`}>{weapon.type.toUpperCase()}</div>
                </div>
                
                <div className="weapon-price">{weapon.cost.toLocaleString()} CR</div>
                
                <div className="weapon-stats">
                  <div className="stat">
                    <span className="label">Damage:</span>
                    <span className="value">{weapon.stats.damage}</span>
                  </div>
                  <div className="stat">
                    <span className="label">Accuracy:</span>
                    <span className="value">{(weapon.stats.accuracy * 100).toFixed(0)}%</span>
                  </div>
                  <div className="stat">
                    <span className="label">Range:</span>
                    <span className="value">{weapon.stats.range.toLocaleString()}km</span>
                  </div>
                  <div className="stat">
                    <span className="label">Fire Rate:</span>
                    <span className="value">{weapon.stats.fireRate}/min</span>
                  </div>
                </div>

                <div className="damage-type">
                  <span className={`damage-badge ${weapon.damageType}`}>
                    {weapon.damageType.toUpperCase()}
                  </span>
                </div>

                <div className={`availability ${weapon.availability}`}>
                  {weapon.availability.toUpperCase()}
                </div>

                <p className="weapon-description">{weapon.description}</p>
                
                {weapon.license.required && (
                  <div className="license-required">
                    ⚠️ Requires {weapon.license.type} license
                  </div>
                )}

                <button 
                  className="purchase-button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handlePurchaseWeapon(weapon.id);
                  }}
                >
                  Purchase
                </button>
              </div>
            ))}
        </div>
      </div>
    </div>
  );

  const renderShields = () => (
    <div className="shields-tab">
      <h3>Shield Systems</h3>
      <div className="shields-grid">
        {availableShields.map(shield => (
          <div 
            key={shield.id} 
            className={`shield-card ${selectedShield?.id === shield.id ? 'selected' : ''}`}
            onClick={() => setSelectedShield(selectedShield?.id === shield.id ? null : shield)}
          >
            <div className="shield-header">
              <h4>{shield.name}</h4>
              <div className={`shield-type ${shield.type}`}>{shield.type.toUpperCase()}</div>
            </div>
            
            <div className="shield-price">{shield.cost.toLocaleString()} CR</div>
            
            <div className="shield-stats">
              <div className="stat">
                <span className="label">Strength:</span>
                <span className="value">{shield.stats.strength}</span>
              </div>
              <div className="stat">
                <span className="label">Recharge Rate:</span>
                <span className="value">{shield.stats.rechargeRate}/s</span>
              </div>
              <div className="stat">
                <span className="label">Coverage:</span>
                <span className="value">{(shield.stats.coverage * 100).toFixed(0)}%</span>
              </div>
              <div className="stat">
                <span className="label">Efficiency:</span>
                <span className="value">{(shield.stats.efficiency * 100).toFixed(0)}%</span>
              </div>
            </div>

            <div className="resistances">
              <h5>Damage Resistances:</h5>
              <div className="resistance-list">
                <div className="resistance">
                  <span className="damage-type kinetic">Kinetic:</span>
                  <span className="value">{(shield.resistances.kinetic * 100).toFixed(0)}%</span>
                </div>
                <div className="resistance">
                  <span className="damage-type energy">Energy:</span>
                  <span className="value">{(shield.resistances.energy * 100).toFixed(0)}%</span>
                </div>
                <div className="resistance">
                  <span className="damage-type explosive">Explosive:</span>
                  <span className="value">{(shield.resistances.explosive * 100).toFixed(0)}%</span>
                </div>
                <div className="resistance">
                  <span className="damage-type electromagnetic">EM:</span>
                  <span className="value">{(shield.resistances.electromagnetic * 100).toFixed(0)}%</span>
                </div>
              </div>
            </div>

            <p className="shield-description">{shield.description}</p>
            
            <div className="power-requirement">
              ⚡ Power: {shield.powerRequirement} units
            </div>

            <button className="purchase-button">
              Purchase Shield
            </button>
          </div>
        ))}
      </div>
    </div>
  );

  const renderLicenses = () => (
    <div className="licenses-tab">
      <div className="licenses-section">
        <h3>Your Weapon Licenses</h3>
        {playerLicenses.length === 0 ? (
          <p>No weapon licenses owned</p>
        ) : (
          <div className="licenses-list">
            {playerLicenses.map((license, index) => (
              <div key={index} className={`license-card ${license.status}`}>
                <div className="license-header">
                  <h4>{license.licenseType?.toUpperCase()} License</h4>
                  <div className={`status ${license.status}`}>{license.status}</div>
                </div>
                
                <div className="license-info">
                  <div className="info-row">
                    <span className="label">Issuing Authority:</span>
                    <span className="value">{license.issuingAuthority}</span>
                  </div>
                  <div className="info-row">
                    <span className="label">Issue Date:</span>
                    <span className="value">{new Date(license.issueDate).toLocaleDateString()}</span>
                  </div>
                  <div className="info-row">
                    <span className="label">Expiry Date:</span>
                    <span className="value">{new Date(license.expiryDate).toLocaleDateString()}</span>
                  </div>
                  <div className="info-row">
                    <span className="label">Cost:</span>
                    <span className="value">{license.cost.toLocaleString()} CR</span>
                  </div>
                </div>

                {license.restrictions.length > 0 && (
                  <div className="restrictions">
                    <h5>Restrictions:</h5>
                    {license.restrictions.map((restriction, i) => (
                      <div key={i} className="restriction">
                        <strong>{restriction.type}:</strong> {restriction.description}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="licenses-section">
        <h3>Available Licenses</h3>
        <div className="available-licenses">
          <div className="license-option">
            <h4>Commercial Weapons License</h4>
            <p>Allows use of commercial-grade weapons for trade protection</p>
            <div className="license-details">
              <span className="cost">1,500 CR</span>
              <span className="duration">Valid for 1 year</span>
            </div>
            <button 
              className="purchase-license-btn"
              onClick={() => handlePurchaseLicense('commercial')}
            >
              Purchase License
            </button>
          </div>

          <div className="license-option">
            <h4>Security License</h4>
            <p>Permits use of security-grade weapons for protection services</p>
            <div className="license-details">
              <span className="cost">5,000 CR</span>
              <span className="duration">Valid for 6 months</span>
            </div>
            <button 
              className="purchase-license-btn"
              onClick={() => handlePurchaseLicense('security')}
            >
              Purchase License
            </button>
          </div>

          <div className="license-option">
            <h4>Military License</h4>
            <p>Grants access to military-grade weapons and systems</p>
            <div className="license-details">
              <span className="cost">25,000 CR</span>
              <span className="duration">Valid for 3 months</span>
            </div>
            <button 
              className="purchase-license-btn"
              onClick={() => handlePurchaseLicense('military')}
            >
              Purchase License
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  const renderStats = () => (
    <div className="stats-tab">
      <h3>Combat Statistics</h3>
      
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-value">{combatStats.encountersTotal}</div>
          <div className="stat-label">Total Encounters</div>
        </div>
        
        <div className="stat-card">
          <div className="stat-value">{combatStats.encountersWon}</div>
          <div className="stat-label">Victories</div>
        </div>
        
        <div className="stat-card">
          <div className="stat-value">{combatStats.encountersLost}</div>
          <div className="stat-label">Defeats</div>
        </div>
        
        <div className="stat-card">
          <div className="stat-value">{combatStats.encountersFled}</div>
          <div className="stat-label">Retreated</div>
        </div>
        
        <div className="stat-card">
          <div className="stat-value">
            {combatStats.encountersTotal > 0 
              ? ((combatStats.encountersWon / combatStats.encountersTotal) * 100).toFixed(1) + '%'
              : '0%'
            }
          </div>
          <div className="stat-label">Win Rate</div>
        </div>
        
        <div className="stat-card">
          <div className="stat-value">{combatStats.damageDealt.toLocaleString()}</div>
          <div className="stat-label">Damage Dealt</div>
        </div>
        
        <div className="stat-card">
          <div className="stat-value">{combatStats.damageTaken.toLocaleString()}</div>
          <div className="stat-label">Damage Taken</div>
        </div>
        
        <div className="stat-card">
          <div className="stat-value">{combatStats.shipsDestroyed}</div>
          <div className="stat-label">Ships Destroyed</div>
        </div>
        
        <div className="stat-card">
          <div className="stat-value">{combatStats.weaponsFired}</div>
          <div className="stat-label">Weapons Fired</div>
        </div>
        
        <div className="stat-card">
          <div className="stat-value">
            {combatStats.weaponsFired > 0 
              ? (combatStats.accuracyPercentage * 100).toFixed(1) + '%'
              : '0%'
            }
          </div>
          <div className="stat-label">Accuracy</div>
        </div>
        
        <div className="stat-card">
          <div className="stat-value">{combatStats.criticalHits}</div>
          <div className="stat-label">Critical Hits</div>
        </div>
        
        <div className="stat-card">
          <div className="stat-value">{formatDuration(combatStats.longestBattle * 1000)}</div>
          <div className="stat-label">Longest Battle</div>
        </div>
      </div>

      {combatStats.favoriteWeapon && (
        <div className="favorite-weapon">
          <h4>Favorite Weapon</h4>
          <p>{combatStats.favoriteWeapon}</p>
        </div>
      )}

      {Object.keys(combatStats.reputation).length > 0 && (
        <div className="combat-reputation">
          <h4>Combat Reputation</h4>
          <div className="reputation-list">
            {Object.entries(combatStats.reputation).map(([faction, rep]) => (
              <div key={faction} className="reputation-item">
                <span className="faction">{faction}:</span>
                <span className={`reputation ${rep >= 0 ? 'positive' : 'negative'}`}>
                  {rep > 0 ? '+' : ''}{rep}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );

  const handleTriggerEncounter = () => {
    const encounter = combatManager.triggerRandomEncounter();
    if (encounter) {
      console.log('Combat encounter triggered:', encounter.type);
    } else {
      console.log('Failed to trigger encounter - no current system');
    }
  };

  const handleCombatAction = (encounterId: string, actionType: string) => {
    console.log(`Combat action: ${actionType} in encounter ${encounterId}`);
    // In a real implementation, this would execute the combat action
  };

  const handlePurchaseWeapon = (weaponId: string) => {
    if (combatManager.purchaseWeapon(weaponId)) {
      console.log('Weapon purchased:', weaponId);
    } else {
      console.log('Failed to purchase weapon - insufficient credits');
    }
  };

  const handlePurchaseLicense = (licenseType: string) => {
    if (combatManager.purchaseWeaponLicense(licenseType)) {
      console.log('License purchased:', licenseType);
    } else {
      console.log('Failed to purchase license - insufficient credits');
    }
  };

  const getEncounterTypeName = (type: string): string => {
    const typeNames: Record<string, string> = {
      'pirate-attack': 'Pirate Attack',
      'patrol-inspection': 'Security Patrol',
      'bounty-hunter': 'Bounty Hunter',
      'faction-conflict': 'Factional Conflict',
      'ambush': 'Ambush',
      'mercenary-escort': 'Mercenary Escort'
    };
    return typeNames[type] || type;
  };

  const formatDuration = (ms: number): string => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    
    if (hours > 0) {
      return `${hours}h ${minutes % 60}m`;
    } else if (minutes > 0) {
      return `${minutes}m ${seconds % 60}s`;
    } else {
      return `${seconds}s`;
    }
  };

  return (
    <div className="combat-panel">
      <div className="panel-header">
        <h2>⚔️ Combat & Warfare Systems</h2>
        <button className="close-button" onClick={onClose}>×</button>
      </div>

      <div className="panel-tabs">
        {renderTabButton('encounters', 'Encounters', activeEncounters.length)}
        {renderTabButton('weapons', 'Weapons', combatState.playerWeapons.length)}
        {renderTabButton('shields', 'Shields')}
        {renderTabButton('licenses', 'Licenses', playerLicenses.length)}
        {renderTabButton('stats', 'Stats')}
      </div>

      <div className="panel-content">
        {activeTab === 'encounters' && renderEncounters()}
        {activeTab === 'weapons' && renderWeapons()}
        {activeTab === 'shields' && renderShields()}
        {activeTab === 'licenses' && renderLicenses()}
        {activeTab === 'stats' && renderStats()}
      </div>
    </div>
  );
};