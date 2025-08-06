/**
 * CharacterCreationPanel Component
 * UI for creating a new character with background selection, attribute allocation, and skill allocation
 */

import React, { useState, useEffect } from 'react';
import { CharacterManager } from '../../systems/CharacterManager';
import { 
  CharacterBackground, 
  CharacterAppearance, 
  CharacterAttributes, 
  CharacterSkills, 
  CharacterCreationConfig 
} from '../../types/character';
import './CharacterCreationPanel.css';

interface CharacterCreationPanelProps {
  characterManager: CharacterManager;
  onComplete: (success: boolean) => void;
  onCancel: () => void;
}

interface CharacterCreationData {
  name: string;
  appearance: CharacterAppearance;
  backgroundId: string;
  allocatedAttributes: Partial<CharacterAttributes>;
  allocatedSkills: Partial<CharacterSkills>;
}

export const CharacterCreationPanel: React.FC<CharacterCreationPanelProps> = ({
  characterManager,
  onComplete,
  onCancel
}) => {
  const [step, setStep] = useState<'basic' | 'attributes' | 'skills' | 'review'>('basic');
  const [config, setConfig] = useState<CharacterCreationConfig | null>(null);
  const [backgrounds, setBackgrounds] = useState<CharacterBackground[]>([]);
  const [characterData, setCharacterData] = useState<CharacterCreationData>({
    name: '',
    appearance: {
      gender: 'male',
      skinTone: 'medium',
      hairColor: 'brown',
      eyeColor: 'blue',
      age: 30,
      portrait: 'default-male'
    },
    backgroundId: '',
    allocatedAttributes: {},
    allocatedSkills: {}
  });

  const [remainingAttributePoints, setRemainingAttributePoints] = useState(0);
  const [remainingSkillPoints, setRemainingSkillPoints] = useState(0);

  useEffect(() => {
    const creationConfig = characterManager.getCreationConfig();
    const availableBackgrounds = characterManager.getAvailableBackgrounds();
    
    setConfig(creationConfig);
    setBackgrounds(availableBackgrounds);
    setRemainingAttributePoints(creationConfig.startingAttributePoints);
    setRemainingSkillPoints(creationConfig.startingSkillPoints);

    // Set default background
    if (availableBackgrounds.length > 0) {
      setCharacterData(prev => ({ ...prev, backgroundId: availableBackgrounds[0].id }));
    }
  }, [characterManager]);

  const handleNameChange = (name: string) => {
    setCharacterData(prev => ({ ...prev, name }));
  };

  const handleBackgroundChange = (backgroundId: string) => {
    setCharacterData(prev => ({ ...prev, backgroundId }));
  };

  const handleAppearanceChange = (field: keyof CharacterAppearance, value: any) => {
    setCharacterData(prev => ({
      ...prev,
      appearance: { ...prev.appearance, [field]: value }
    }));
  };

  const handleAttributeChange = (attribute: keyof CharacterAttributes, value: number) => {
    if (!config) return;

    const currentValue = characterData.allocatedAttributes[attribute] || 0;
    const newValue = Math.max(0, Math.min(value, config.maxAttributeValue));
    const pointDifference = newValue - currentValue;

    if (remainingAttributePoints - pointDifference < 0) return;

    setCharacterData(prev => ({
      ...prev,
      allocatedAttributes: { ...prev.allocatedAttributes, [attribute]: newValue }
    }));
    setRemainingAttributePoints(prev => prev - pointDifference);
  };

  const handleSkillChange = (skill: keyof CharacterSkills, value: number) => {
    if (!config) return;

    const currentValue = characterData.allocatedSkills[skill] || 0;
    const newValue = Math.max(0, Math.min(value, config.maxSkillValue));
    const pointDifference = newValue - currentValue;

    if (remainingSkillPoints - pointDifference < 0) return;

    setCharacterData(prev => ({
      ...prev,
      allocatedSkills: { ...prev.allocatedSkills, [skill]: newValue }
    }));
    setRemainingSkillPoints(prev => prev - pointDifference);
  };

  const canProceed = (): boolean => {
    switch (step) {
      case 'basic':
        return characterData.name.trim().length > 0 && characterData.backgroundId.length > 0;
      case 'attributes':
      case 'skills':
        return true; // Can always proceed, remaining points are optional
      case 'review':
        return true;
      default:
        return false;
    }
  };

  const handleNext = () => {
    if (!canProceed()) return;

    switch (step) {
      case 'basic':
        setStep('attributes');
        break;
      case 'attributes':
        setStep('skills');
        break;
      case 'skills':
        setStep('review');
        break;
      case 'review':
        handleCreateCharacter();
        break;
    }
  };

  const handleBack = () => {
    switch (step) {
      case 'attributes':
        setStep('basic');
        break;
      case 'skills':
        setStep('attributes');
        break;
      case 'review':
        setStep('skills');
        break;
    }
  };

  const handleCreateCharacter = () => {
    try {
      const character = characterManager.createCharacter(
        'player-character',
        characterData.name,
        characterData.appearance,
        characterData.backgroundId,
        characterData.allocatedAttributes,
        characterData.allocatedSkills
      );

      if (character) {
        onComplete(true);
      } else {
        onComplete(false);
      }
    } catch (error) {
      console.error('Failed to create character:', error);
      onComplete(false);
    }
  };

  const selectedBackground = backgrounds.find(bg => bg.id === characterData.backgroundId);

  const renderBasicInfo = () => (
    <div className="character-creation-step">
      <h3>Basic Information</h3>
      
      <div className="form-group">
        <label>Character Name:</label>
        <input
          type="text"
          value={characterData.name}
          onChange={(e) => handleNameChange(e.target.value)}
          placeholder="Enter character name"
          maxLength={30}
        />
      </div>

      <div className="form-group">
        <label>Gender:</label>
        <select 
          value={characterData.appearance.gender}
          onChange={(e) => handleAppearanceChange('gender', e.target.value as any)}
        >
          <option value="male">Male</option>
          <option value="female">Female</option>
          <option value="other">Other</option>
        </select>
      </div>

      <div className="form-group">
        <label>Background:</label>
        <select
          value={characterData.backgroundId}
          onChange={(e) => handleBackgroundChange(e.target.value)}
        >
          {backgrounds.map(bg => (
            <option key={bg.id} value={bg.id}>{bg.name}</option>
          ))}
        </select>
      </div>

      {selectedBackground && (
        <div className="background-info">
          <h4>{selectedBackground.name}</h4>
          <p>{selectedBackground.description}</p>
          <div className="background-bonuses">
            <strong>Starting Bonuses:</strong>
            <ul>
              {Object.entries(selectedBackground.startingAttributeBonus).map(([attr, bonus]) => (
                <li key={attr}>{attr}: +{bonus}</li>
              ))}
              {Object.entries(selectedBackground.startingSkillBonus).map(([skill, bonus]) => (
                <li key={skill}>{skill}: +{bonus}</li>
              ))}
            </ul>
            <p>Starting Credits Bonus: {selectedBackground.startingCredits > 0 ? '+' : ''}{selectedBackground.startingCredits}</p>
          </div>
        </div>
      )}
    </div>
  );

  const renderAttributeAllocation = () => (
    <div className="character-creation-step">
      <h3>Attribute Allocation</h3>
      <p>Remaining Points: {remainingAttributePoints}</p>
      
      <div className="attribute-grid">
        {(['strength', 'intelligence', 'charisma', 'endurance', 'dexterity', 'perception'] as const).map(attr => {
          const baseValue = 10;
          const backgroundBonus = selectedBackground?.startingAttributeBonus[attr] || 0;
          const allocated = characterData.allocatedAttributes[attr] || 0;
          const totalValue = baseValue + backgroundBonus + allocated;

          return (
            <div key={attr} className="attribute-control">
              <label>{attr.charAt(0).toUpperCase() + attr.slice(1)}:</label>
              <div className="value-display">
                <span className="base-value">{baseValue}</span>
                {backgroundBonus > 0 && <span className="bonus-value">+{backgroundBonus}</span>}
                {allocated > 0 && <span className="allocated-value">+{allocated}</span>}
                <span className="total-value">= {totalValue}</span>
              </div>
              <input
                type="range"
                min="0"
                max={Math.min(config?.maxAttributeValue || 40, remainingAttributePoints + allocated)}
                value={allocated}
                onChange={(e) => handleAttributeChange(attr, parseInt(e.target.value))}
              />
              <input
                type="number"
                min="0"
                max={Math.min(config?.maxAttributeValue || 40, remainingAttributePoints + allocated)}
                value={allocated}
                onChange={(e) => handleAttributeChange(attr, parseInt(e.target.value) || 0)}
                className="number-input"
              />
            </div>
          );
        })}
      </div>
    </div>
  );

  const renderSkillAllocation = () => (
    <div className="character-creation-step">
      <h3>Skill Allocation</h3>
      <p>Remaining Points: {remainingSkillPoints}</p>
      
      <div className="skill-categories">
        <div className="skill-category">
          <h4>Trading Skills</h4>
          {(['trading', 'negotiation', 'economics'] as const).map(skill => {
            const backgroundBonus = selectedBackground?.startingSkillBonus[skill] || 0;
            const allocated = characterData.allocatedSkills[skill] || 0;
            const totalValue = backgroundBonus + allocated;

            return (
              <div key={skill} className="skill-control">
                <label>{skill.charAt(0).toUpperCase() + skill.slice(1)}:</label>
                <div className="value-display">
                  {backgroundBonus > 0 && <span className="bonus-value">{backgroundBonus}</span>}
                  {allocated > 0 && <span className="allocated-value">+{allocated}</span>}
                  <span className="total-value">= {totalValue}</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max={Math.min(config?.maxSkillValue || 50, remainingSkillPoints + allocated)}
                  value={allocated}
                  onChange={(e) => handleSkillChange(skill, parseInt(e.target.value))}
                />
                <input
                  type="number"
                  min="0"
                  max={Math.min(config?.maxSkillValue || 50, remainingSkillPoints + allocated)}
                  value={allocated}
                  onChange={(e) => handleSkillChange(skill, parseInt(e.target.value) || 0)}
                  className="number-input"
                />
              </div>
            );
          })}
        </div>

        <div className="skill-category">
          <h4>Technical Skills</h4>
          {(['engineering', 'piloting', 'navigation'] as const).map(skill => {
            const backgroundBonus = selectedBackground?.startingSkillBonus[skill] || 0;
            const allocated = characterData.allocatedSkills[skill] || 0;
            const totalValue = backgroundBonus + allocated;

            return (
              <div key={skill} className="skill-control">
                <label>{skill.charAt(0).toUpperCase() + skill.slice(1)}:</label>
                <div className="value-display">
                  {backgroundBonus > 0 && <span className="bonus-value">{backgroundBonus}</span>}
                  {allocated > 0 && <span className="allocated-value">+{allocated}</span>}
                  <span className="total-value">= {totalValue}</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max={Math.min(config?.maxSkillValue || 50, remainingSkillPoints + allocated)}
                  value={allocated}
                  onChange={(e) => handleSkillChange(skill, parseInt(e.target.value))}
                />
                <input
                  type="number"
                  min="0"
                  max={Math.min(config?.maxSkillValue || 50, remainingSkillPoints + allocated)}
                  value={allocated}
                  onChange={(e) => handleSkillChange(skill, parseInt(e.target.value) || 0)}
                  className="number-input"
                />
              </div>
            );
          })}
        </div>

        <div className="skill-category">
          <h4>Combat & Social Skills</h4>
          {(['combat', 'tactics', 'security', 'networking', 'investigation', 'leadership'] as const).map(skill => {
            const backgroundBonus = selectedBackground?.startingSkillBonus[skill] || 0;
            const allocated = characterData.allocatedSkills[skill] || 0;
            const totalValue = backgroundBonus + allocated;

            return (
              <div key={skill} className="skill-control">
                <label>{skill.charAt(0).toUpperCase() + skill.slice(1)}:</label>
                <div className="value-display">
                  {backgroundBonus > 0 && <span className="bonus-value">{backgroundBonus}</span>}
                  {allocated > 0 && <span className="allocated-value">+{allocated}</span>}
                  <span className="total-value">= {totalValue}</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max={Math.min(config?.maxSkillValue || 50, remainingSkillPoints + allocated)}
                  value={allocated}
                  onChange={(e) => handleSkillChange(skill, parseInt(e.target.value))}
                />
                <input
                  type="number"
                  min="0"
                  max={Math.min(config?.maxSkillValue || 50, remainingSkillPoints + allocated)}
                  value={allocated}
                  onChange={(e) => handleSkillChange(skill, parseInt(e.target.value) || 0)}
                  className="number-input"
                />
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );

  const renderReview = () => (
    <div className="character-creation-step">
      <h3>Character Review</h3>
      
      <div className="character-summary">
        <h4>{characterData.name}</h4>
        <p>Background: {selectedBackground?.name}</p>
        <p>Gender: {characterData.appearance.gender}</p>
        
        <div className="final-attributes">
          <h5>Final Attributes:</h5>
          {(['strength', 'intelligence', 'charisma', 'endurance', 'dexterity', 'perception'] as const).map(attr => {
            const baseValue = 10;
            const backgroundBonus = selectedBackground?.startingAttributeBonus[attr] || 0;
            const allocated = characterData.allocatedAttributes[attr] || 0;
            const totalValue = baseValue + backgroundBonus + allocated;

            return (
              <div key={attr} className="final-stat">
                <span>{attr.charAt(0).toUpperCase() + attr.slice(1)}: {totalValue}</span>
              </div>
            );
          })}
        </div>

        <div className="final-skills">
          <h5>Final Skills:</h5>
          {(['trading', 'negotiation', 'economics', 'engineering', 'piloting', 'navigation', 'combat', 'tactics', 'security', 'networking', 'investigation', 'leadership'] as const).map(skill => {
            const backgroundBonus = selectedBackground?.startingSkillBonus[skill] || 0;
            const allocated = characterData.allocatedSkills[skill] || 0;
            const totalValue = backgroundBonus + allocated;

            if (totalValue > 0) {
              return (
                <div key={skill} className="final-stat">
                  <span>{skill.charAt(0).toUpperCase() + skill.slice(1)}: {totalValue}</span>
                </div>
              );
            }
            return null;
          })}
        </div>

        <p className="unused-points-warning">
          {remainingAttributePoints > 0 && `Unused attribute points: ${remainingAttributePoints}`}
          {remainingAttributePoints > 0 && remainingSkillPoints > 0 && ', '}
          {remainingSkillPoints > 0 && `Unused skill points: ${remainingSkillPoints}`}
        </p>
      </div>
    </div>
  );

  if (!config) {
    return <div className="character-creation-loading">Loading character creation...</div>;
  }

  return (
    <div className="character-creation-panel">
      <div className="character-creation-header">
        <h2>Character Creation</h2>
        <div className="step-indicator">
          <span className={step === 'basic' ? 'active' : ['attributes', 'skills', 'review'].includes(step) ? 'completed' : ''}>Basic Info</span>
          <span className={step === 'attributes' ? 'active' : ['skills', 'review'].includes(step) ? 'completed' : ''}>Attributes</span>
          <span className={step === 'skills' ? 'active' : step === 'review' ? 'completed' : ''}>Skills</span>
          <span className={step === 'review' ? 'active' : ''}>Review</span>
        </div>
      </div>

      <div className="character-creation-content">
        {step === 'basic' && renderBasicInfo()}
        {step === 'attributes' && renderAttributeAllocation()}
        {step === 'skills' && renderSkillAllocation()}
        {step === 'review' && renderReview()}
      </div>

      <div className="character-creation-controls">
        <button onClick={onCancel} className="cancel-button">
          Cancel
        </button>
        
        {step !== 'basic' && (
          <button onClick={handleBack} className="back-button">
            Back
          </button>
        )}
        
        <button 
          onClick={handleNext} 
          className="next-button"
          disabled={!canProceed()}
        >
          {step === 'review' ? 'Create Character' : 'Next'}
        </button>
      </div>
    </div>
  );
};