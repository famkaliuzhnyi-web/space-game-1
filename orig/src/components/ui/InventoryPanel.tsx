import React, { useState } from 'react';

export interface InventoryItem {
  id: string;
  name: string;
  type: 'commodity' | 'equipment' | 'material' | 'data';
  quantity: number;
  maxQuantity?: number;
  unitSize: number; // cargo space per unit
  unitMass: number; // mass per unit
  value: number; // credits per unit
  description: string;
  rarity: 'common' | 'uncommon' | 'rare' | 'legendary';
  tradeable: boolean;
  stackable: boolean;
}

export interface CargoHold {
  maxCapacity: number;
  maxMass: number;
  currentCapacity: number;
  currentMass: number;
  items: InventoryItem[];
}

interface InventoryPanelProps {
  cargoHold: CargoHold;
  isVisible: boolean;
  onClose: () => void;
  onItemSelect?: (item: InventoryItem) => void;
  onItemDrop?: (item: InventoryItem, quantity: number) => void;
  onItemTransfer?: (item: InventoryItem, quantity: number) => void;
  allowDrop?: boolean;
  allowTransfer?: boolean;
  title?: string;
}

const InventoryPanel: React.FC<InventoryPanelProps> = ({
  cargoHold,
  isVisible,
  onClose,
  onItemSelect,
  onItemDrop,
  onItemTransfer,
  allowDrop = false,
  allowTransfer = false,
  title = 'Cargo Hold'
}) => {
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);
  const [sortBy, setSortBy] = useState<'name' | 'type' | 'value' | 'quantity'>('name');
  const [filterBy, setFilterBy] = useState<string>('all');

  if (!isVisible) return null;

  const capacityPercentage = (cargoHold.currentCapacity / cargoHold.maxCapacity) * 100;
  const massPercentage = (cargoHold.currentMass / cargoHold.maxMass) * 100;

  const getRarityColor = (rarity: string): string => {
    switch (rarity) {
      case 'common': return '#aaaaaa';
      case 'uncommon': return '#4a90e2';
      case 'rare': return '#9b59b6';
      case 'legendary': return '#f39c12';
      default: return '#aaaaaa';
    }
  };

  const getTypeIcon = (type: string): string => {
    switch (type) {
      case 'commodity': return '📦';
      case 'equipment': return '🔧';
      case 'material': return '⚡';
      case 'data': return '💾';
      default: return '❓';
    }
  };

  const filteredItems = cargoHold.items.filter(item => {
    if (filterBy === 'all') return true;
    return item.type === filterBy;
  });

  const sortedItems = [...filteredItems].sort((a, b) => {
    switch (sortBy) {
      case 'name': return a.name.localeCompare(b.name);
      case 'type': return a.type.localeCompare(b.type);
      case 'value': return b.value - a.value;
      case 'quantity': return b.quantity - a.quantity;
      default: return 0;
    }
  });

  const handleItemClick = (item: InventoryItem) => {
    setSelectedItem(item);
    onItemSelect?.(item);
  };

  const handleDrop = (item: InventoryItem) => {
    if (allowDrop && item.quantity > 0) {
      const quantity = prompt(`How many ${item.name} to drop?`, '1');
      const dropQuantity = parseInt(quantity || '0');
      if (dropQuantity > 0 && dropQuantity <= item.quantity) {
        onItemDrop?.(item, dropQuantity);
      }
    }
  };

  const handleTransfer = (item: InventoryItem) => {
    if (allowTransfer && item.quantity > 0) {
      const quantity = prompt(`How many ${item.name} to transfer?`, '1');
      const transferQuantity = parseInt(quantity || '0');
      if (transferQuantity > 0 && transferQuantity <= item.quantity) {
        onItemTransfer?.(item, transferQuantity);
      }
    }
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.8)',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 1000,
      padding: '20px'
    }}>
      <div style={{
        backgroundColor: '#1e1e1e',
        borderRadius: '8px',
        padding: '20px',
        maxWidth: '800px',
        width: '100%',
        maxHeight: '90vh',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        border: '2px solid #444'
      }}>
        {/* Header */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '20px',
          borderBottom: '1px solid #444',
          paddingBottom: '10px'
        }}>
          <h2 style={{ margin: 0, color: '#fff', fontSize: '1.5rem' }}>
            📦 {title}
          </h2>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              color: '#fff',
              fontSize: '1.5rem',
              cursor: 'pointer',
              padding: '5px'
            }}
          >
            ✕
          </button>
        </div>

        {/* Capacity Display */}
        <div style={{ marginBottom: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
            <span style={{ color: '#fff' }}>
              Capacity: {cargoHold.currentCapacity}/{cargoHold.maxCapacity} units
            </span>
            <span style={{ color: '#fff' }}>
              Mass: {cargoHold.currentMass.toFixed(1)}/{cargoHold.maxMass} tons
            </span>
          </div>
          
          <div style={{ display: 'flex', gap: '10px' }}>
            <div style={{ flex: 1 }}>
              <div style={{
                height: '8px',
                backgroundColor: '#333',
                borderRadius: '4px',
                overflow: 'hidden'
              }}>
                <div style={{
                  height: '100%',
                  width: `${Math.min(capacityPercentage, 100)}%`,
                  backgroundColor: capacityPercentage > 90 ? '#e74c3c' : capacityPercentage > 70 ? '#f39c12' : '#27ae60',
                  transition: 'width 0.3s ease'
                }} />
              </div>
              <div style={{ fontSize: '0.8rem', color: '#aaa', marginTop: '2px' }}>Capacity</div>
            </div>
            
            <div style={{ flex: 1 }}>
              <div style={{
                height: '8px',
                backgroundColor: '#333',
                borderRadius: '4px',
                overflow: 'hidden'
              }}>
                <div style={{
                  height: '100%',
                  width: `${Math.min(massPercentage, 100)}%`,
                  backgroundColor: massPercentage > 90 ? '#e74c3c' : massPercentage > 70 ? '#f39c12' : '#3498db',
                  transition: 'width 0.3s ease'
                }} />
              </div>
              <div style={{ fontSize: '0.8rem', color: '#aaa', marginTop: '2px' }}>Mass</div>
            </div>
          </div>
        </div>

        {/* Controls */}
        <div style={{ 
          display: 'flex', 
          gap: '10px', 
          marginBottom: '20px',
          flexWrap: 'wrap'
        }}>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as 'name' | 'type' | 'value' | 'quantity')}
            style={{
              padding: '5px',
              backgroundColor: '#333',
              color: '#fff',
              border: '1px solid #555',
              borderRadius: '4px'
            }}
          >
            <option value="name">Sort by Name</option>
            <option value="type">Sort by Type</option>
            <option value="value">Sort by Value</option>
            <option value="quantity">Sort by Quantity</option>
          </select>

          <select
            value={filterBy}
            onChange={(e) => setFilterBy(e.target.value)}
            style={{
              padding: '5px',
              backgroundColor: '#333',
              color: '#fff',
              border: '1px solid #555',
              borderRadius: '4px'
            }}
          >
            <option value="all">All Items</option>
            <option value="commodity">Commodities</option>
            <option value="equipment">Equipment</option>
            <option value="material">Materials</option>
            <option value="data">Data</option>
          </select>
        </div>

        {/* Items List */}
        <div style={{
          flex: 1,
          overflowY: 'auto',
          border: '1px solid #444',
          borderRadius: '4px'
        }}>
          {sortedItems.length === 0 ? (
            <div style={{
              padding: '40px',
              textAlign: 'center',
              color: '#888',
              fontSize: '1.1rem'
            }}>
              {filterBy === 'all' ? 'Cargo hold is empty' : `No ${filterBy} items`}
            </div>
          ) : (
            <div style={{ padding: '10px' }}>
              {sortedItems.map((item) => (
                <div
                  key={item.id}
                  onClick={() => handleItemClick(item)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    padding: '10px',
                    marginBottom: '5px',
                    backgroundColor: selectedItem?.id === item.id ? '#444' : '#2a2a2a',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    border: `1px solid ${getRarityColor(item.rarity)}`,
                    transition: 'background-color 0.2s ease'
                  }}
                  onMouseEnter={(e) => {
                    if (selectedItem?.id !== item.id) {
                      (e.currentTarget as HTMLElement).style.backgroundColor = '#333';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (selectedItem?.id !== item.id) {
                      (e.currentTarget as HTMLElement).style.backgroundColor = '#2a2a2a';
                    }
                  }}
                >
                  <span style={{ fontSize: '1.5rem', marginRight: '10px' }}>
                    {getTypeIcon(item.type)}
                  </span>
                  
                  <div style={{ flex: 1 }}>
                    <div style={{ 
                      color: getRarityColor(item.rarity), 
                      fontWeight: 'bold',
                      fontSize: '1rem'
                    }}>
                      {item.name}
                    </div>
                    <div style={{ color: '#aaa', fontSize: '0.8rem' }}>
                      {item.description}
                    </div>
                  </div>
                  
                  <div style={{ 
                    textAlign: 'right',
                    minWidth: '100px',
                    marginLeft: '10px'
                  }}>
                    <div style={{ color: '#fff', fontWeight: 'bold' }}>
                      {item.quantity}x
                    </div>
                    <div style={{ color: '#4a90e2', fontSize: '0.8rem' }}>
                      {item.value.toLocaleString()} cr/unit
                    </div>
                    <div style={{ color: '#888', fontSize: '0.7rem' }}>
                      {(item.unitSize * item.quantity)} units
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Item Details & Actions */}
        {selectedItem && (
          <div style={{
            marginTop: '20px',
            padding: '15px',
            backgroundColor: '#2a2a2a',
            borderRadius: '4px',
            border: '1px solid #444'
          }}>
            <h3 style={{ 
              margin: '0 0 10px 0', 
              color: getRarityColor(selectedItem.rarity),
              fontSize: '1.2rem'
            }}>
              {getTypeIcon(selectedItem.type)} {selectedItem.name}
            </h3>
            
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
              gap: '10px',
              marginBottom: '15px'
            }}>
              <div>
                <strong style={{ color: '#fff' }}>Quantity:</strong> {selectedItem.quantity}
                {selectedItem.maxQuantity && ` / ${selectedItem.maxQuantity}`}
              </div>
              <div>
                <strong style={{ color: '#fff' }}>Unit Value:</strong> {selectedItem.value.toLocaleString()} credits
              </div>
              <div>
                <strong style={{ color: '#fff' }}>Total Value:</strong> {(selectedItem.value * selectedItem.quantity).toLocaleString()} credits
              </div>
              <div>
                <strong style={{ color: '#fff' }}>Unit Size:</strong> {selectedItem.unitSize} cargo units
              </div>
              <div>
                <strong style={{ color: '#fff' }}>Unit Mass:</strong> {selectedItem.unitMass} tons
              </div>
              <div>
                <strong style={{ color: '#fff' }}>Tradeable:</strong> {selectedItem.tradeable ? 'Yes' : 'No'}
              </div>
            </div>
            
            <p style={{ color: '#ccc', margin: '10px 0', lineHeight: '1.4' }}>
              {selectedItem.description}
            </p>
            
            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
              {allowDrop && (
                <button
                  onClick={() => handleDrop(selectedItem)}
                  style={{
                    padding: '8px 16px',
                    backgroundColor: '#e74c3c',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontSize: '0.9rem'
                  }}
                >
                  🗑️ Drop
                </button>
              )}
              
              {allowTransfer && (
                <button
                  onClick={() => handleTransfer(selectedItem)}
                  style={{
                    padding: '8px 16px',
                    backgroundColor: '#3498db',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontSize: '0.9rem'
                  }}
                >
                  📤 Transfer
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default InventoryPanel;