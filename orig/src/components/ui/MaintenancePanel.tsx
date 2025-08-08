import React, { useState, useEffect } from 'react';
import { 
  MaintenanceManager, 
  MaintenanceScheduleItem, 
  MaintenanceQuote,
  MaintenanceRecord 
} from '../../systems/MaintenanceManager';
import { Ship } from '../../types/player';
import Modal from './Modal';

interface MaintenancePanelProps {
  isVisible: boolean;
  onClose: () => void;
  ship: Ship;
  playerCredits: number;
  stationId: string;
  maintenanceManager: MaintenanceManager;
  onMaintenancePerformed: (cost: number) => void;
}

const MaintenancePanel: React.FC<MaintenancePanelProps> = ({
  isVisible,
  onClose,
  ship,
  playerCredits,
  stationId,
  maintenanceManager,
  onMaintenancePerformed
}) => {
  const [currentTab, setCurrentTab] = useState<'schedule' | 'quote' | 'history'>('schedule');
  const [maintenanceSchedule, setMaintenanceSchedule] = useState<MaintenanceScheduleItem[]>([]);
  const [selectedItems, setSelectedItems] = useState<Set<number>>(new Set());
  const [maintenanceQuote, setMaintenanceQuote] = useState<MaintenanceQuote | null>(null);
  const [maintenanceHistory, setMaintenanceHistory] = useState<MaintenanceRecord[]>([]);
  const [conditionEffects, setConditionEffects] = useState<any>(null);

  useEffect(() => {
    if (isVisible) {
      updateData();
    }
  }, [isVisible, ship]);

  const updateData = () => {
    // Update conditions first
    maintenanceManager.updateConditions(ship);
    
    // Generate maintenance schedule
    const schedule = maintenanceManager.generateMaintenanceSchedule(ship);
    setMaintenanceSchedule(schedule);
    
    // Get condition effects
    const effects = maintenanceManager.getConditionEffects(ship);
    setConditionEffects(effects);
    
    // Get maintenance history
    const history = maintenanceManager.getMaintenanceHistory(ship.id);
    setMaintenanceHistory(history);
    
    // Clear selections
    setSelectedItems(new Set());
    setMaintenanceQuote(null);
  };

  const handleItemSelection = (index: number) => {
    const newSelection = new Set(selectedItems);
    if (newSelection.has(index)) {
      newSelection.delete(index);
    } else {
      newSelection.add(index);
    }
    setSelectedItems(newSelection);
    
    // Update quote
    if (newSelection.size > 0) {
      const selectedScheduleItems = Array.from(newSelection).map(i => maintenanceSchedule[i]);
      const quote = maintenanceManager.generateMaintenanceQuote(ship, selectedScheduleItems);
      setMaintenanceQuote(quote);
    } else {
      setMaintenanceQuote(null);
    }
  };

  const handlePerformMaintenance = () => {
    if (!maintenanceQuote || playerCredits < maintenanceQuote.totalCost) return;
    
    maintenanceManager.performMaintenance(ship, maintenanceQuote.items, stationId);
    onMaintenancePerformed(maintenanceQuote.totalCost);
    updateData();
    setCurrentTab('history');
  };

  const getPriorityColor = (priority: string): string => {
    switch (priority) {
      case 'critical': return '#dc2626'; // Red
      case 'high': return '#ea580c'; // Orange
      case 'medium': return '#ca8a04'; // Yellow
      case 'low': return '#16a34a'; // Green
      default: return '#6b7280'; // Gray
    }
  };

  const formatCondition = (condition: number): string => {
    return `${Math.round(condition * 100)}%`;
  };

  const formatCurrency = (amount: number): string => {
    return amount.toLocaleString() + ' cr';
  };

  const formatTime = (hours: number): string => {
    if (hours < 1) {
      return `${Math.round(hours * 60)} min`;
    }
    return `${hours.toFixed(1)} hours`;
  };

  const renderScheduleTab = () => (
    <div style={{ padding: '20px' }}>
      <h3 style={{ color: '#60a5fa', marginBottom: '15px' }}>Maintenance Schedule</h3>
      
      {/* Ship condition overview */}
      <div style={{ 
        backgroundColor: '#1f2937', 
        padding: '15px', 
        borderRadius: '8px', 
        marginBottom: '20px',
        border: '1px solid #374151'
      }}>
        <h4 style={{ color: '#e2e8f0', marginBottom: '10px' }}>Ship Condition Overview</h4>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px' }}>
          <div style={{ fontSize: '14px', color: '#9ca3af' }}>
            <strong>Hull:</strong> 
            <span style={{ color: ship.condition.hull < 0.5 ? '#dc2626' : '#e2e8f0', marginLeft: '8px' }}>
              {formatCondition(ship.condition.hull)}
            </span>
          </div>
          <div style={{ fontSize: '14px', color: '#9ca3af' }}>
            <strong>Engines:</strong>
            <span style={{ color: ship.condition.engines < 0.5 ? '#dc2626' : '#e2e8f0', marginLeft: '8px' }}>
              {formatCondition(ship.condition.engines)}
            </span>
          </div>
          <div style={{ fontSize: '14px', color: '#9ca3af' }}>
            <strong>Cargo Bay:</strong>
            <span style={{ color: ship.condition.cargo < 0.5 ? '#dc2626' : '#e2e8f0', marginLeft: '8px' }}>
              {formatCondition(ship.condition.cargo)}
            </span>
          </div>
          <div style={{ fontSize: '14px', color: '#9ca3af' }}>
            <strong>Shields:</strong>
            <span style={{ color: ship.condition.shields < 0.5 ? '#dc2626' : '#e2e8f0', marginLeft: '8px' }}>
              {formatCondition(ship.condition.shields)}
            </span>
          </div>
        </div>
      </div>

      {/* Performance effects */}
      {conditionEffects && (
        <div style={{ 
          backgroundColor: '#1f2937', 
          padding: '15px', 
          borderRadius: '8px', 
          marginBottom: '20px',
          border: '1px solid #374151'
        }}>
          <h4 style={{ color: '#e2e8f0', marginBottom: '10px' }}>Performance Impact</h4>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px' }}>
            <div style={{ fontSize: '14px', color: '#9ca3af' }}>
              <strong>Cargo Capacity:</strong>
              <span style={{ 
                color: conditionEffects.cargoCapacityMultiplier < 0.8 ? '#dc2626' : '#e2e8f0', 
                marginLeft: '8px' 
              }}>
                {Math.round(conditionEffects.cargoCapacityMultiplier * 100)}%
              </span>
            </div>
            <div style={{ fontSize: '14px', color: '#9ca3af' }}>
              <strong>Speed:</strong>
              <span style={{ 
                color: conditionEffects.speedMultiplier < 0.8 ? '#dc2626' : '#e2e8f0', 
                marginLeft: '8px' 
              }}>
                {Math.round(conditionEffects.speedMultiplier * 100)}%
              </span>
            </div>
            <div style={{ fontSize: '14px', color: '#9ca3af' }}>
              <strong>Shield Strength:</strong>
              <span style={{ 
                color: conditionEffects.shieldMultiplier < 0.8 ? '#dc2626' : '#e2e8f0', 
                marginLeft: '8px' 
              }}>
                {Math.round(conditionEffects.shieldMultiplier * 100)}%
              </span>
            </div>
            <div style={{ fontSize: '14px', color: '#9ca3af' }}>
              <strong>Fuel Efficiency:</strong>
              <span style={{ 
                color: conditionEffects.fuelEfficiencyMultiplier < 0.8 ? '#dc2626' : '#e2e8f0', 
                marginLeft: '8px' 
              }}>
                {Math.round(conditionEffects.fuelEfficiencyMultiplier * 100)}%
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Maintenance items */}
      <div style={{ marginBottom: '20px' }}>
        <h4 style={{ color: '#e2e8f0', marginBottom: '10px' }}>
          Maintenance Items ({maintenanceSchedule.length})
        </h4>
        
        {maintenanceSchedule.length === 0 ? (
          <div style={{
            textAlign: 'center',
            color: '#16a34a',
            padding: '40px 0',
            borderRadius: '6px',
            border: '2px dashed #374151'
          }}>
            <div style={{ marginBottom: '10px', fontSize: '24px' }}>✅</div>
            <div>All systems are in excellent condition!</div>
            <div style={{ fontSize: '14px', marginTop: '5px' }}>
              No maintenance required at this time.
            </div>
          </div>
        ) : (
          <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
            {maintenanceSchedule.map((item, index) => (
              <div
                key={index}
                style={{
                  backgroundColor: selectedItems.has(index) ? '#1f2937' : '#111827',
                  border: `1px solid ${selectedItems.has(index) ? getPriorityColor(item.priority) : '#374151'}`,
                  borderRadius: '6px',
                  padding: '15px',
                  marginBottom: '10px',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
                onClick={() => handleItemSelection(index)}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', marginBottom: '8px' }}>
                      <div
                        style={{
                          width: '8px',
                          height: '8px',
                          borderRadius: '50%',
                          backgroundColor: getPriorityColor(item.priority),
                          marginRight: '8px'
                        }}
                      />
                      <span style={{ 
                        color: '#e2e8f0', 
                        fontWeight: 'bold',
                        textTransform: 'capitalize'
                      }}>
                        {item.type === 'equipment' ? 
                          (() => {
                            const allEquipment = [
                              ...ship.equipment.engines,
                              ...ship.equipment.cargo,
                              ...ship.equipment.shields,
                              ...ship.equipment.weapons,
                              ...ship.equipment.utility
                            ];
                            return allEquipment.find(e => e.id === item.equipmentId)?.name || 'Equipment';
                          })() :
                          item.type
                        }
                      </span>
                      <span style={{ 
                        color: getPriorityColor(item.priority), 
                        fontSize: '12px',
                        marginLeft: '8px',
                        textTransform: 'uppercase',
                        fontWeight: 'bold'
                      }}>
                        {item.priority}
                      </span>
                    </div>
                    
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
                      <div style={{ fontSize: '12px', color: '#9ca3af' }}>
                        <strong>Condition:</strong> {formatCondition(item.condition)}
                      </div>
                      <div style={{ fontSize: '12px', color: '#9ca3af' }}>
                        <strong>Est. Cost:</strong> {formatCurrency(Math.round(item.maintenanceCost))}
                      </div>
                      <div style={{ fontSize: '12px', color: '#9ca3af' }}>
                        <strong>Priority:</strong> {item.priority}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Selection summary */}
      {selectedItems.size > 0 && (
        <div style={{ 
          backgroundColor: '#1f2937', 
          padding: '15px', 
          borderRadius: '8px',
          border: '1px solid #374151'
        }}>
          <h4 style={{ color: '#e2e8f0', marginBottom: '10px' }}>
            Selected Items ({selectedItems.size})
          </h4>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ fontSize: '14px', color: '#9ca3af' }}>
              Click "Get Quote" to see detailed pricing and time estimates
            </div>
            <button
              onClick={() => setCurrentTab('quote')}
              style={{
                padding: '8px 16px',
                backgroundColor: '#3b82f6',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '14px'
              }}
            >
              Get Quote →
            </button>
          </div>
        </div>
      )}
    </div>
  );

  const renderQuoteTab = () => (
    <div style={{ padding: '20px' }}>
      <h3 style={{ color: '#60a5fa', marginBottom: '15px' }}>Maintenance Quote</h3>
      
      {!maintenanceQuote ? (
        <div style={{
          textAlign: 'center',
          color: '#9ca3af',
          padding: '40px 0'
        }}>
          <div>No items selected for maintenance</div>
          <button
            onClick={() => setCurrentTab('schedule')}
            style={{
              padding: '8px 16px',
              backgroundColor: '#374151',
              color: '#e2e8f0',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              marginTop: '10px'
            }}
          >
            ← Back to Schedule
          </button>
        </div>
      ) : (
        <>
          {/* Quote summary */}
          <div style={{ 
            backgroundColor: '#1f2937', 
            padding: '15px', 
            borderRadius: '8px', 
            marginBottom: '20px',
            border: '1px solid #374151'
          }}>
            <h4 style={{ color: '#e2e8f0', marginBottom: '10px' }}>Quote Summary</h4>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '15px' }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '24px', color: '#3b82f6', fontWeight: 'bold' }}>
                  {maintenanceQuote.items.length}
                </div>
                <div style={{ fontSize: '12px', color: '#9ca3af' }}>Items</div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '24px', color: '#10b981', fontWeight: 'bold' }}>
                  {formatCurrency(maintenanceQuote.totalCost)}
                </div>
                <div style={{ fontSize: '12px', color: '#9ca3af' }}>Total Cost</div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '24px', color: '#f59e0b', fontWeight: 'bold' }}>
                  {formatTime(maintenanceQuote.estimatedTime)}
                </div>
                <div style={{ fontSize: '12px', color: '#9ca3af' }}>Est. Time</div>
              </div>
            </div>
          </div>

          {/* Quote items */}
          <div style={{ marginBottom: '20px' }}>
            <h4 style={{ color: '#e2e8f0', marginBottom: '10px' }}>Quote Details</h4>
            <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
              {maintenanceQuote.items.map((item, index) => (
                <div
                  key={index}
                  style={{
                    backgroundColor: '#111827',
                    border: '1px solid #374151',
                    borderRadius: '6px',
                    padding: '15px',
                    marginBottom: '10px'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', marginBottom: '8px' }}>
                        <div
                          style={{
                            width: '8px',
                            height: '8px',
                            borderRadius: '50%',
                            backgroundColor: getPriorityColor(item.priority),
                            marginRight: '8px'
                          }}
                        />
                        <span style={{ color: '#e2e8f0', fontWeight: 'bold' }}>
                          {item.description}
                        </span>
                      </div>
                      
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px' }}>
                        <div style={{ fontSize: '12px', color: '#9ca3af' }}>
                          <strong>Condition:</strong> {formatCondition(item.currentCondition)} → {formatCondition(item.targetCondition)}
                        </div>
                        <div style={{ fontSize: '12px', color: '#9ca3af' }}>
                          <strong>Time:</strong> {formatTime(item.timeRequired)}
                        </div>
                      </div>
                    </div>
                    <div style={{ textAlign: 'right', marginLeft: '15px' }}>
                      <div style={{ fontSize: '16px', color: '#10b981', fontWeight: 'bold' }}>
                        {formatCurrency(item.cost)}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Action buttons */}
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <button
              onClick={() => setCurrentTab('schedule')}
              style={{
                padding: '12px 24px',
                backgroundColor: '#374151',
                color: '#e2e8f0',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer'
              }}
            >
              ← Back to Schedule
            </button>
            <button
              onClick={handlePerformMaintenance}
              disabled={playerCredits < maintenanceQuote.totalCost}
              style={{
                padding: '12px 24px',
                backgroundColor: playerCredits >= maintenanceQuote.totalCost ? '#10b981' : '#374151',
                color: playerCredits >= maintenanceQuote.totalCost ? 'white' : '#9ca3af',
                border: 'none',
                borderRadius: '6px',
                cursor: playerCredits >= maintenanceQuote.totalCost ? 'pointer' : 'not-allowed'
              }}
            >
              {playerCredits >= maintenanceQuote.totalCost ? 
                `Perform Maintenance (${formatCurrency(maintenanceQuote.totalCost)})` :
                `Insufficient Credits (${formatCurrency(maintenanceQuote.totalCost)})`
              }
            </button>
          </div>
        </>
      )}
    </div>
  );

  const renderHistoryTab = () => (
    <div style={{ padding: '20px' }}>
      <h3 style={{ color: '#60a5fa', marginBottom: '15px' }}>Maintenance History</h3>
      
      {maintenanceHistory.length === 0 ? (
        <div style={{
          textAlign: 'center',
          color: '#9ca3af',
          padding: '40px 0',
          borderRadius: '6px',
          border: '2px dashed #374151'
        }}>
          <div style={{ marginBottom: '10px', fontSize: '24px' }}>📋</div>
          <div>No maintenance history</div>
          <div style={{ fontSize: '14px', marginTop: '5px' }}>
            Maintenance records will appear here after service
          </div>
        </div>
      ) : (
        <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
          {maintenanceHistory.map((record, index) => (
            <div
              key={index}
              style={{
                backgroundColor: '#111827',
                border: '1px solid #374151',
                borderRadius: '6px',
                padding: '15px',
                marginBottom: '10px'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ color: '#e2e8f0', fontWeight: 'bold', marginBottom: '5px' }}>
                    {record.description}
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px' }}>
                    <div style={{ fontSize: '12px', color: '#9ca3af' }}>
                      <strong>Station:</strong> {record.stationId}
                    </div>
                    <div style={{ fontSize: '12px', color: '#9ca3af' }}>
                      <strong>Date:</strong> {new Date(record.performedAt).toLocaleDateString()}
                    </div>
                  </div>
                </div>
                <div style={{ textAlign: 'right', marginLeft: '15px' }}>
                  <div style={{ fontSize: '16px', color: '#10b981', fontWeight: 'bold' }}>
                    {formatCurrency(record.cost)}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  if (!isVisible) return null;

  return (
    <Modal isOpen={isVisible} onClose={onClose}>
      <div style={{ 
        backgroundColor: '#0f172a', 
        borderRadius: '8px', 
        width: '90vw', 
        maxWidth: '800px',
        maxHeight: '90vh',
        display: 'flex',
        flexDirection: 'column'
      }}>
        {/* Header */}
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          padding: '20px',
          borderBottom: '1px solid #1e293b'
        }}>
          <h2 style={{ color: '#e2e8f0', margin: 0 }}>
            🔧 Ship Maintenance - {ship.name}
          </h2>
          <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
            <div style={{ color: '#10b981', fontSize: '16px', fontWeight: 'bold' }}>
              💰 {formatCurrency(playerCredits)}
            </div>
            <button
              onClick={onClose}
              style={{
                background: 'none',
                border: 'none',
                color: '#9ca3af',
                fontSize: '24px',
                cursor: 'pointer',
                padding: '0',
                lineHeight: 1
              }}
            >
              ✕
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div style={{ 
          display: 'flex', 
          borderBottom: '1px solid #1e293b',
          backgroundColor: '#1e293b'
        }}>
          {[
            { id: 'schedule', label: '📋 Schedule', icon: '📋' },
            { id: 'quote', label: '💰 Quote', icon: '💰' },
            { id: 'history', label: '📚 History', icon: '📚' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setCurrentTab(tab.id as any)}
              style={{
                flex: 1,
                padding: '15px',
                backgroundColor: currentTab === tab.id ? '#0f172a' : 'transparent',
                color: currentTab === tab.id ? '#60a5fa' : '#9ca3af',
                border: 'none',
                borderBottom: currentTab === tab.id ? '2px solid #60a5fa' : '2px solid transparent',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: 'bold',
                transition: 'all 0.2s'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                <span style={{ fontSize: '16px' }}>{tab.icon}</span>
                <span>{tab.label.split(' ')[1]}</span>
              </div>
            </button>
          ))}
        </div>

        {/* Content */}
        <div style={{ flex: 1, overflowY: 'auto' }}>
          {currentTab === 'schedule' && renderScheduleTab()}
          {currentTab === 'quote' && renderQuoteTab()}
          {currentTab === 'history' && renderHistoryTab()}
        </div>
      </div>
    </Modal>
  );
};

export default MaintenancePanel;