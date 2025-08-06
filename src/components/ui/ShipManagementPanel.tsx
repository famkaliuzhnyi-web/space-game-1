import React, { useState } from 'react';
import { Ship, EquipmentItem } from '../../types/player';
import Modal from './Modal';

interface ShipManagementPanelProps {
  isVisible: boolean;
  onClose: () => void;
  currentShip: Ship;
  playerCredits: number;
  onRepairShip?: (repairType: 'hull' | 'engines' | 'cargo' | 'shields') => void;
  onOpenEquipmentMarket?: () => void;
}

const ShipManagementPanel: React.FC<ShipManagementPanelProps> = ({
  isVisible,
  onClose,
  currentShip,
  playerCredits,
  onRepairShip,
  onOpenEquipmentMarket
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'equipment' | 'maintenance'>('overview');

  if (!isVisible) return null;

  const getConditionColor = (condition: number): string => {
    if (condition >= 0.8) return '#4ade80'; // green
    if (condition >= 0.5) return '#facc15'; // yellow
    if (condition >= 0.3) return '#fb923c'; // orange
    return '#ef4444'; // red
  };

  const getConditionText = (condition: number): string => {
    if (condition >= 0.9) return 'Excellent';
    if (condition >= 0.7) return 'Good';
    if (condition >= 0.5) return 'Fair';
    if (condition >= 0.3) return 'Poor';
    return 'Critical';
  };

  const formatPercentage = (value: number): string => {
    return `${Math.round(value * 100)}%`;
  };

  const calculateRepairCost = (component: string, currentCondition: number): number => {
    const baseCost = {
      hull: 1000,
      engines: 800,
      cargo: 500,
      shields: 600
    };
    const damageFactor = (1 - currentCondition);
    return Math.round((baseCost[component as keyof typeof baseCost] || 500) * damageFactor);
  };

  const renderOverviewTab = () => (
    <div style={{ padding: '20px' }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
        <div>
          <h3 style={{ color: '#60a5fa', marginBottom: '10px' }}>Ship Information</h3>
          <div style={{ background: '#1f2937', padding: '15px', borderRadius: '8px' }}>
            <div style={{ marginBottom: '8px' }}>
              <strong>Name:</strong> {currentShip.name}
            </div>
            <div style={{ marginBottom: '8px' }}>
              <strong>Class:</strong> {currentShip.class.name}
            </div>
            <div style={{ marginBottom: '8px' }}>
              <strong>Category:</strong> {currentShip.class.category}
            </div>
            <div>
              <strong>Location:</strong> {currentShip.location.stationId || 'In Transit'}
            </div>
          </div>
        </div>

        <div>
          <h3 style={{ color: '#60a5fa', marginBottom: '10px' }}>Performance Stats</h3>
          <div style={{ background: '#1f2937', padding: '15px', borderRadius: '8px' }}>
            <div style={{ marginBottom: '8px' }}>
              <strong>Cargo Capacity:</strong> {currentShip.class.baseCargoCapacity} units
            </div>
            <div style={{ marginBottom: '8px' }}>
              <strong>Fuel Capacity:</strong> {currentShip.class.baseFuelCapacity} units
            </div>
            <div style={{ marginBottom: '8px' }}>
              <strong>Speed:</strong> {currentShip.class.baseSpeed} units/h
            </div>
            <div>
              <strong>Shield Strength:</strong> {currentShip.class.baseShields} points
            </div>
          </div>
        </div>
      </div>

      <div>
        <h3 style={{ color: '#60a5fa', marginBottom: '10px' }}>Ship Condition</h3>
        <div style={{ background: '#1f2937', padding: '15px', borderRadius: '8px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '15px' }}>
            {Object.entries(currentShip.condition).map(([component, condition]) => {
              if (component === 'lastMaintenance') return null;
              
              return (
                <div key={component} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ textTransform: 'capitalize' }}>{component}:</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{ color: getConditionColor(condition as number) }}>
                      {getConditionText(condition as number)} ({formatPercentage(condition as number)})
                    </span>
                    {(condition as number) < 0.9 && (
                      <button
                        onClick={() => onRepairShip?.(component as any)}
                        style={{
                          padding: '4px 8px',
                          fontSize: '12px',
                          backgroundColor: '#3b82f6',
                          color: 'white',
                          border: 'none',
                          borderRadius: '4px',
                          cursor: 'pointer'
                        }}
                      >
                        Repair ({calculateRepairCost(component, condition as number)} cr)
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
          
          <div style={{ marginTop: '15px', paddingTop: '15px', borderTop: '1px solid #374151' }}>
            <div style={{ fontSize: '14px', color: '#9ca3af' }}>
              Last Maintenance: {new Date(currentShip.condition.lastMaintenance).toLocaleString()}
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderEquipmentTab = () => (
    <div style={{ padding: '20px' }}>
      <h3 style={{ color: '#60a5fa', marginBottom: '15px' }}>Equipment Slots</h3>
      
      {Object.entries(currentShip.class.equipmentSlots).map(([slotType, maxSlots]) => (
        <div key={slotType} style={{ marginBottom: '20px' }}>
          <h4 style={{ textTransform: 'capitalize', marginBottom: '10px' }}>
            {slotType} ({currentShip.equipment[slotType as keyof typeof currentShip.equipment].length}/{maxSlots})
          </h4>
          
          <div style={{ background: '#1f2937', padding: '15px', borderRadius: '8px' }}>
            {currentShip.equipment[slotType as keyof typeof currentShip.equipment].length > 0 ? (
              currentShip.equipment[slotType as keyof typeof currentShip.equipment].map((item: EquipmentItem, index: number) => (
                <div key={index} style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center',
                  padding: '8px 0',
                  borderBottom: index < currentShip.equipment[slotType as keyof typeof currentShip.equipment].length - 1 ? '1px solid #374151' : 'none'
                }}>
                  <div>
                    <div style={{ fontWeight: 'bold' }}>{item.name}</div>
                    <div style={{ fontSize: '12px', color: '#9ca3af' }}>
                      Condition: {formatPercentage(item.condition)}
                    </div>
                  </div>
                  <button
                    style={{
                      padding: '4px 8px',
                      fontSize: '12px',
                      backgroundColor: '#ef4444',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer'
                    }}
                  >
                    Remove
                  </button>
                </div>
              ))
            ) : (
              <div style={{ 
                textAlign: 'center', 
                color: '#9ca3af', 
                padding: '20px 0',
                borderRadius: '6px',
                border: '2px dashed #374151'
              }}>
                <div style={{ marginBottom: '10px' }}>🔧</div>
                <div>No equipment installed</div>
                <button
                  onClick={() => onOpenEquipmentMarket?.()}
                  style={{
                    marginTop: '10px',
                    padding: '6px 12px',
                    fontSize: '12px',
                    backgroundColor: '#3b82f6',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer'
                  }}
                >
                  Browse Equipment
                </button>
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );

  const renderMaintenanceTab = () => (
    <div style={{ padding: '20px' }}>
      <h3 style={{ color: '#60a5fa', marginBottom: '15px' }}>Maintenance & Repairs</h3>
      
      <div style={{ background: '#1f2937', padding: '15px', borderRadius: '8px', marginBottom: '20px' }}>
        <h4 style={{ marginBottom: '10px' }}>Scheduled Maintenance</h4>
        <div style={{ fontSize: '14px', color: '#9ca3af', marginBottom: '15px' }}>
          Regular maintenance improves equipment lifespan and performance
        </div>
        
        <button
          style={{
            padding: '10px 20px',
            backgroundColor: '#059669',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            marginRight: '10px'
          }}
        >
          Full Service (2,500 cr)
        </button>
        
        <button
          style={{
            padding: '10px 20px',
            backgroundColor: '#3b82f6',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer'
          }}
        >
          Basic Check (500 cr)
        </button>
      </div>

      <div style={{ background: '#1f2937', padding: '15px', borderRadius: '8px' }}>
        <h4 style={{ marginBottom: '10px' }}>Repair Services</h4>
        <div style={{ fontSize: '14px', color: '#9ca3af', marginBottom: '15px' }}>
          Emergency repairs for damaged ship systems
        </div>
        
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px' }}>
          {Object.entries(currentShip.condition).map(([component, condition]) => {
            if (component === 'lastMaintenance') return null;
            
            const repairCost = calculateRepairCost(component, condition as number);
            const needsRepair = (condition as number) < 0.9;
            
            return (
              <button
                key={component}
                onClick={() => needsRepair && onRepairShip?.(component as any)}
                disabled={!needsRepair || playerCredits < repairCost}
                style={{
                  padding: '10px',
                  backgroundColor: needsRepair ? '#3b82f6' : '#374151',
                  color: needsRepair ? 'white' : '#9ca3af',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: needsRepair && playerCredits >= repairCost ? 'pointer' : 'not-allowed',
                  textAlign: 'left'
                }}
              >
                <div style={{ textTransform: 'capitalize', fontWeight: 'bold' }}>{component}</div>
                <div style={{ fontSize: '12px' }}>
                  {needsRepair ? `${repairCost} cr` : 'No repair needed'}
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );

  return (
    <Modal isOpen={isVisible} onClose={onClose} size="large">
      <div style={{ 
        backgroundColor: '#111827', 
        borderRadius: '8px', 
        border: '1px solid #374151',
        maxHeight: '80vh',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column'
      }}>
        <div style={{ 
          padding: '20px', 
          borderBottom: '1px solid #374151',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <h2 style={{ color: '#f3f4f6', margin: 0, display: 'flex', alignItems: 'center', gap: '10px' }}>
            🚀 Ship Management
          </h2>
          <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
            <div style={{ color: '#f3f4f6' }}>💰 {playerCredits.toLocaleString()} credits</div>
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
        </div>

        <div style={{ display: 'flex', borderBottom: '1px solid #374151' }}>
          {[
            { id: 'overview', label: 'Overview', icon: '📊' },
            { id: 'equipment', label: 'Equipment', icon: '⚙️' },
            { id: 'maintenance', label: 'Maintenance', icon: '🔧' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              style={{
                padding: '15px 20px',
                backgroundColor: activeTab === tab.id ? '#374151' : 'transparent',
                color: activeTab === tab.id ? '#f3f4f6' : '#9ca3af',
                border: 'none',
                borderBottom: activeTab === tab.id ? '2px solid #60a5fa' : '2px solid transparent',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              <span>{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>

        <div style={{ flex: 1, overflow: 'auto' }}>
          {activeTab === 'overview' && renderOverviewTab()}
          {activeTab === 'equipment' && renderEquipmentTab()}
          {activeTab === 'maintenance' && renderMaintenanceTab()}
        </div>
      </div>
    </Modal>
  );
};

export default ShipManagementPanel;