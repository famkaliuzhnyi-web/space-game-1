import React, { useState, useEffect } from 'react';
import './InvestmentPanel.css';
import { 
  Investment, 
  InvestmentPortfolio, 
  MarketSpeculation, 
  SupplyChainNode
} from '../../types/investment';

interface InvestmentPanelProps {
  isVisible: boolean;
  investmentManager: any;
  playerManager: any;
}

export const InvestmentPanel: React.FC<InvestmentPanelProps> = ({ 
  isVisible, 
  investmentManager, 
  playerManager 
}) => {
  const [activeTab, setActiveTab] = useState<'portfolio' | 'opportunities' | 'speculation' | 'analysis' | 'warfare'>('portfolio');
  const [portfolio, setPortfolio] = useState<InvestmentPortfolio | null>(null);
  const [availableInvestments, setAvailableInvestments] = useState<Investment[]>([]);
  const [activeSpeculations, setActiveSpeculations] = useState<MarketSpeculation[]>([]);
  const [supplyChains, setSupplyChains] = useState<Map<string, SupplyChainNode[]>>(new Map());
  const [selectedInvestment, setSelectedInvestment] = useState<Investment | null>(null);
  const [investmentAmount, setInvestmentAmount] = useState<number>(0);

  useEffect(() => {
    if (!isVisible || !investmentManager) return;
    
    updateData();
  }, [isVisible, investmentManager]);

  const updateData = () => {
    if (!investmentManager) return;
    
    setPortfolio(investmentManager.getPlayerPortfolio());
    setAvailableInvestments(investmentManager.getAvailableInvestments());
    setActiveSpeculations(investmentManager.getActiveSpeculations());
    setSupplyChains(investmentManager.getSupplyChains());
  };

  const handleMakeInvestment = (investmentId: string, amount: number) => {
    if (investmentManager.makeInvestment(investmentId, amount)) {
      updateData();
      setSelectedInvestment(null);
      setInvestmentAmount(0);
    }
  };

  const formatCredits = (amount: number) => {
    return new Intl.NumberFormat().format(Math.round(amount)) + ' CR';
  };

  const formatPercentage = (value: number) => {
    return (value * 100).toFixed(2) + '%';
  };

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'low': return 'var(--color-success)';
      case 'moderate': return 'var(--color-warning)';
      case 'high': return 'var(--color-danger)';
      default: return 'var(--color-text-secondary)';
    }
  };

  if (!isVisible) return null;

  return (
    <div className="investment-panel">
      <div className="panel-header">
        <h3>Investment Management</h3>
        <div className="panel-tabs">
          <button 
            className={activeTab === 'portfolio' ? 'active' : ''}
            onClick={() => setActiveTab('portfolio')}
          >
            Portfolio
          </button>
          <button 
            className={activeTab === 'opportunities' ? 'active' : ''}
            onClick={() => setActiveTab('opportunities')}
          >
            Opportunities
          </button>
          <button 
            className={activeTab === 'speculation' ? 'active' : ''}
            onClick={() => setActiveTab('speculation')}
          >
            Speculation
          </button>
          <button 
            className={activeTab === 'analysis' ? 'active' : ''}
            onClick={() => setActiveTab('analysis')}
          >
            Market Analysis
          </button>
          <button 
            className={activeTab === 'warfare' ? 'active' : ''}
            onClick={() => setActiveTab('warfare')}
          >
            Economic War
          </button>
        </div>
      </div>

      <div className="panel-content">
        {activeTab === 'portfolio' && (
          <div className="portfolio-tab">
            <div className="portfolio-summary">
              <div className="summary-cards">
                <div className="summary-card">
                  <h4>Total Portfolio Value</h4>
                  <span className="value">{formatCredits(portfolio?.totalValue || 0)}</span>
                </div>
                <div className="summary-card">
                  <h4>Total Invested</h4>
                  <span className="value">{formatCredits(portfolio?.totalInvested || 0)}</span>
                </div>
                <div className="summary-card">
                  <h4>Total Returns</h4>
                  <span className={`value ${(portfolio?.totalReturns || 0) >= 0 ? 'positive' : 'negative'}`}>
                    {formatCredits(portfolio?.totalReturns || 0)}
                  </span>
                </div>
                <div className="summary-card">
                  <h4>ROI</h4>
                  <span className={`value ${(portfolio?.performanceMetrics.roi || 0) >= 0 ? 'positive' : 'negative'}`}>
                    {formatPercentage(portfolio?.performanceMetrics.roi || 0)}
                  </span>
                </div>
              </div>
            </div>

            <div className="portfolio-details">
              <div className="risk-analysis">
                <h4>Risk Analysis</h4>
                <div className="risk-info">
                  <span>Risk Level: </span>
                  <span style={{ color: getRiskColor(portfolio?.riskLevel || 'moderate') }}>
                    {portfolio?.riskLevel?.toUpperCase() || 'MODERATE'}
                  </span>
                </div>
                <div className="diversification">
                  <span>Diversification Score: </span>
                  <span>{((portfolio?.diversificationScore || 0) * 100).toFixed(1)}%</span>
                </div>
              </div>

              <div className="active-investments">
                <h4>Active Investments ({portfolio?.investments.length || 0})</h4>
                <div className="investment-list">
                  {portfolio?.investments.map((inv, index) => {
                    const investment = availableInvestments.find(ai => ai.id === inv.investmentId);
                    return (
                      <div key={index} className="investment-item">
                        <div className="investment-info">
                          <h5>{investment?.name || 'Unknown Investment'}</h5>
                          <p className="investment-type">{investment?.type.replace('_', ' ').toUpperCase()}</p>
                        </div>
                        <div className="investment-metrics">
                          <span>Invested: {formatCredits(inv.amount)}</span>
                          <span>Expected: {formatPercentage(inv.expectedReturn)}</span>
                          <span className={inv.actualReturn >= 0 ? 'positive' : 'negative'}>
                            Current: {formatCredits(inv.actualReturn)}
                          </span>
                        </div>
                        <div className="investment-status">
                          <span className={`status ${inv.status}`}>{inv.status.toUpperCase()}</span>
                          <span style={{ color: getRiskColor(investment?.riskLevel || 'moderate') }}>
                            {investment?.riskLevel?.toUpperCase()}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'opportunities' && (
          <div className="opportunities-tab">
            <h4>Investment Opportunities ({availableInvestments.length})</h4>
            <div className="opportunities-list">
              {availableInvestments.map(investment => (
                <div key={investment.id} className="opportunity-item">
                  <div className="opportunity-header">
                    <h5>{investment.name}</h5>
                    <span className="investment-type">{investment.type.replace('_', ' ').toUpperCase()}</span>
                    <span style={{ color: getRiskColor(investment.riskLevel) }}>
                      {investment.riskLevel.toUpperCase()} RISK
                    </span>
                  </div>
                  
                  <div className="opportunity-details">
                    <p>{investment.description}</p>
                    
                    <div className="opportunity-metrics">
                      <div className="metric">
                        <span>Expected Return:</span>
                        <span className="positive">{formatPercentage(investment.expectedReturn)}</span>
                      </div>
                      <div className="metric">
                        <span>Duration:</span>
                        <span>{investment.duration} days</span>
                      </div>
                      <div className="metric">
                        <span>Min Investment:</span>
                        <span>{formatCredits(investment.minimumInvestment)}</span>
                      </div>
                      <div className="metric">
                        <span>Max Investment:</span>
                        <span>{formatCredits(investment.maximumInvestment)}</span>
                      </div>
                      <div className="metric">
                        <span>Current Funding:</span>
                        <span>{formatCredits(investment.totalRaised)} / {formatCredits(investment.targetAmount)}</span>
                      </div>
                    </div>

                    <div className="opportunity-requirements">
                      <h6>Requirements:</h6>
                      <ul>
                        <li>Minimum Reputation: {investment.requirements.minimumReputation}</li>
                        <li>Minimum Credits: {formatCredits(investment.requirements.minimumCredits)}</li>
                        {investment.requirements.requiredLicenses.length > 0 && (
                          <li>Required Licenses: {investment.requirements.requiredLicenses.join(', ')}</li>
                        )}
                      </ul>
                    </div>

                    <div className="opportunity-actions">
                      <button 
                        onClick={() => {
                          setSelectedInvestment(investment);
                          setInvestmentAmount(investment.minimumInvestment);
                        }}
                        className="invest-btn"
                      >
                        Invest
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {selectedInvestment && (
              <div className="investment-modal">
                <div className="modal-content">
                  <h4>Make Investment</h4>
                  <h5>{selectedInvestment.name}</h5>
                  
                  <div className="amount-input">
                    <label>Investment Amount (CR):</label>
                    <input 
                      type="number" 
                      value={investmentAmount}
                      onChange={(e) => setInvestmentAmount(Number(e.target.value))}
                      min={selectedInvestment.minimumInvestment}
                      max={Math.min(selectedInvestment.maximumInvestment, playerManager?.getCredits() || 0)}
                    />
                    <div className="amount-range">
                      <span>Min: {formatCredits(selectedInvestment.minimumInvestment)}</span>
                      <span>Max: {formatCredits(selectedInvestment.maximumInvestment)}</span>
                    </div>
                  </div>

                  <div className="investment-projection">
                    <div className="projection-metric">
                      <span>Expected Annual Return:</span>
                      <span className="positive">{formatCredits(investmentAmount * selectedInvestment.expectedReturn)}</span>
                    </div>
                    <div className="projection-metric">
                      <span>Duration:</span>
                      <span>{selectedInvestment.duration} days</span>
                    </div>
                  </div>

                  <div className="modal-actions">
                    <button 
                      onClick={() => handleMakeInvestment(selectedInvestment.id, investmentAmount)}
                      className="confirm-btn"
                      disabled={investmentAmount < selectedInvestment.minimumInvestment || 
                               investmentAmount > selectedInvestment.maximumInvestment ||
                               investmentAmount > (playerManager?.getCredits() || 0)}
                    >
                      Confirm Investment
                    </button>
                    <button 
                      onClick={() => {
                        setSelectedInvestment(null);
                        setInvestmentAmount(0);
                      }}
                      className="cancel-btn"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'speculation' && (
          <div className="speculation-tab">
            <h4>Market Speculation ({activeSpeculations.length} active positions)</h4>
            <div className="speculations-list">
              {activeSpeculations.map(speculation => (
                <div key={speculation.id} className="speculation-item">
                  <div className="speculation-header">
                    <h5>{speculation.commodity.toUpperCase()} Futures</h5>
                    <span className={`position ${speculation.position}`}>
                      {speculation.position.toUpperCase()}
                    </span>
                    <span>Leverage: {speculation.leverage.toFixed(1)}x</span>
                  </div>
                  
                  <div className="speculation-details">
                    <div className="speculation-metrics">
                      <div className="metric">
                        <span>Entry Price:</span>
                        <span>{formatCredits(speculation.entryPrice)}</span>
                      </div>
                      <div className="metric">
                        <span>Current Price:</span>
                        <span>{formatCredits(speculation.currentPrice)}</span>
                      </div>
                      <div className="metric">
                        <span>Quantity:</span>
                        <span>{speculation.quantity} units</span>
                      </div>
                      <div className="metric">
                        <span>Margin:</span>
                        <span>{formatCredits(speculation.margin)}</span>
                      </div>
                      <div className="metric">
                        <span>P&L:</span>
                        <span className={speculation.profitLoss >= 0 ? 'positive' : 'negative'}>
                          {formatCredits(speculation.profitLoss)}
                        </span>
                      </div>
                    </div>

                    <div className="risk-metrics">
                      <div className="metric">
                        <span>Volatility:</span>
                        <span>{formatPercentage(speculation.riskMetrics.volatility)}</span>
                      </div>
                      <div className="metric">
                        <span>Profit Probability:</span>
                        <span>{formatPercentage(speculation.riskMetrics.probabilityOfProfit)}</span>
                      </div>
                      <div className="metric">
                        <span>Market Sentiment:</span>
                        <span className={`sentiment ${speculation.marketSentiment}`}>
                          {speculation.marketSentiment.toUpperCase()}
                        </span>
                      </div>
                    </div>

                    <div className="expiration">
                      <span>Expires: {new Date(speculation.expirationDate).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>
              ))}
              
              {activeSpeculations.length === 0 && (
                <div className="no-speculations">
                  <p>No active speculation positions</p>
                  <small>Open new positions to start trading futures and derivatives</small>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'analysis' && (
          <div className="analysis-tab">
            <h4>Supply Chain Analysis</h4>
            <div className="supply-chains">
              {Array.from(supplyChains.entries()).map(([commodity, chain]) => (
                <div key={commodity} className="supply-chain">
                  <h5>{commodity.toUpperCase()} Supply Chain</h5>
                  <div className="chain-nodes">
                    {chain.map(node => (
                      <div key={node.id} className="chain-node">
                        <div className="node-header">
                          <h6>{node.type.replace('_', ' ').toUpperCase()}</h6>
                          <span className="tier">Tier {node.tier}</span>
                        </div>
                        <div className="node-metrics">
                          <div className="metric">
                            <span>Capacity:</span>
                            <span>{node.productionCapacity}</span>
                          </div>
                          <div className="metric">
                            <span>Current:</span>
                            <span>{node.currentProduction}</span>
                          </div>
                          <div className="metric">
                            <span>Efficiency:</span>
                            <span className={node.efficiency < 0.7 ? 'danger' : node.efficiency < 0.9 ? 'warning' : 'success'}>
                              {formatPercentage(node.efficiency)}
                            </span>
                          </div>
                          <div className="metric">
                            <span>Operating Costs:</span>
                            <span>{formatCredits(node.operatingCosts)}/day</span>
                          </div>
                        </div>
                        <div className="node-connections">
                          {node.suppliers.length > 0 && (
                            <div className="suppliers">
                              <span>Suppliers: {node.suppliers.length}</span>
                            </div>
                          )}
                          {node.consumers.length > 0 && (
                            <div className="consumers">
                              <span>Consumers: {node.consumers.length}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'warfare' && (
          <div className="warfare-tab">
            <h4>Economic Warfare</h4>
            <div className="warfare-content">
              <div className="market-influence">
                <h5>Market Influence</h5>
                <div className="influence-metrics">
                  <p>Track your influence across different markets to enable economic warfare actions.</p>
                  <small>Build influence through large-scale trading and market participation.</small>
                </div>
              </div>
              
              <div className="warfare-actions">
                <h5>Available Actions</h5>
                <p className="warfare-warning">
                  Economic warfare actions can have severe legal and reputational consequences.
                </p>
                <div className="action-buttons">
                  <button className="warfare-btn" disabled>
                    Market Cornering
                    <small>Requires 25% market influence</small>
                  </button>
                  <button className="warfare-btn" disabled>
                    Supply Disruption
                    <small>Requires 15% market influence</small>
                  </button>
                  <button className="warfare-btn" disabled>
                    Price Manipulation
                    <small>Requires 20% market influence</small>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};