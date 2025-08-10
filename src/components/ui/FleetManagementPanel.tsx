import React, { useState, useEffect } from 'react';
import { Ship } from '../../types/player';
import { ShipStorageManager, ShipYardOffer } from '../../systems/ShipStorageManager';
// import { ShipConstructionConfig } from '../../systems/ShipConstructionSystem'; // DEPRECATED: No longer used
import { ShipHubDesign } from '../../types/shipHubs';
import Modal from './Modal';
// import ShipConstructionPanel from './ShipConstructionPanel'; // DEPRECATED: Replaced with 3D system
// import HubShipDesigner from './HubShipDesigner'; // DEPRECATED: Replaced with ThreeDShipDesigner
import ThreeDShipDesigner from './ThreeDShipDesigner';

interface FleetManagementPanelProps {
  isVisible: boolean;
  onClose: () => void;
  playerCredits: number;
  currentShipId: string;
  ownedShips: Ship[];
  stationId: string;
  stationName: string;
  stationType?: string;
  techLevel?: number;
  onSwitchShip: (shipId: string) => void;
  onPurchaseShip: (shipId: string) => void;
  // onConstructShip?: (config: ShipConstructionConfig) => void; // DEPRECATED: Use 3D construction
  onConstructHubShip?: (design: ShipHubDesign, shipName: string) => void;
  onStoreShip: (shipId: string) => void;
  onRetrieveShip: (shipId: string) => void;
}

