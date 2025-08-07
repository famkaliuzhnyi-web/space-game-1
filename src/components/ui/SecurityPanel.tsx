import React, { useState } from 'react';
import { SecurityManager } from '../../systems/SecurityManager';

interface SecurityPanelProps {
  securityManager: SecurityManager;
  currentLocation: string;
}

export const SecurityPanel: React.FC<SecurityPanelProps> = ({ securityManager, currentLocation }) => {
  const [activeTab, setActiveTab] = useState<'status' | 'security' | 'warrants' | 'history' | 'enforcement'>('status');

  const legalStatus = securityManager.getPlayerLegalStatus();
  const securityLevel = securityManager.getSecurityLevel(currentLocation);
  const warrants = securityManager.getPlayerWarrants();
  const crimeHistory = securityManager.getPlayerCrimeHistory();
  const lawEnforcement = securityManager.getLawEnforcementPresence(currentLocation);
  const securityEvents = securityManager.getRecentSecurityEvents(10);

  const renderLegalStatus = () => (
    <div className="legal-status">
      <h3>Legal Status</h3>
      <div className={`status-badge ${legalStatus.overall}`}>
        {legalStatus.overall.toUpperCase()}
      </div>
      <div className="status-details">
        <div className="status-item">
          <span className="label">Active Warrants:</span>
          <span className="value">{legalStatus.activeWarrants}</span>
        </div>
        <div className="status-item">
          <span className="label">Total Bounty:</span>
          <span className="value">{legalStatus.totalBounty.toLocaleString()} CR</span>
        </div>
      </div>
      {Object.entries(legalStatus.factionStatus).length > 0 && (
        <div className="faction-status">
          <h4>Faction Status</h4>
          {Object.entries(legalStatus.factionStatus).map(([factionId, status]) => (
            <div key={factionId} className="faction-status-item">
              <span className="faction-name">{factionId.replace('-', ' ')}</span>
              <span className={`status-badge ${status}`}>{status}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  const renderSecurityLevel = () => (
    <div className="security-level">
      <h3>Current Location Security</h3>
      {securityLevel ? (
        <div className="security-info">
          <div className={`security-badge level-${securityLevel.level}`}>
            Level {securityLevel.level}
          </div>
          <h4>{securityLevel.name}</h4>
          <p>{securityLevel.description}</p>
          
          <div className="security-stats">
            <div className="stat-item">
              <span className="label">Response Time:</span>
              <span className="value">{securityLevel.responseTime}s</span>
            </div>
            <div className="stat-item">
              <span className="label">Patrol Coverage:</span>
              <span className="value">{securityLevel.patrolCoverage}%</span>
            </div>
            <div className="stat-item">
              <span className="label">Crime Rate:</span>
              <span className="value">{securityLevel.crimeRate}%</span>
            </div>
            <div className="stat-item">
              <span className="label">Inspection Chance:</span>
              <span className="value">{securityLevel.inspectionChance}%</span>
            </div>
          </div>
          
          <div className="characteristics">
            <h4>Characteristics</h4>
            <ul>
              {securityLevel.characteristics.map((characteristic, index) => (
                <li key={index}>{characteristic}</li>
              ))}
            </ul>
          </div>
        </div>
      ) : (
        <p>Security information not available for this location.</p>
      )}
    </div>
  );

  const renderWarrants = () => (
    <div className="warrants">
      <h3>Active Warrants</h3>
      {warrants.length === 0 ? (
        <p>No active warrants.</p>
      ) : (
        <div className="warrant-list">
          {warrants.map((warrant) => (
            <div key={warrant.id} className={`warrant-item priority-${warrant.priority}`}>
              <div className="warrant-header">
                <span className={`priority-badge ${warrant.priority}`}>
                  {warrant.priority.toUpperCase()}
                </span>
                <span className="bounty">{warrant.bounty.toLocaleString()} CR</span>
              </div>
              <div className="warrant-details">
                <div>Issuing Faction: {warrant.issuingFaction.replace('-', ' ')}</div>
                <div>Jurisdiction: {warrant.jurisdiction.join(', ')}</div>
                {warrant.expirationTime && (
                  <div>Expires: {new Date(warrant.expirationTime).toLocaleDateString()}</div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  const renderCrimeHistory = () => (
    <div className="crime-history">
      <h3>Crime History</h3>
      {crimeHistory.length === 0 ? (
        <p>No criminal record.</p>
      ) : (
        <div className="crime-list">
          {crimeHistory.slice(-10).reverse().map((crime) => (
            <div key={crime.id} className={`crime-item status-${crime.status}`}>
              <div className="crime-header">
                <span className="crime-type">{crime.crimeType.replace('-', ' ')}</span>
                <span className="crime-date">
                  {new Date(crime.timestamp).toLocaleDateString()}
                </span>
              </div>
              <div className="crime-details">
                <div>Location: {crime.location}</div>
                <div>Status: <span className={`status-badge ${crime.status}`}>{crime.status}</span></div>
                <div>Evidence: {crime.evidence.length} item(s)</div>
                {crime.witnesses.length > 0 && (
                  <div>Witnesses: {crime.witnesses.length}</div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  const renderLawEnforcement = () => (
    <div className="law-enforcement">
      <h3>Law Enforcement Presence</h3>
      {lawEnforcement.length === 0 ? (
        <p>No law enforcement units detected in this area.</p>
      ) : (
        <div className="enforcement-list">
          {lawEnforcement.map((unit) => (
            <div key={unit.id} className={`enforcement-unit status-${unit.status}`}>
              <div className="unit-header">
                <span className={`unit-type ${unit.type}`}>{unit.type.toUpperCase()}</span>
                <span className={`unit-status ${unit.status}`}>{unit.status.toUpperCase()}</span>
              </div>
              <div className="unit-details">
                <div>Agency: {unit.agency.replace('-', ' ')}</div>
                <div>Personnel: {unit.equipment.personnelCount}</div>
                <div>Ships: {unit.equipment.ships.join(', ')}</div>
                <div>Equipment: {unit.equipment.specialEquipment.join(', ')}</div>
              </div>
            </div>
          ))}
        </div>
      )}
      
      <div className="security-events">
        <h4>Recent Security Activity</h4>
        {securityEvents.length === 0 ? (
          <p>No recent security activity.</p>
        ) : (
          <div className="event-list">
            {securityEvents.map((event) => (
              <div key={event.id} className={`event-item type-${event.type}`}>
                <div className="event-header">
                  <span className="event-type">{event.type.replace('_', ' ').toUpperCase()}</span>
                  <span className="event-time">
                    {new Date(event.timestamp).toLocaleTimeString()}
                  </span>
                </div>
                <div className="event-location">Location: {event.location}</div>
                {event.participants.length > 0 && (
                  <div className="event-participants">
                    Participants: {event.participants.join(', ')}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="security-panel">
      <div className="panel-header">
        <h2>Security & Law Enforcement</h2>
        <div className="panel-tabs">
          <button
            className={activeTab === 'status' ? 'active' : ''}
            onClick={() => setActiveTab('status')}
          >
            Legal Status
          </button>
          <button
            className={activeTab === 'security' ? 'active' : ''}
            onClick={() => setActiveTab('security')}
          >
            Security Level
          </button>
          {warrants.length > 0 && (
            <button
              className={activeTab === 'warrants' ? 'active' : ''}
              onClick={() => setActiveTab('warrants')}
            >
              Warrants ({warrants.length})
            </button>
          )}
          {crimeHistory.length > 0 && (
            <button
              className={activeTab === 'history' ? 'active' : ''}
              onClick={() => setActiveTab('history')}
            >
              History
            </button>
          )}
          <button
            className={activeTab === 'enforcement' ? 'active' : ''}
            onClick={() => setActiveTab('enforcement')}
          >
            Enforcement
          </button>
        </div>
      </div>

      <div className="panel-content">
        {activeTab === 'status' && renderLegalStatus()}
        {activeTab === 'security' && renderSecurityLevel()}
        {activeTab === 'warrants' && renderWarrants()}
        {activeTab === 'history' && renderCrimeHistory()}
        {activeTab === 'enforcement' && renderLawEnforcement()}
      </div>
    </div>
  );
};