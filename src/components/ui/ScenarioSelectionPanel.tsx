/**
 * ScenarioSelectionPanel Component
 * UI for selecting starting scenarios before character creation
 */

import React, { useState, useEffect } from 'react';
import { StartingScenario, ScenarioPreviewData } from '../../types/startingScenarios';
import { STARTING_SCENARIOS, DEFAULT_SCENARIO_CONFIG } from '../../data/startingScenarios';
import './ScenarioSelectionPanel.css';

interface ScenarioSelectionPanelProps {
  onScenarioSelected: (scenario: StartingScenario) => void;
  onCustomStart: () => void;
  onCancel?: () => void;
}

export const ScenarioSelectionPanel: React.FC<ScenarioSelectionPanelProps> = ({
  onScenarioSelected,
  onCustomStart,
  onCancel
}) => {
  const [selectedScenarioId, setSelectedScenarioId] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [previewData, setPreviewData] = useState<ScenarioPreviewData | null>(null);
  
  const categories = ['all', ...DEFAULT_SCENARIO_CONFIG.categorySorting];
  const scenarios = Object.values(STARTING_SCENARIOS);
  
  // Filter scenarios by selected category
  const filteredScenarios = selectedCategory === 'all' 
    ? scenarios 
    : scenarios.filter(scenario => scenario.category === selectedCategory);

  // Generate preview data for selected scenario
  useEffect(() => {
    if (selectedScenarioId) {
      const scenario = STARTING_SCENARIOS[selectedScenarioId];
      if (scenario) {
        setPreviewData(generatePreviewData(scenario));
      }
    } else {
      setPreviewData(null);
    }
  }, [selectedScenarioId]);

  const generatePreviewData = (scenario: StartingScenario): ScenarioPreviewData => {
    // Calculate final credits
    const finalCredits = scenario.startingCredits;
    
    // Calculate final attributes (base + background + scenario modifiers)
    const baseAttributes = { strength: 10, intelligence: 10, charisma: 10, endurance: 10, dexterity: 10, perception: 10 };
    const finalAttributes = { ...baseAttributes };
    
    // Apply scenario modifiers
    Object.entries(scenario.characterSetup.attributeModifiers).forEach(([key, value]) => {
      if (value && key in finalAttributes) {
        (finalAttributes as any)[key] += value;
      }
    });

    // Calculate final skills (base + background + scenario modifiers)
    const baseSkills = { 
      trading: 0, negotiation: 0, economics: 0, engineering: 0, 
      piloting: 0, navigation: 0, combat: 0, tactics: 0, 
      security: 0, networking: 0, investigation: 0, leadership: 0 
    };
    const finalSkills = { ...baseSkills };
    
    // Apply scenario modifiers
    Object.entries(scenario.characterSetup.skillModifiers).forEach(([key, value]) => {
      if (value && key in finalSkills) {
        (finalSkills as any)[key] += value;
      }
    });

    // Categorize factions by standing
    const hostile: string[] = [];
    const neutral: string[] = [];
    const friendly: string[] = [];

    Object.entries(scenario.factionStandings).forEach(([faction, standing]) => {
      if (standing < -10) {
        hostile.push(faction.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase()));
      } else if (standing > 10) {
        friendly.push(faction.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase()));
      } else {
        neutral.push(faction.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase()));
      }
    });

    // Generate advantages and challenges
    const advantages: string[] = [];
    const challenges: string[] = [];

    if (finalCredits > 20000) advantages.push('Substantial starting capital');
    if (finalCredits < 5000) challenges.push('Limited starting funds');

    if (scenario.specialConditions?.tradeDiscountPercent && scenario.specialConditions.tradeDiscountPercent > 0) {
      advantages.push(`${scenario.specialConditions.tradeDiscountPercent}% better trade prices`);
    }
    if (scenario.specialConditions?.tradeDiscountPercent && scenario.specialConditions.tradeDiscountPercent < 0) {
      challenges.push(`${Math.abs(scenario.specialConditions.tradeDiscountPercent)}% worse trade prices`);
    }

    if (scenario.specialConditions?.hasDebt) {
      challenges.push(`${scenario.specialConditions.hasDebt.amount} credits debt`);
    }

    if (scenario.specialConditions?.isWanted) {
      challenges.push('Wanted by authorities');
    }

    if (friendly.length > hostile.length) {
      advantages.push('Good faction relationships');
    } else if (hostile.length > friendly.length) {
      challenges.push('Hostile faction relationships');
    }

    // Ship details
    const shipCondition = Object.values(scenario.startingShip.condition).reduce((avg, val) => avg + val, 0) / 4;

    return {
      finalCredits,
      finalAttributes,
      finalSkills,
      shipDetails: {
        className: scenario.startingShip.shipClassId.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase()),
        cargoCapacity: getShipCargoCapacity(scenario.startingShip.shipClassId),
        condition: shipCondition
      },
      factionSummary: { hostile, neutral, friendly },
      startingAdvantages: advantages,
      startingChallenges: challenges
    };
  };

  const getShipCargoCapacity = (shipClassId: string): number => {
    // Simple mapping - in real implementation, this would come from ship class data
    const capacities: Record<string, number> = {
      'courier-ship': 50,
      'light-freighter': 100,
      'heavy-freighter': 250
    };
    return capacities[shipClassId] || 100;
  };

  const formatCredits = (credits: number): string => {
    if (credits >= 1000000) return `${(credits / 1000000).toFixed(1)}M`;
    if (credits >= 1000) return `${(credits / 1000).toFixed(1)}K`;
    return credits.toString();
  };

  const getCreditsClass = (credits: number): string => {
    if (credits < 5000) return 'credits-low';
    if (credits > 20000) return 'credits-positive';
    return '';
  };

  const handleScenarioSelect = (scenarioId: string) => {
    setSelectedScenarioId(scenarioId);
  };

  const handleStartScenario = () => {
    if (selectedScenarioId) {
      const scenario = STARTING_SCENARIOS[selectedScenarioId];
      onScenarioSelected(scenario);
    }
  };

  const getDifficultyBadgeClass = (difficulty: string): string => {
    return `difficulty-badge ${difficulty}`;
  };

  return (
    <div className="scenario-selection-panel">
      <div className="scenario-selection-content">
        <div className="scenario-selection-header">
          <h1 className="scenario-selection-title">Choose Your Beginning</h1>
          <p className="scenario-selection-subtitle">
            Select a starting scenario to define your character's background, resources, and initial challenges
          </p>
        </div>

        <div className="scenario-categories">
          {categories.map(category => (
            <button
              key={category}
              className={`category-filter ${selectedCategory === category ? 'active' : ''}`}
              onClick={() => setSelectedCategory(category)}
            >
              {category === 'all' ? 'All Scenarios' : category.replace('-', ' ')}
            </button>
          ))}
        </div>

        <div className="scenarios-grid">
          {filteredScenarios.map(scenario => (
            <div
              key={scenario.id}
              className={`scenario-card ${selectedScenarioId === scenario.id ? 'selected' : ''}`}
              onClick={() => handleScenarioSelect(scenario.id)}
            >
              <div className="scenario-header">
                <h3 className="scenario-name">{scenario.name}</h3>
                <div className="scenario-badges">
                  <span className={getDifficultyBadgeClass(scenario.difficulty)}>
                    {scenario.difficulty}
                  </span>
                  <span className="category-badge">
                    {scenario.category}
                  </span>
                </div>
              </div>
              
              <p className="scenario-description">{scenario.description}</p>
              
              <div className="scenario-stats">
                <div className="stat-item">
                  <span className="stat-label">Starting Credits:</span>
                  <span className={`stat-value ${getCreditsClass(scenario.startingCredits)}`}>
                    {formatCredits(scenario.startingCredits)}
                  </span>
                </div>
                <div className="stat-item">
                  <span className="stat-label">Starting Ship:</span>
                  <span className="stat-value">
                    {scenario.startingShip.shipClassId.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                  </span>
                </div>
              </div>

              <div className="scenario-highlights">
                <div className="highlights-title">Key Features:</div>
                <div className="highlights-list">
                  {scenario.objectives.slice(0, 3).map((objective, index) => (
                    <span key={index} className="highlight-tag">
                      {objective.length > 30 ? `${objective.substring(0, 30)}...` : objective}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="selection-actions">
          <button
            className="start-button"
            disabled={!selectedScenarioId}
            onClick={handleStartScenario}
          >
            Start with Selected Scenario
          </button>
          
          {DEFAULT_SCENARIO_CONFIG.allowCustomStart && (
            <button
              className="custom-button action-button"
              onClick={onCustomStart}
            >
              Custom Start
            </button>
          )}
          
          {onCancel && (
            <button
              className="custom-button action-button"
              onClick={onCancel}
            >
              Cancel
            </button>
          )}
        </div>
      </div>

      {/* Preview Panel */}
      {previewData && (
        <div className="preview-panel">
          <h3 className="preview-title">Scenario Preview</h3>
          
          <div className="preview-section">
            <div className="preview-section-title">Starting Resources</div>
            <ul className="preview-list">
              <li>
                <span>Credits:</span>
                <span className={getCreditsClass(previewData.finalCredits)}>
                  {formatCredits(previewData.finalCredits)}
                </span>
              </li>
              <li>
                <span>Ship:</span>
                <span>{previewData.shipDetails.className}</span>
              </li>
              <li>
                <span>Cargo:</span>
                <span>{previewData.shipDetails.cargoCapacity} units</span>
              </li>
              <li>
                <span>Condition:</span>
                <span>{Math.round(previewData.shipDetails.condition * 100)}%</span>
              </li>
            </ul>
          </div>

          <div className="preview-section">
            <div className="preview-section-title">Faction Relations</div>
            <ul className="preview-list">
              {previewData.factionSummary.friendly.map(faction => (
                <li key={faction}>
                  <span>{faction}:</span>
                  <span className="faction-status faction-friendly">Friendly</span>
                </li>
              ))}
              {previewData.factionSummary.neutral.map(faction => (
                <li key={faction}>
                  <span>{faction}:</span>
                  <span className="faction-status faction-neutral">Neutral</span>
                </li>
              ))}
              {previewData.factionSummary.hostile.map(faction => (
                <li key={faction}>
                  <span>{faction}:</span>
                  <span className="faction-status faction-hostile">Hostile</span>
                </li>
              ))}
            </ul>
          </div>

          {previewData.startingAdvantages.length > 0 && (
            <div className="preview-section">
              <div className="preview-section-title">Advantages</div>
              <ul className="preview-list">
                {previewData.startingAdvantages.map((advantage, index) => (
                  <li key={index} style={{ color: '#4caf50' }}>{advantage}</li>
                ))}
              </ul>
            </div>
          )}

          {previewData.startingChallenges.length > 0 && (
            <div className="preview-section">
              <div className="preview-section-title">Challenges</div>
              <ul className="preview-list">
                {previewData.startingChallenges.map((challenge, index) => (
                  <li key={index} style={{ color: '#f44336' }}>{challenge}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
};