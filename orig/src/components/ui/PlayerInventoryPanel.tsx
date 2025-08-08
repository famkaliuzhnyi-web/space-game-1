import React from 'react';
import { CargoItem } from '../../types/player';
import { getCommodity } from '../../data/commodities';

interface PlayerInventoryPanelProps {
  isVisible: boolean;
  onClose: () => void;
  cargoItems: CargoItem[];
  cargoCapacity: number;
  cargoUsed: number;
  playerCredits: number;
  currentStationName?: string;
}

const PlayerInventoryPanel: React.FC<PlayerInventoryPanelProps> = ({
  isVisible,
  onClose,
  cargoItems,
  cargoCapacity,
  cargoUsed,
  playerCredits,
  currentStationName = 'Unknown Station'
}) => {
  if (!isVisible) return null;

  const cargoPercentage = Math.round((cargoUsed / cargoCapacity) * 100);
  const totalCargoValue = cargoItems.reduce((total, item) => {
    return total + (item.quantity * item.averagePurchasePrice);
  }, 0);

  return (
    <div style={{
      position: 'absolute',
      top: '50%',
      left: '50%',
      transform: 'translate(-50%, -50%)',
      backgroundColor: '#1a1a1a',
      border: '2px solid #333',
      borderRadius: '8px',
      padding: '20px',
      minWidth: '500px',
      maxWidth: '600px',
      maxHeight: '80vh',
      overflow: 'auto',
      zIndex: 1000,
      color: '#fff',
      fontFamily: 'monospace'
    }}>
      {/* Header */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        marginBottom: '20px',
        borderBottom: '1px solid #333',
        paddingBottom: '10px'
      }}>
        <h2 style={{ margin: 0, color: '#4a90e2' }}>
          📦 Ship Cargo Hold
        </h2>
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <div>💰 {playerCredits.toLocaleString()} credits</div>
          <button 
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              color: '#999',
              fontSize: '20px',
              cursor: 'pointer'
            }}
          >
            ✕
          </button>
        </div>
      </div>

      {/* Cargo Status */}
      <div style={{ marginBottom: '20px' }}>
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: '1fr 1fr 1fr', 
          gap: '15px',
          textAlign: 'center'
        }}>
          <div>
            <strong>Ship Location:</strong><br />
            <span style={{ color: '#4a90e2' }}>{currentStationName}</span>
          </div>
          <div>
            <strong>Cargo Space:</strong><br />
            <span style={{ color: cargoPercentage > 90 ? '#ff6b6b' : cargoPercentage > 70 ? '#ffa726' : '#4caf50' }}>
              {cargoUsed}/{cargoCapacity} units ({cargoPercentage}%)
            </span>
          </div>
          <div>
            <strong>Cargo Value:</strong><br />
            <span style={{ color: '#4caf50' }}>{totalCargoValue.toLocaleString()} cr</span>
          </div>
        </div>
        
        {/* Cargo bar */}
        <div style={{
          width: '100%',
          height: '10px',
          backgroundColor: '#333',
          borderRadius: '5px',
          marginTop: '10px',
          overflow: 'hidden'
        }}>
          <div style={{
            width: `${cargoPercentage}%`,
            height: '100%',
            backgroundColor: cargoPercentage > 90 ? '#ff6b6b' : cargoPercentage > 70 ? '#ffa726' : '#4caf50',
            transition: 'width 0.3s ease'
          }} />
        </div>
      </div>

      {/* Cargo Items */}
      <div>
        <h3 style={{ marginBottom: '10px', color: '#ccc' }}>Cargo Manifest</h3>
        
        {cargoItems.length === 0 ? (
          <div style={{
            textAlign: 'center',
            padding: '40px',
            color: '#666',
            fontSize: '16px'
          }}>
            <div style={{ fontSize: '48px', marginBottom: '10px' }}>📦</div>
            <div>Cargo hold is empty</div>
            <div style={{ fontSize: '14px', marginTop: '5px' }}>
              Visit a market to purchase commodities
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {/* Header row */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr',
              gap: '10px',
              padding: '8px',
              backgroundColor: '#2a2a2a',
              borderRadius: '4px',
              fontSize: '12px',
              fontWeight: 'bold',
              color: '#999'
            }}>
              <div>Commodity</div>
              <div style={{ textAlign: 'center' }}>Quantity</div>
              <div style={{ textAlign: 'center' }}>Avg. Price</div>
              <div style={{ textAlign: 'center' }}>Total Value</div>
              <div style={{ textAlign: 'center' }}>Space Used</div>
            </div>
            
            {/* Cargo items */}
            {cargoItems.map((item) => {
              const commodity = getCommodity(item.commodityId);
              if (!commodity) return null;
              
              const totalValue = item.quantity * item.averagePurchasePrice;
              const spaceUsed = item.quantity * commodity.unitSize;
              const isExpiring = item.expirationTime && (item.expirationTime - Date.now()) < (24 * 60 * 60 * 1000); // Less than 1 day
              
              return (
                <div 
                  key={item.commodityId}
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr',
                    gap: '10px',
                    padding: '8px',
                    backgroundColor: isExpiring ? '#3d1a1a' : '#2a2a2a',
                    borderRadius: '4px',
                    border: isExpiring ? '1px solid #ff6b6b' : 'none'
                  }}
                >
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <div style={{ fontWeight: 'bold' }}>{commodity.name}</div>
                    <div style={{ fontSize: '12px', color: '#999' }}>
                      {commodity.category}
                      {isExpiring && <span style={{ color: '#ff6b6b', marginLeft: '8px' }}>⚠️ Expiring soon!</span>}
                    </div>
                  </div>
                  <div style={{ textAlign: 'center' }}>{item.quantity}</div>
                  <div style={{ textAlign: 'center' }}>{Math.round(item.averagePurchasePrice)}</div>
                  <div style={{ textAlign: 'center', color: '#4caf50' }}>{Math.round(totalValue).toLocaleString()}</div>
                  <div style={{ textAlign: 'center' }}>{spaceUsed}</div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Footer info */}
      <div style={{
        marginTop: '20px',
        padding: '10px',
        backgroundColor: '#2a2a2a',
        borderRadius: '4px',
        fontSize: '12px',
        color: '#999'
      }}>
        <div>💡 <strong>Tips:</strong></div>
        <div>• Visit markets to buy and sell commodities</div>
        <div>• Monitor cargo space and expiration times for perishable goods</div>
        <div>• Higher-value goods provide better profit margins but require more investment</div>
        {cargoPercentage > 85 && (
          <div style={{ color: '#ffa726', marginTop: '5px' }}>
            ⚠️ Cargo hold nearly full! Consider selling items to free up space.
          </div>
        )}
      </div>
    </div>
  );
};

export default PlayerInventoryPanel;