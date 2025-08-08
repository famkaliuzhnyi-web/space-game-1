import React, { useState } from 'react';
import { Market, MarketCommodity } from '../../types/economy';
import { getCommodity } from '../../data/commodities';

interface MarketPanelProps {
  market: Market | null;
  stationName: string;
  isVisible: boolean;
  onClose: () => void;
  onTrade?: (commodityId: string, quantity: number, isBuying: boolean) => void;
  playerCredits?: number;
}

const MarketPanel: React.FC<MarketPanelProps> = ({
  market,
  stationName,
  isVisible,
  onClose,
  onTrade,
  playerCredits = 10000
}) => {
  const [selectedCommodity, setSelectedCommodity] = useState<string | null>(null);
  const [tradeQuantity, setTradeQuantity] = useState<number>(1);
  const [sortBy, setSortBy] = useState<'name' | 'price' | 'supply' | 'demand'>('name');

  if (!isVisible || !market) return null;

  const getSupplyLevelColor = (level: string): string => {
    switch (level) {
      case 'oversupply': return '#27ae60';
      case 'normal': return '#3498db';
      case 'shortage': return '#f39c12';
      case 'critical': return '#e74c3c';
      default: return '#95a5a6';
    }
  };

  const getDemandLevelColor = (level: string): string => {
    switch (level) {
      case 'none': return '#95a5a6';
      case 'low': return '#3498db';
      case 'normal': return '#27ae60';
      case 'high': return '#f39c12';
      case 'desperate': return '#e74c3c';
      default: return '#95a5a6';
    }
  };

  const commodities = Array.from(market.commodities.entries()).map(([id, marketCommodity]) => {
    const commodity = getCommodity(id);
    return { id, marketCommodity, commodity };
  }).filter(item => item.commodity);

  const sortedCommodities = [...commodities].sort((a, b) => {
    switch (sortBy) {
      case 'name': return a.commodity!.name.localeCompare(b.commodity!.name);
      case 'price': return b.marketCommodity.currentPrice - a.marketCommodity.currentPrice;
      case 'supply': return b.marketCommodity.available - a.marketCommodity.available;
      case 'demand': return b.marketCommodity.demand - a.marketCommodity.demand;
      default: return 0;
    }
  });

  const selectedCommodityData = selectedCommodity 
    ? commodities.find(c => c.id === selectedCommodity)
    : null;

  const handleTrade = (isBuying: boolean) => {
    if (selectedCommodity && tradeQuantity > 0) {
      onTrade?.(selectedCommodity, tradeQuantity, isBuying);
    }
  };

  const canAfford = (commodity: MarketCommodity, quantity: number): boolean => {
    return playerCredits >= commodity.currentPrice * quantity;
  };

  const getMaxAffordableQuantity = (commodity: MarketCommodity): number => {
    return Math.floor(playerCredits / commodity.currentPrice);
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
        maxWidth: '1000px',
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
            🏪 {stationName} Market
          </h2>
          <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
            <span style={{ color: '#4a90e2', fontSize: '1rem' }}>
              💰 {playerCredits.toLocaleString()} credits
            </span>
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
        </div>

        {/* Market Info */}
        <div style={{ 
          marginBottom: '20px',
          padding: '10px',
          backgroundColor: '#2a2a2a',
          borderRadius: '4px',
          fontSize: '0.9rem',
          color: '#ccc'
        }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '10px' }}>
            <div>Security Level: <span style={{ color: '#4a90e2' }}>{market.demandFactors.securityLevel}/1.0</span></div>
            <div>Population Factor: <span style={{ color: '#4a90e2' }}>{market.demandFactors.population.toFixed(2)}</span></div>
            <div>Station Type: <span style={{ color: '#4a90e2' }}>{market.demandFactors.stationType.toFixed(2)}x</span></div>
            <div>Last Update: <span style={{ color: '#4a90e2' }}>{new Date(market.lastUpdate).toLocaleTimeString()}</span></div>
          </div>
        </div>

        {/* Controls */}
        <div style={{ 
          display: 'flex', 
          gap: '10px', 
          marginBottom: '20px',
          alignItems: 'center'
        }}>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as 'name' | 'price' | 'supply' | 'demand')}
            style={{
              padding: '5px',
              backgroundColor: '#333',
              color: '#fff',
              border: '1px solid #555',
              borderRadius: '4px'
            }}
          >
            <option value="name">Sort by Name</option>
            <option value="price">Sort by Price</option>
            <option value="supply">Sort by Supply</option>
            <option value="demand">Sort by Demand</option>
          </select>
          
          <span style={{ color: '#888', fontSize: '0.9rem' }}>
            {commodities.length} commodities available
          </span>
        </div>

        <div style={{ display: 'flex', gap: '20px', flex: 1, minHeight: 0 }}>
          {/* Commodities List */}
          <div style={{
            flex: 2,
            border: '1px solid #444',
            borderRadius: '4px',
            overflow: 'hidden'
          }}>
            <div style={{
              backgroundColor: '#333',
              padding: '10px',
              borderBottom: '1px solid #444',
              fontWeight: 'bold',
              color: '#fff',
              display: 'grid',
              gridTemplateColumns: '1fr 80px 80px 80px 80px',
              gap: '10px',
              fontSize: '0.9rem'
            }}>
              <div>Commodity</div>
              <div style={{ textAlign: 'center' }}>Price</div>
              <div style={{ textAlign: 'center' }}>Supply</div>
              <div style={{ textAlign: 'center' }}>Demand</div>
              <div style={{ textAlign: 'center' }}>Trend</div>
            </div>
            
            <div style={{ height: '400px', overflowY: 'auto' }}>
              {sortedCommodities.map(({ id, marketCommodity, commodity }) => (
                <div
                  key={id}
                  onClick={() => setSelectedCommodity(id)}
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 80px 80px 80px 80px',
                    gap: '10px',
                    padding: '10px',
                    backgroundColor: selectedCommodity === id ? '#444' : '#2a2a2a',
                    borderBottom: '1px solid #333',
                    cursor: 'pointer',
                    alignItems: 'center',
                    fontSize: '0.9rem',
                    transition: 'background-color 0.2s ease'
                  }}
                  onMouseEnter={(e) => {
                    if (selectedCommodity !== id) {
                      (e.currentTarget as HTMLElement).style.backgroundColor = '#333';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (selectedCommodity !== id) {
                      (e.currentTarget as HTMLElement).style.backgroundColor = '#2a2a2a';
                    }
                  }}
                >
                  <div>
                    <div style={{ color: '#fff', fontWeight: 'bold' }}>{commodity!.name}</div>
                    <div style={{ color: '#888', fontSize: '0.8rem' }}>{commodity!.category}</div>
                  </div>
                  <div style={{ textAlign: 'center', color: '#4a90e2', fontWeight: 'bold' }}>
                    {marketCommodity.currentPrice.toLocaleString()}
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <span style={{ color: getSupplyLevelColor(marketCommodity.supplyLevel) }}>
                      {marketCommodity.available}
                    </span>
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <span style={{ color: getDemandLevelColor(marketCommodity.demandLevel) }}>
                      {marketCommodity.demand}
                    </span>
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    {marketCommodity.priceHistory.length > 1 && (
                      <span style={{ 
                        color: marketCommodity.currentPrice > marketCommodity.priceHistory[marketCommodity.priceHistory.length - 2].price 
                          ? '#27ae60' 
                          : marketCommodity.currentPrice < marketCommodity.priceHistory[marketCommodity.priceHistory.length - 2].price
                          ? '#e74c3c'
                          : '#95a5a6'
                      }}>
                        {marketCommodity.currentPrice > marketCommodity.priceHistory[marketCommodity.priceHistory.length - 2].price 
                          ? '↗' 
                          : marketCommodity.currentPrice < marketCommodity.priceHistory[marketCommodity.priceHistory.length - 2].price
                          ? '↘'
                          : '→'}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Trading Panel */}
          {selectedCommodityData && (
            <div style={{
              flex: 1,
              border: '1px solid #444',
              borderRadius: '4px',
              padding: '15px',
              backgroundColor: '#2a2a2a',
              display: 'flex',
              flexDirection: 'column'
            }}>
              <h3 style={{ 
                margin: '0 0 15px 0', 
                color: '#fff',
                fontSize: '1.2rem'
              }}>
                {selectedCommodityData.commodity!.name}
              </h3>
              
              <div style={{ marginBottom: '15px', fontSize: '0.9rem', color: '#ccc' }}>
                <p style={{ margin: '0 0 10px 0', lineHeight: '1.4' }}>
                  {selectedCommodityData.commodity!.description}
                </p>
                
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '10px' }}>
                  <div><strong>Category:</strong> {selectedCommodityData.commodity!.category}</div>
                  <div><strong>Legal Status:</strong> {selectedCommodityData.commodity!.legalStatus}</div>
                  <div><strong>Unit Size:</strong> {selectedCommodityData.commodity!.unitSize}</div>
                  <div><strong>Unit Mass:</strong> {selectedCommodityData.commodity!.unitMass}t</div>
                </div>

                <div style={{ 
                  padding: '10px',
                  backgroundColor: '#333',
                  borderRadius: '4px',
                  marginBottom: '15px'
                }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                    <div>
                      <strong>Supply:</strong> <span style={{ color: getSupplyLevelColor(selectedCommodityData.marketCommodity.supplyLevel) }}>
                        {selectedCommodityData.marketCommodity.supplyLevel} ({selectedCommodityData.marketCommodity.available})
                      </span>
                    </div>
                    <div>
                      <strong>Demand:</strong> <span style={{ color: getDemandLevelColor(selectedCommodityData.marketCommodity.demandLevel) }}>
                        {selectedCommodityData.marketCommodity.demandLevel} ({selectedCommodityData.marketCommodity.demand})
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div style={{ marginTop: 'auto' }}>
                <div style={{ marginBottom: '15px' }}>
                  <label style={{ display: 'block', color: '#fff', marginBottom: '5px' }}>
                    Quantity:
                  </label>
                  <input
                    type="number"
                    min="1"
                    max={Math.min(selectedCommodityData.marketCommodity.available, getMaxAffordableQuantity(selectedCommodityData.marketCommodity))}
                    value={tradeQuantity}
                    onChange={(e) => setTradeQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                    style={{
                      width: '100%',
                      padding: '8px',
                      backgroundColor: '#333',
                      color: '#fff',
                      border: '1px solid #555',
                      borderRadius: '4px'
                    }}
                  />
                  <div style={{ fontSize: '0.8rem', color: '#888', marginTop: '5px' }}>
                    Max affordable: {getMaxAffordableQuantity(selectedCommodityData.marketCommodity)}
                  </div>
                </div>

                <div style={{ marginBottom: '15px', fontSize: '0.9rem' }}>
                  <div style={{ color: '#fff' }}>
                    <strong>Total Cost:</strong> {(selectedCommodityData.marketCommodity.currentPrice * tradeQuantity).toLocaleString()} credits
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '10px' }}>
                  <button
                    onClick={() => handleTrade(true)}
                    disabled={!canAfford(selectedCommodityData.marketCommodity, tradeQuantity) || selectedCommodityData.marketCommodity.available < tradeQuantity}
                    style={{
                      flex: 1,
                      padding: '10px',
                      backgroundColor: canAfford(selectedCommodityData.marketCommodity, tradeQuantity) && selectedCommodityData.marketCommodity.available >= tradeQuantity ? '#27ae60' : '#555',
                      color: '#fff',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: canAfford(selectedCommodityData.marketCommodity, tradeQuantity) && selectedCommodityData.marketCommodity.available >= tradeQuantity ? 'pointer' : 'not-allowed',
                      fontSize: '0.9rem'
                    }}
                  >
                    💰 Buy
                  </button>
                  
                  <button
                    onClick={() => handleTrade(false)}
                    style={{
                      flex: 1,
                      padding: '10px',
                      backgroundColor: '#e74c3c',
                      color: '#fff',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontSize: '0.9rem'
                    }}
                  >
                    💸 Sell
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MarketPanel;