import React, { useState } from 'react';
import { TradeRoute, RouteAnalysis } from '../../types/economy';
import Modal from './Modal';
import { getCommodity } from '../../data/commodities';

interface TradeRoutePanelProps {
  routeAnalysis: RouteAnalysis | null;
  isVisible: boolean;
  onClose: () => void;
  onSelectRoute?: (route: TradeRoute) => void;
  playerCredits: number;
  currentStationId?: string;
}

export const TradeRoutePanel: React.FC<TradeRoutePanelProps> = ({
  routeAnalysis,
  isVisible,
  onClose,
  onSelectRoute,
  playerCredits,
  currentStationId
}) => {
  const [activeTab, setActiveTab] = useState<'top' | 'risk-adjusted' | 'from-station'>('top');
  const [sortBy, setSortBy] = useState<'profit' | 'margin' | 'time'>('profit');

  if (!isVisible || !routeAnalysis) return null;

  const formatCredits = (credits: number) => {
    if (credits >= 1000000) {
      return `${(credits / 1000000).toFixed(1)}M`;
    } else if (credits >= 1000) {
      return `${(credits / 1000).toFixed(1)}K`;
    }
    return credits.toString();
  };

  const formatTime = (hours: number) => {
    if (hours < 1) {
      return `${Math.round(hours * 60)}m`;
    } else if (hours < 24) {
      return `${hours.toFixed(1)}h`;
    } else {
      return `${(hours / 24).toFixed(1)}d`;
    }
  };

  const getStationDisplayName = (stationId: string) => {
    const names: Record<string, string> = {
      'earth-station': 'Earth Station Alpha',
      'alpha-station': 'Alpha Centauri Station',
      'sirius-station': 'Sirius Trade Hub'
    };
    return names[stationId] || stationId.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  const getCommodityDisplayName = (commodityId: string) => {
    const commodity = getCommodity(commodityId);
    return commodity?.name || commodityId.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  const getRiskColor = (risk: number) => {
    if (risk < 0.2) return '#4CAF50'; // Green - Low risk
    if (risk < 0.5) return '#FF9800'; // Orange - Medium risk
    return '#F44336'; // Red - High risk
  };

  const canAffordRoute = (route: TradeRoute) => {
    const commodity = getCommodity(route.commodity);
    if (!commodity) return false;
    
    // Estimate cost for minimum viable quantity (10 units)
    const minQuantity = 10;
    const estimatedCost = route.profitPerUnit * minQuantity + (route.profitPerUnit * minQuantity * route.profitMargin / 100);
    return playerCredits >= estimatedCost;
  };

  const getRoutesToDisplay = () => {
    let routes: TradeRoute[] = [];
    
    switch (activeTab) {
      case 'top':
        routes = routeAnalysis.topRoutes;
        break;
      case 'risk-adjusted':
        routes = routeAnalysis.riskAdjustedRoutes;
        break;
      case 'from-station':
        routes = routeAnalysis.routes.filter(route => route.origin === currentStationId);
        break;
    }

    // Apply sorting
    return [...routes].sort((a, b) => {
      switch (sortBy) {
        case 'profit':
          return b.profitPerHour - a.profitPerHour;
        case 'margin':
          return b.profitMargin - a.profitMargin;
        case 'time':
          return a.travelTime - b.travelTime;
        default:
          return 0;
      }
    });
  };

  const routes = getRoutesToDisplay();

  return (
    <Modal isOpen={isVisible} onClose={onClose} title="Trade Route Analysis" size="large">
      <div style={{ width: '90vw', maxWidth: '900px', height: '80vh', maxHeight: '700px', padding: '20px' }}>
        {/* Header with stats */}
        <div style={{ marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h3 style={{ margin: '0 0 5px 0', color: '#4a90e2' }}>Trade Route Intelligence</h3>
            <p style={{ margin: 0, fontSize: '12px', color: '#888' }}>
              {routeAnalysis.routes.length} routes analyzed | Updated {new Date(routeAnalysis.updated).toLocaleTimeString()}
            </p>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '14px', color: '#4a90e2' }}>Credits: {formatCredits(playerCredits)}</div>
          </div>
        </div>

        {/* Tabs */}
        <div style={{ 
          display: 'flex', 
          marginBottom: '15px',
          borderBottom: '1px solid #333'
        }}>
          {[
            { key: 'top', label: 'Top Routes' },
            { key: 'risk-adjusted', label: 'Risk Adjusted' },
            { key: 'from-station', label: 'From Current' }
          ].map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as any)}
              style={{
                padding: '8px 16px',
                backgroundColor: activeTab === tab.key ? '#4a90e2' : 'transparent',
                color: activeTab === tab.key ? 'white' : '#ccc',
                border: 'none',
                borderBottom: activeTab === tab.key ? '2px solid #4a90e2' : '2px solid transparent',
                cursor: 'pointer',
                fontSize: '12px'
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Sort controls */}
        <div style={{ marginBottom: '15px', display: 'flex', gap: '10px', alignItems: 'center' }}>
          <span style={{ fontSize: '12px', color: '#888' }}>Sort by:</span>
          {[
            { key: 'profit', label: 'Profit/Hour' },
            { key: 'margin', label: 'Margin %' },
            { key: 'time', label: 'Travel Time' }
          ].map(sort => (
            <button
              key={sort.key}
              onClick={() => setSortBy(sort.key as any)}
              style={{
                padding: '4px 8px',
                backgroundColor: sortBy === sort.key ? '#4a90e2' : '#2a2a2a',
                color: 'white',
                border: 'none',
                borderRadius: '3px',
                cursor: 'pointer',
                fontSize: '11px'
              }}
            >
              {sort.label}
            </button>
          ))}
        </div>

        {/* Routes list */}
        <div style={{ 
          height: '400px', 
          overflowY: 'auto',
          border: '1px solid #333',
          borderRadius: '5px'
        }}>
          {routes.length === 0 ? (
            <div style={{ 
              padding: '40px', 
              textAlign: 'center', 
              color: '#888' 
            }}>
              {activeTab === 'from-station' && !currentStationId 
                ? 'No current station selected'
                : 'No profitable routes found'
              }
            </div>
          ) : (
            routes.map((route, index) => {
              const affordable = canAffordRoute(route);
              
              return (
                <div
                  key={route.id}
                  style={{
                    padding: '12px',
                    borderBottom: index < routes.length - 1 ? '1px solid #333' : 'none',
                    backgroundColor: index % 2 === 0 ? '#1a1a1a' : '#222',
                    opacity: affordable ? 1 : 0.6,
                    cursor: onSelectRoute ? 'pointer' : 'default'
                  }}
                  onClick={() => onSelectRoute && onSelectRoute(route)}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: '8px',
                        marginBottom: '4px'
                      }}>
                        <span style={{ 
                          fontWeight: 'bold', 
                          color: '#4a90e2',
                          fontSize: '13px'
                        }}>
                          {getCommodityDisplayName(route.commodity)}
                        </span>
                        {!affordable && (
                          <span style={{ 
                            fontSize: '10px', 
                            color: '#ff6b6b',
                            backgroundColor: '#2a1a1a',
                            padding: '2px 6px',
                            borderRadius: '3px'
                          }}>
                            Insufficient Credits
                          </span>
                        )}
                      </div>
                      
                      <div style={{ fontSize: '11px', color: '#ccc', marginBottom: '4px' }}>
                        {getStationDisplayName(route.origin)} → {getStationDisplayName(route.destination)}
                      </div>
                      
                      <div style={{ fontSize: '10px', color: '#888' }}>
                        Distance: {route.distance.toFixed(0)} units • Time: {formatTime(route.travelTime)} • Volume: {route.volume} units
                      </div>
                    </div>
                    
                    <div style={{ textAlign: 'right', minWidth: '120px' }}>
                      <div style={{ 
                        fontSize: '14px', 
                        fontWeight: 'bold', 
                        color: '#4CAF50',
                        marginBottom: '2px'
                      }}>
                        {formatCredits(route.profitPerHour)}/h
                      </div>
                      
                      <div style={{ fontSize: '11px', color: '#ccc', marginBottom: '2px' }}>
                        {route.profitMargin.toFixed(1)}% margin
                      </div>
                      
                      <div style={{ 
                        fontSize: '10px', 
                        color: getRiskColor(route.risk),
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'flex-end',
                        gap: '4px'
                      }}>
                        <div style={{
                          width: '8px',
                          height: '8px',
                          borderRadius: '50%',
                          backgroundColor: getRiskColor(route.risk)
                        }} />
                        Risk: {(route.risk * 100).toFixed(0)}%
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer info */}
        <div style={{ 
          marginTop: '15px', 
          fontSize: '10px', 
          color: '#666',
          borderTop: '1px solid #333',
          paddingTop: '10px'
        }}>
          <div>💡 Routes are analyzed based on current market conditions and may change over time.</div>
          <div>🎯 Risk factors include distance, station security, and random events.</div>
          <div>💰 Profit calculations assume optimal buy/sell conditions and available cargo space.</div>
        </div>
      </div>
    </Modal>
  );
};