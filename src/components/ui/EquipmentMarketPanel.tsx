import React, { useState, useEffect } from 'react';
import { EquipmentTemplate } from '../../data/equipment';
import { EquipmentMarket, EquipmentMarketItem, EquipmentManager } from '../../systems/EquipmentManager';
import { Ship, EquipmentItem } from '../../types/player';
import Modal from './Modal';

interface EquipmentMarketPanelProps {
  isVisible: boolean;
  onClose: () => void;
  stationId: string;
  stationName: string;
  playerCredits: number;
  currentShip: Ship;
  onPurchaseEquipment: (equipment: EquipmentItem, cost: number) => void;
}

const EquipmentMarketPanel: React.FC<EquipmentMarketPanelProps> = ({
  isVisible,
  onClose,
  stationId,
  stationName,
  playerCredits,
  currentShip,
  onPurchaseEquipment
}) => {
  const [market, setMarket] = useState<EquipmentMarket | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<EquipmentTemplate['category']>('engines');
  const [selectedEquipment, setSelectedEquipment] = useState<EquipmentMarketItem | null>(null);
  const [showInstallPreview, setShowInstallPreview] = useState(false);
  const [equipmentManager] = useState(new EquipmentManager());

  useEffect(() => {
    if (isVisible && stationId) {
      // Initialize or get market for this station
      let stationMarket = equipmentManager.getStationMarket(stationId);
      if (!stationMarket) {
        // Determine station type and tech level from station name/type
        const stationType = 'trade'; // Default, could be determined from station data
        const techLevel = 2; // Default tech level
        stationMarket = equipmentManager.initializeStationMarket(stationId, stationType, techLevel);
      }
      setMarket(stationMarket);
    }
  }, [isVisible, stationId, equipmentManager]);

  if (!isVisible || !market) return null;

  const getFilteredEquipment = (): EquipmentMarketItem[] => {
    return market.availableEquipment.filter(item => item.template.category === selectedCategory);
  };

  const getRarityColor = (rarity: EquipmentTemplate['rarity']): string => {
    switch (rarity) {
      case 'common': return '#9ca3af';
      case 'uncommon': return '#10b981';
      case 'rare': return '#3b82f6';
      case 'legendary': return '#f59e0b';
      default: return '#9ca3af';
    }
  };

  const getConditionColor = (condition: number): string => {
    if (condition >= 0.9) return '#10b981';
    if (condition >= 0.7) return '#facc15';
    if (condition >= 0.5) return '#fb923c';
    return '#ef4444';
  };

  const formatPercentage = (value: number): string => {
    return `${Math.round(value * 100)}%`;
  };

  const handlePurchase = (marketItem: EquipmentMarketItem) => {
    const result = equipmentManager.purchaseEquipment(stationId, marketItem.template.id, playerCredits);
    
    if (result.success && result.equipment && result.cost !== undefined) {
      onPurchaseEquipment(result.equipment, result.cost);
      
      // Update market display
      const updatedMarket = equipmentManager.getStationMarket(stationId);
      if (updatedMarket) {
        setMarket(updatedMarket);
      }
    } else {
      alert(result.error || 'Purchase failed');
    }
  };

  const categories: Array<{ id: EquipmentTemplate['category']; name: string; icon: string }> = [
    { id: 'engines', name: 'Engines', icon: '🚀' },
    { id: 'cargo', name: 'Cargo', icon: '📦' },
    { id: 'shields', name: 'Shields', icon: '🛡️' },
    { id: 'weapons', name: 'Weapons', icon: '⚔️' },
    { id: 'utility', name: 'Utility', icon: '🔧' }
  ];

  const filteredEquipment = getFilteredEquipment();

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
        {/* Header */}
        <div style={{ 
          padding: '20px', 
          borderBottom: '1px solid #374151',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <h2 style={{ color: '#f3f4f6', margin: 0, display: 'flex', alignItems: 'center', gap: '10px' }}>
            🏪 {stationName} - Equipment Market
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

        {/* Category Tabs */}
        <div style={{ display: 'flex', borderBottom: '1px solid #374151' }}>
          {categories.map((category) => (
            <button
              key={category.id}
              onClick={() => setSelectedCategory(category.id)}
              style={{
                padding: '15px 20px',
                backgroundColor: selectedCategory === category.id ? '#374151' : 'transparent',
                color: selectedCategory === category.id ? '#f3f4f6' : '#9ca3af',
                border: 'none',
                borderBottom: selectedCategory === category.id ? '2px solid #60a5fa' : '2px solid transparent',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              <span>{category.icon}</span>
              {category.name}
            </button>
          ))}
        </div>

        {/* Equipment List */}
        <div style={{ flex: 1, overflow: 'auto', padding: '20px' }}>
          <div style={{ marginBottom: '15px', color: '#9ca3af' }}>
            {filteredEquipment.length} {selectedCategory} items available
          </div>

          {filteredEquipment.length === 0 ? (
            <div style={{ 
              textAlign: 'center', 
              color: '#9ca3af', 
              padding: '40px 0',
              borderRadius: '6px',
              border: '2px dashed #374151'
            }}>
              <div style={{ marginBottom: '10px', fontSize: '24px' }}>📭</div>
              <div>No {selectedCategory} equipment available</div>
              <div style={{ fontSize: '14px', marginTop: '5px' }}>Check back later or visit other stations</div>
            </div>
          ) : (
            <div style={{ display: 'grid', gap: '15px' }}>
              {filteredEquipment.map((marketItem, index) => (
                <div key={index} style={{ 
                  backgroundColor: '#1f2937', 
                  padding: '20px', 
                  borderRadius: '8px',
                  border: '1px solid #374151'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '15px' }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '5px' }}>
                        <h3 style={{ margin: 0, color: '#f3f4f6' }}>{marketItem.template.name}</h3>
                        <span style={{ 
                          color: getRarityColor(marketItem.template.rarity),
                          fontSize: '12px',
                          textTransform: 'uppercase',
                          fontWeight: 'bold'
                        }}>
                          {marketItem.template.rarity}
                        </span>
                      </div>
                      <div style={{ color: '#9ca3af', fontSize: '14px', marginBottom: '5px' }}>
                        {marketItem.template.type}
                      </div>
                      <div style={{ color: '#9ca3af', fontSize: '14px' }}>
                        {marketItem.template.description}
                      </div>
                    </div>
                    
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#f3f4f6' }}>
                        {marketItem.price.toLocaleString()} cr
                      </div>
                      <div style={{ fontSize: '12px', color: getConditionColor(marketItem.condition) }}>
                        Condition: {formatPercentage(marketItem.condition)}
                      </div>
                      <div style={{ fontSize: '12px', color: '#9ca3af' }}>
                        Stock: {marketItem.quantity}
                      </div>
                    </div>
                  </div>

                  {/* Equipment Effects */}
                  <div style={{ marginBottom: '15px' }}>
                    <div style={{ fontSize: '14px', fontWeight: 'bold', color: '#60a5fa', marginBottom: '8px' }}>
                      Effects:
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '8px' }}>
                      {Object.entries(marketItem.template.effects).map(([effect, value]) => (
                        <div key={effect} style={{ 
                          fontSize: '12px', 
                          color: '#9ca3af',
                          backgroundColor: '#374151',
                          padding: '4px 8px',
                          borderRadius: '4px'
                        }}>
                          <span style={{ textTransform: 'capitalize' }}>{effect.replace(/([A-Z])/g, ' $1')}: </span>
                          <span style={{ color: '#10b981', fontWeight: 'bold' }}>
                            +{typeof value === 'number' ? (value < 1 ? formatPercentage(value) : value) : value}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div style={{ display: 'flex', gap: '10px' }}>
                    <button
                      onClick={() => handlePurchase(marketItem)}
                      disabled={playerCredits < marketItem.price || marketItem.quantity === 0}
                      style={{
                        padding: '8px 16px',
                        backgroundColor: playerCredits >= marketItem.price && marketItem.quantity > 0 ? '#3b82f6' : '#374151',
                        color: playerCredits >= marketItem.price && marketItem.quantity > 0 ? 'white' : '#9ca3af',
                        border: 'none',
                        borderRadius: '6px',
                        cursor: playerCredits >= marketItem.price && marketItem.quantity > 0 ? 'pointer' : 'not-allowed',
                        fontSize: '14px'
                      }}
                    >
                      Purchase
                    </button>
                    
                    <button
                      onClick={() => {
                        setSelectedEquipment(marketItem);
                        setShowInstallPreview(true);
                      }}
                      style={{
                        padding: '8px 16px',
                        backgroundColor: '#374151',
                        color: '#9ca3af',
                        border: '1px solid #4b5563',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        fontSize: '14px'
                      }}
                    >
                      Preview Installation
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Installation Preview Modal */}
      {showInstallPreview && selectedEquipment && (
        <Modal isOpen={true} onClose={() => setShowInstallPreview(false)} size="medium">
          <div style={{ backgroundColor: '#111827', padding: '20px', borderRadius: '8px' }}>
            <h3 style={{ color: '#f3f4f6', marginBottom: '15px' }}>
              Installation Preview: {selectedEquipment.template.name}
            </h3>
            
            <div style={{ marginBottom: '20px' }}>
              <div style={{ marginBottom: '10px', color: '#9ca3af' }}>
                Select installation slot:
              </div>
              
              <div style={{ display: 'grid', gap: '10px' }}>
                {Object.entries(currentShip.class.equipmentSlots).map(([category, maxSlots]) => {
                  if (category !== selectedEquipment.template.category) return null;
                  
                  const currentCount = currentShip.equipment[category as keyof Ship['equipment']].length;
                  const hasSpace = currentCount < maxSlots;
                  
                  return (
                    <button
                      key={category}
                      onClick={() => {
                        if (hasSpace) {
                          // Would need to purchase first, then install
                          alert('Purchase equipment first, then use Ship Management panel to install');
                        }
                      }}
                      disabled={!hasSpace}
                      style={{
                        padding: '15px',
                        backgroundColor: hasSpace ? '#1f2937' : '#374151',
                        color: hasSpace ? '#f3f4f6' : '#9ca3af',
                        border: hasSpace ? '1px solid #4b5563' : '1px solid #374151',
                        borderRadius: '6px',
                        cursor: hasSpace ? 'pointer' : 'not-allowed',
                        textAlign: 'left'
                      }}
                    >
                      <div style={{ textTransform: 'capitalize', fontWeight: 'bold' }}>
                        {category} Slot ({currentCount}/{maxSlots})
                      </div>
                      <div style={{ fontSize: '12px' }}>
                        {hasSpace ? 'Available for installation' : 'No available slots'}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
            
            <div style={{ textAlign: 'right' }}>
              <button
                onClick={() => setShowInstallPreview(false)}
                style={{
                  padding: '8px 16px',
                  backgroundColor: '#374151',
                  color: '#f3f4f6',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer'
                }}
              >
                Close
              </button>
            </div>
          </div>
        </Modal>
      )}
    </Modal>
  );
};

export default EquipmentMarketPanel;