const FleetManagementPanel: React.FC<FleetManagementPanelProps> = ({
  isVisible,
  onClose,
  playerCredits,
  currentShipId,
  ownedShips,
  stationId,
  stationName,
  stationType = 'trade',
  techLevel = 1,
  onSwitchShip,
  onPurchaseShip,
  // onConstructShip, // DEPRECATED: Removed traditional construction
  onConstructHubShip,
  onStoreShip,
  onRetrieveShip
}) => {
  const [activeTab, setActiveTab] = useState<'fleet' | 'storage' | 'shipyard' | 'construction'>('fleet');
  const [shipStorage] = useState(new ShipStorageManager());
  const [availableShips, setAvailableShips] = useState<ShipYardOffer[]>([]);
  const [storedShips, setStoredShips] = useState<any[]>([]);
  // const [showConstructionPanel, setShowConstructionPanel] = useState(false); // DEPRECATED: Removed traditional construction
  const [showHubDesigner, setShowHubDesigner] = useState(false);

  useEffect(() => {
    if (isVisible) {
      // Load shipyard offers and stored ships
      setAvailableShips(shipStorage.getShipYardOffers(stationId));
      setStoredShips(shipStorage.getShipsAtStation(stationId));
    }
  }, [isVisible, stationId, shipStorage]);

  if (!isVisible) return null;

  const shipsAtStation = ownedShips.filter(ship => ship.location.stationId === stationId);
  // const currentShip = ownedShips.find(ship => ship.id === currentShipId); // Currently unused

  const getConditionColor = (condition: number): string => {
    if (condition >= 0.8) return '#4ade80';
    if (condition >= 0.5) return '#facc15';
    if (condition >= 0.3) return '#fb923c';
    return '#ef4444';
  };

  const getConditionText = (condition: number): string => {
    if (condition >= 0.9) return 'Excellent';
    if (condition >= 0.7) return 'Good';
    if (condition >= 0.5) return 'Fair';
    if (condition >= 0.3) return 'Poor';
    return 'Critical';
  };

  // const formatPercentage = (value: number): string => {
  //   return `${Math.round(value * 100)}%`;
  // }; // Currently unused

  const renderFleetTab = () => (
    <div style={{ padding: '20px' }}>
      <h3 style={{ color: '#60a5fa', marginBottom: '15px' }}>Your Fleet</h3>
      
      <div style={{ marginBottom: '20px', color: '#9ca3af' }}>
        {ownedShips.length} ships owned • {shipsAtStation.length} at this station
      </div>

      <div style={{ display: 'grid', gap: '15px' }}>
        {shipsAtStation.map((ship) => (
          <div key={ship.id} style={{
            backgroundColor: ship.id === currentShipId ? '#1e3a8a' : '#1f2937',
            padding: '20px',
            borderRadius: '8px',
            border: ship.id === currentShipId ? '2px solid #3b82f6' : '1px solid #374151'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
                  <h4 style={{ margin: 0, color: '#f3f4f6' }}>{ship.name}</h4>
                  {ship.id === currentShipId && (
                    <span style={{
                      backgroundColor: '#3b82f6',
                      color: 'white',
                      padding: '2px 8px',
                      borderRadius: '12px',
                      fontSize: '12px'
                    }}>
                      ACTIVE
                    </span>
                  )}
                </div>
                
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px', marginBottom: '15px' }}>
                  <div style={{ fontSize: '14px', color: '#9ca3af' }}>
                    <strong>Class:</strong> {ship.class.name}
                  </div>
                  <div style={{ fontSize: '14px', color: '#9ca3af' }}>
                    <strong>Cargo:</strong> {ship.cargo.used}/{ship.cargo.capacity}
                  </div>
                  <div style={{ fontSize: '14px', color: '#9ca3af' }}>
                    <strong>Hull:</strong> <span style={{ color: getConditionColor(ship.condition.hull) }}>
                      {getConditionText(ship.condition.hull)}
                    </span>
                  </div>
                  <div style={{ fontSize: '14px', color: '#9ca3af' }}>
                    <strong>Speed:</strong> {ship.class.baseSpeed} units/h
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '10px' }}>
                  {ship.id !== currentShipId && (
                    <button
                      onClick={() => onSwitchShip(ship.id)}
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
                      Switch To Ship
                    </button>
                  )}
                  
                  {ship.id !== currentShipId && (
                    <button
                      onClick={() => onStoreShip(ship.id)}
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
                      Store Ship
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}

        {shipsAtStation.length === 0 && (
          <div style={{
            textAlign: 'center',
            color: '#9ca3af',
            padding: '40px 0',
            borderRadius: '6px',
            border: '2px dashed #374151'
          }}>
            <div style={{ marginBottom: '10px', fontSize: '24px' }}>🚀</div>
            <div>No ships at this station</div>
            <div style={{ fontSize: '14px', marginTop: '5px' }}>
              Purchase a ship or retrieve one from storage
            </div>
          </div>
        )}
      </div>
    </div>
  );

  const renderStorageTab = () => (
    <div style={{ padding: '20px' }}>
      <h3 style={{ color: '#60a5fa', marginBottom: '15px' }}>Ship Storage</h3>
      
      <div style={{ marginBottom: '20px', color: '#9ca3af' }}>
        {storedShips.length} ships in storage at this station
      </div>

      {storedShips.length === 0 ? (
        <div style={{
          textAlign: 'center',
          color: '#9ca3af',
          padding: '40px 0',
          borderRadius: '6px',
          border: '2px dashed #374151'
        }}>
          <div style={{ marginBottom: '10px', fontSize: '24px' }}>📦</div>
          <div>No ships in storage</div>
          <div style={{ fontSize: '14px', marginTop: '5px' }}>
            Store ships here when not in use
          </div>
        </div>
      ) : (
        <div style={{ display: 'grid', gap: '15px' }}>
          {storedShips.map((storageSlot, index) => {
            const ship = ownedShips.find(s => s.id === storageSlot.shipId);
            if (!ship) return null;

            const daysStored = Math.ceil((Date.now() - storageSlot.storedAt) / (24 * 60 * 60 * 1000));
            const totalFees = daysStored * storageSlot.storageFee;

            return (
              <div key={index} style={{
                backgroundColor: '#1f2937',
                padding: '20px',
                borderRadius: '8px',
                border: '1px solid #374151'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div style={{ flex: 1 }}>
                    <h4 style={{ margin: '0 0 10px 0', color: '#f3f4f6' }}>{ship.name}</h4>
                    
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px', marginBottom: '15px' }}>
                      <div style={{ fontSize: '14px', color: '#9ca3af' }}>
                        <strong>Class:</strong> {ship.class.name}
                      </div>
                      <div style={{ fontSize: '14px', color: '#9ca3af' }}>
                        <strong>Daily Fee:</strong> {storageSlot.storageFee} cr
                      </div>
                      <div style={{ fontSize: '14px', color: '#9ca3af' }}>
                        <strong>Stored:</strong> {daysStored} days
                      </div>
                      <div style={{ fontSize: '14px', color: '#9ca3af' }}>
                        <strong>Total Fees:</strong> {totalFees} cr
                      </div>
                    </div>

                    <button
                      onClick={() => onRetrieveShip(ship.id)}
                      disabled={playerCredits < totalFees}
                      style={{
                        padding: '8px 16px',
                        backgroundColor: playerCredits >= totalFees ? '#3b82f6' : '#374151',
                        color: playerCredits >= totalFees ? 'white' : '#9ca3af',
                        border: 'none',
                        borderRadius: '6px',
                        cursor: playerCredits >= totalFees ? 'pointer' : 'not-allowed',
                        fontSize: '14px'
                      }}
                    >
                      Retrieve Ship ({totalFees} cr)
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );

  const renderShipyardTab = () => (
    <div style={{ padding: '20px' }}>
      <h3 style={{ color: '#60a5fa', marginBottom: '15px' }}>Shipyard</h3>
      
      <div style={{ marginBottom: '20px', color: '#9ca3af' }}>
        {availableShips.length} ships available for purchase
      </div>

      {availableShips.length === 0 ? (
        <div style={{
          textAlign: 'center',
          color: '#9ca3af',
          padding: '40px 0',
          borderRadius: '6px',
          border: '2px dashed #374151'
        }}>
          <div style={{ marginBottom: '10px', fontSize: '24px' }}>🏭</div>
          <div>No ships for sale</div>
          <div style={{ fontSize: '14px', marginTop: '5px' }}>
            Check back later or visit other stations
          </div>
        </div>
      ) : (
        <div style={{ display: 'grid', gap: '15px' }}>
          {availableShips.map((offer, index) => {
            const finalPrice = Math.round(offer.basePrice * (1 - offer.discount));
            const canAfford = playerCredits >= finalPrice;

            return (
              <div key={index} style={{
                backgroundColor: '#1f2937',
                padding: '20px',
                borderRadius: '8px',
                border: '1px solid #374151'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
                      <h4 style={{ margin: 0, color: '#f3f4f6' }}>{offer.shipClass.name}</h4>
                      {offer.discount > 0 && (
                        <span style={{
                          backgroundColor: '#10b981',
                          color: 'white',
                          padding: '2px 8px',
                          borderRadius: '12px',
                          fontSize: '12px'
                        }}>
                          {Math.round(offer.discount * 100)}% OFF
                        </span>
                      )}
                    </div>
                    
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px', marginBottom: '15px' }}>
                      <div style={{ fontSize: '14px', color: '#9ca3af' }}>
                        <strong>Cargo:</strong> {offer.shipClass.baseCargoCapacity} units
                      </div>
                      <div style={{ fontSize: '14px', color: '#9ca3af' }}>
                        <strong>Speed:</strong> {offer.shipClass.baseSpeed} units/h
                      </div>
                      <div style={{ fontSize: '14px', color: '#9ca3af' }}>
                        <strong>Condition:</strong> <span style={{ color: getConditionColor(offer.condition) }}>
                          {getConditionText(offer.condition)}
                        </span>
                      </div>
                      <div style={{ fontSize: '14px', color: '#9ca3af' }}>
                        <strong>Stock:</strong> {offer.availableCount}
                      </div>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#f3f4f6' }}>
                          {finalPrice.toLocaleString()} cr
                        </div>
                        {offer.discount > 0 && (
                          <div style={{ fontSize: '12px', color: '#9ca3af', textDecoration: 'line-through' }}>
                            {offer.basePrice.toLocaleString()} cr
                          </div>
                        )}
                      </div>
                      
                      <button
                        onClick={() => onPurchaseShip(offer.shipClassId)}
                        disabled={!canAfford || offer.availableCount === 0}
                        style={{
                          padding: '8px 16px',
                          backgroundColor: canAfford && offer.availableCount > 0 ? '#3b82f6' : '#374151',
                          color: canAfford && offer.availableCount > 0 ? 'white' : '#9ca3af',
                          border: 'none',
                          borderRadius: '6px',
                          cursor: canAfford && offer.availableCount > 0 ? 'pointer' : 'not-allowed',
                          fontSize: '14px'
                        }}
                      >
                        {offer.availableCount === 0 ? 'Out of Stock' : 'Purchase'}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );

  const renderConstructionTab = () => {
    // All ship construction now uses the 3D hub-based system
    if (!onConstructHubShip) {
      return (
        <div style={{ padding: '20px' }}>
          <div style={{
            textAlign: 'center',
            color: '#9ca3af',
            padding: '40px 0',
            borderRadius: '6px',
            border: '2px dashed #374151'
          }}>
            <div style={{ marginBottom: '10px', fontSize: '24px' }}>🔨</div>
            <div>Ship Construction Not Available</div>
            <div style={{ fontSize: '14px', marginTop: '5px' }}>
              This station does not have construction facilities
            </div>
          </div>
        </div>
      );
    }

    // Show 3D hub-based designer
    if (showHubDesigner) {
      const availableMaterials = {
        'electronics': 1000,
        'steel': 1000,
        'composites': 1000,
        'fusion-cores': 100,
        'rare-metals': 50
      };

      return (
        <ThreeDShipDesigner
          stationId={stationId}
          stationType={stationType}
          techLevel={techLevel}
          playerCredits={playerCredits}
          availableMaterials={availableMaterials}
          onConstructShip={(design, shipName) => {
            onConstructHubShip(design, shipName);
            setShowHubDesigner(false);
          }}
          onCancel={() => {
            setShowHubDesigner(false);
          }}
        />
      );
    }

    // Show construction method introduction (3D only)
    return (
      <div style={{ padding: '20px' }}>
        <h3 style={{ color: '#60a5fa', marginBottom: '15px' }}>3D Ship Construction</h3>
        
        <div style={{ marginBottom: '20px', color: '#9ca3af' }}>
          Build custom ships using advanced 3D block-based construction
        </div>

        <div style={{
          backgroundColor: '#1f2937',
          padding: '25px',
          borderRadius: '8px',
          border: '1px solid #374151',
          textAlign: 'center'
        }}>
          <div style={{ marginBottom: '15px', fontSize: '48px' }}>🚀</div>
          <h4 style={{ color: '#f3f4f6', marginBottom: '10px' }}>Advanced 3D Ship Design</h4>
          <p style={{ color: '#9ca3af', marginBottom: '20px', lineHeight: '1.5' }}>
            Design ships using modular 3D blocks in a full spatial environment. 
            Place command centers, reactors, cargo holds, and specialized equipment 
            exactly where you want them with true 3D visualization and interactive controls.
          </p>
          
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
            gap: '15px',
            marginBottom: '25px'
          }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '24px', marginBottom: '5px' }}>🧩</div>
              <div style={{ color: '#e2e8f0', fontWeight: 'bold' }}>3D Block Placement</div>
              <div style={{ fontSize: '12px', color: '#9ca3af' }}>Full 3D spatial design</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '24px', marginBottom: '5px' }}>🎮</div>
              <div style={{ color: '#e2e8f0', fontWeight: 'bold' }}>Interactive Controls</div>
              <div style={{ fontSize: '12px', color: '#9ca3af' }}>Rotate, zoom, click to build</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '24px', marginBottom: '5px' }}>⚡</div>
              <div style={{ color: '#e2e8f0', fontWeight: 'bold' }}>System Validation</div>
              <div style={{ fontSize: '12px', color: '#9ca3af' }}>Real-time performance metrics</div>
            </div>
          </div>

          <button
            onClick={() => setShowHubDesigner(true)}
            style={{
              padding: '12px 30px',
              backgroundColor: '#059669',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '16px',
              fontWeight: 'bold',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              margin: '0 auto'
            }}
          >
            🚀 Start 3D Design
          </button>
        </div>
      </div>
    );
  };

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
            🚀 Fleet Management - {stationName}
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

        {/* Tabs */}
        <div style={{ display: 'flex', borderBottom: '1px solid #374151' }}>
          {[
            { id: 'fleet', label: 'Fleet', icon: '🚀' },
            { id: 'storage', label: 'Storage', icon: '📦' },
            { id: 'shipyard', label: 'Shipyard', icon: '🏭' },
            { id: 'construction', label: 'Construction', icon: '🔨' }
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

        {/* Content */}
        <div style={{ flex: 1, overflow: 'auto' }}>
          {activeTab === 'fleet' && renderFleetTab()}
          {activeTab === 'storage' && renderStorageTab()}
          {activeTab === 'shipyard' && renderShipyardTab()}
          {activeTab === 'construction' && renderConstructionTab()}
        </div>
      </div>
    </Modal>
  );
};

export default FleetManagementPanel;