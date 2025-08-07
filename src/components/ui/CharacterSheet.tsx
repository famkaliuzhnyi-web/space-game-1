/**
 * CharacterSheet Component
 * Display character information, skills, progression, and personal equipment
 */

import React, { useState, useEffect } from 'react';
import { CharacterManager } from '../../systems/CharacterManager';
import { SkillSpecializationManager } from '../../systems/SkillSpecializationManager';
import { Character } from '../../types/character';
import './CharacterSheet.css';

interface CharacterSheetProps {
  characterManager: CharacterManager;
  skillSpecializationManager?: SkillSpecializationManager;
  onClose?: () => void;
  compact?: boolean; // For showing in sidebar
}

export const CharacterSheet: React.FC<CharacterSheetProps> = ({
  characterManager,
  skillSpecializationManager,
  onClose,
  compact = false
}) => {
  const [character, setCharacter] = useState<Character | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'skills' | 'equipment' | 'progression'>('overview');

  useEffect(() => {
    const updateCharacter = () => {
      setCharacter(characterManager.getCharacter());
    };

    updateCharacter();
    // In a real app, you'd want to listen for character updates
    const interval = setInterval(updateCharacter, 1000);
    return () => clearInterval(interval);
  }, [characterManager]);

  if (!character) {
    return compact ? null : (
      <div className="character-sheet-empty">
        <h3>No Character Created</h3>
        <p>Create a character to view character information.</p>
      </div>
    );
  }

  const effectiveAttributes = characterManager.getEffectiveAttributes();

  const renderOverview = () => (
    <div className="character-overview">
      <div className="character-basic-info">
        <h3>{character.name}</h3>
        <p className="character-background">{character.background.name}</p>
        <p className="character-level">Level {character.progression.level}</p>
        <div className="experience-bar">
          <div 
            className="experience-fill"
            style={{ 
              width: `${(character.progression.experience / character.progression.experienceToNext) * 100}%` 
            }}
          />
          <span className="experience-text">
            {character.progression.experience} / {character.progression.experienceToNext} XP
          </span>
        </div>
      </div>

      <div className="character-attributes">
        <h4>Attributes</h4>
        <div className="attribute-list">
          {(['strength', 'intelligence', 'charisma', 'endurance', 'dexterity', 'perception'] as const).map(attr => (
            <div key={attr} className="attribute-item">
              <span className="attribute-name">
                {attr.charAt(0).toUpperCase() + attr.slice(1)}:
              </span>
              <span className="attribute-value">{effectiveAttributes[attr]}</span>
              {effectiveAttributes[attr] !== character.attributes[attr] && (
                <span className="attribute-bonus">
                  ({character.attributes[attr]}+{effectiveAttributes[attr] - character.attributes[attr]})
                </span>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="character-points">
        <div className="available-points">
          <div className="point-type">
            <span>Skill Points:</span>
            <span className="point-value">{character.progression.skillPoints}</span>
          </div>
          <div className="point-type">
            <span>Attribute Points:</span>
            <span className="point-value">{character.progression.attributePoints}</span>
          </div>
        </div>
      </div>
    </div>
  );

  const renderSkills = () => {
    const skillTrees = skillSpecializationManager?.getAllSkillTrees();
    const playerTrees = skillSpecializationManager?.getPlayerSkillTrees();

    return (
      <div className="character-skills">
        <div className="skills-header">
          <h4>Skills</h4>
          {character.progression.skillPoints > 0 && (
            <span className="available-points-indicator">
              {character.progression.skillPoints} points available
            </span>
          )}
          {skillSpecializationManager && playerTrees && (
            <span className="skill-tree-points">
              Skill Tree Points: {playerTrees.availableSkillPoints}
            </span>
          )}
        </div>

        <div className="skill-categories">
          <div className="skill-category">
            <h5>Trading</h5>
            {(['trading', 'negotiation', 'economics'] as const).map(skill => (
              <div key={skill} className="skill-item">
                <span className="skill-name">{skill.charAt(0).toUpperCase() + skill.slice(1)}</span>
                <span className="skill-value">{character.skills[skill]}</span>
                <div className="skill-bar">
                  <div 
                    className="skill-fill"
                    style={{ width: `${character.skills[skill]}%` }}
                  />
                </div>
              </div>
            ))}
            
            {/* Skill Tree Nodes for Trading */}
            {skillSpecializationManager && skillTrees && (
              <div className="skill-tree-nodes">
                {skillTrees
                  .filter(tree => tree.category === 'trading')
                  .map(tree => 
                    tree.nodes
                      .filter(node => node.category === 'trading')
                      .slice(0, 3) // Show first 3 nodes as preview
                      .map(node => (
                        <div key={node.id} className="skill-node-preview">
                          <span className="node-icon">{node.icon}</span>
                          <span className="node-name">{node.name}</span>
                          <span className="node-rank">{node.currentRank}/{node.maxRank}</span>
                        </div>
                      ))
                  )}
              </div>
            )}
          </div>

          <div className="skill-category">
            <h5>Technical</h5>
            {(['engineering', 'piloting', 'navigation'] as const).map(skill => (
              <div key={skill} className="skill-item">
                <span className="skill-name">{skill.charAt(0).toUpperCase() + skill.slice(1)}</span>
                <span className="skill-value">{character.skills[skill]}</span>
                <div className="skill-bar">
                  <div 
                    className="skill-fill"
                    style={{ width: `${character.skills[skill]}%` }}
                  />
                </div>
              </div>
            ))}
            
            {/* Skill Tree Nodes for Technical */}
            {skillSpecializationManager && skillTrees && (
              <div className="skill-tree-nodes">
                {skillTrees
                  .filter(tree => tree.category === 'technical')
                  .map(tree => 
                    tree.nodes
                      .filter(node => node.category === 'technical')
                      .slice(0, 3)
                      .map(node => (
                        <div key={node.id} className="skill-node-preview">
                          <span className="node-icon">{node.icon}</span>
                          <span className="node-name">{node.name}</span>
                          <span className="node-rank">{node.currentRank}/{node.maxRank}</span>
                        </div>
                      ))
                  )}
              </div>
            )}
          </div>

          <div className="skill-category">
            <h5>Combat & Social</h5>
            {(['combat', 'tactics', 'security', 'networking', 'investigation', 'leadership'] as const).map(skill => (
              <div key={skill} className="skill-item">
                <span className="skill-name">{skill.charAt(0).toUpperCase() + skill.slice(1)}</span>
                <span className="skill-value">{character.skills[skill]}</span>
                <div className="skill-bar">
                  <div 
                    className="skill-fill"
                    style={{ width: `${character.skills[skill]}%` }}
                  />
                </div>
              </div>
            ))}

            {/* Skill Tree Nodes for Combat & Social */}
            {skillSpecializationManager && skillTrees && (
              <div className="skill-tree-nodes">
                {skillTrees
                  .filter(tree => tree.category === 'combat' || tree.category === 'social')
                  .map(tree => 
                    tree.nodes
                      .filter(node => node.category === 'combat' || node.category === 'social')
                      .slice(0, 3)
                      .map(node => (
                        <div key={node.id} className="skill-node-preview">
                          <span className="node-icon">{node.icon}</span>
                          <span className="node-name">{node.name}</span>
                          <span className="node-rank">{node.currentRank}/{node.maxRank}</span>
                        </div>
                      ))
                  )}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  const renderEquipment = () => (
    <div className="character-equipment">
      <h4>Personal Equipment</h4>
      
      <div className="equipment-slots">
        {(['suit', 'tool', 'datapad', 'accessory'] as const).map(slotType => {
          const item = character.personalEquipment[slotType];
          return (
            <div key={slotType} className="equipment-slot">
              <div className="slot-header">
                <span className="slot-name">{slotType.charAt(0).toUpperCase() + slotType.slice(1)}</span>
              </div>
              {item ? (
                <div className="equipped-item">
                  <div className="item-info">
                    <span className="item-name">{item.name}</span>
                    <span className={`item-rarity ${item.rarity}`}>{item.rarity}</span>
                  </div>
                  <div className="item-condition">
                    <span>Condition: {Math.round(item.durability * 100)}%</span>
                  </div>
                  <div className="item-effects">
                    {Object.entries(item.effects).map(([effect, value]) => {
                      if (value && value !== 0) {
                        return (
                          <div key={effect} className="effect-item">
                            <span className="effect-name">{effect}:</span>
                            <span className="effect-value">+{value}</span>
                          </div>
                        );
                      }
                      return null;
                    })}
                  </div>
                </div>
              ) : (
                <div className="empty-slot">
                  <span>Empty</span>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );

  const renderProgression = () => {
    const experienceHistory = characterManager.getExperienceHistory(20);
    
    return (
      <div className="character-progression">
        <div className="progression-stats">
          <h4>Progression</h4>
          <div className="progression-info">
            <div className="stat-item">
              <span>Level:</span>
              <span>{character.progression.level}</span>
            </div>
            <div className="stat-item">
              <span>Total Experience:</span>
              <span>{character.progression.experience}</span>
            </div>
            <div className="stat-item">
              <span>Skill Points Earned:</span>
              <span>{character.progression.totalSkillPointsSpent + character.progression.skillPoints}</span>
            </div>
            <div className="stat-item">
              <span>Attribute Points Earned:</span>
              <span>{character.progression.totalAttributePointsSpent + character.progression.attributePoints}</span>
            </div>
          </div>
        </div>

        <div className="achievements">
          <h5>Achievements</h5>
          {character.achievements.length > 0 ? (
            <div className="achievement-list">
              {character.achievements.map((achievementId, index) => (
                <div key={index} className="achievement-item">
                  {achievementId}
                </div>
              ))}
            </div>
          ) : (
            <p className="no-achievements">No achievements yet.</p>
          )}
        </div>

        <div className="experience-history">
          <h5>Recent Experience Gains</h5>
          {experienceHistory.length > 0 ? (
            <div className="experience-list">
              {experienceHistory.slice().reverse().map((exp, index) => (
                <div key={index} className="experience-item">
                  <span className="exp-amount">+{exp.amount} XP</span>
                  <span className="exp-source">{exp.source}</span>
                  <span className="exp-category">({exp.category})</span>
                  <span className="exp-time">
                    {new Date(exp.timestamp).toLocaleTimeString()}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="no-experience">No experience gained yet.</p>
          )}
        </div>
      </div>
    );
  };

  if (compact) {
    return (
      <div className="character-sheet-compact">
        <div className="compact-header">
          <h4>{character.name}</h4>
          <span className="compact-level">Lv.{character.progression.level}</span>
        </div>
        <div className="compact-progress">
          <div className="compact-exp-bar">
            <div 
              className="compact-exp-fill"
              style={{ 
                width: `${(character.progression.experience / character.progression.experienceToNext) * 100}%` 
              }}
            />
          </div>
          <span className="compact-exp-text">
            {character.progression.experience} / {character.progression.experienceToNext} XP
          </span>
        </div>
        {(character.progression.skillPoints > 0 || character.progression.attributePoints > 0) && (
          <div className="compact-points">
            {character.progression.skillPoints > 0 && (
              <span className="compact-point-indicator">SP: {character.progression.skillPoints}</span>
            )}
            {character.progression.attributePoints > 0 && (
              <span className="compact-point-indicator">AP: {character.progression.attributePoints}</span>
            )}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="character-sheet">
      <div className="character-sheet-header">
        <h2>Character Sheet</h2>
        {onClose && (
          <button onClick={onClose} className="close-button">×</button>
        )}
      </div>

      <div className="character-sheet-tabs">
        <button 
          className={activeTab === 'overview' ? 'active' : ''}
          onClick={() => setActiveTab('overview')}
        >
          Overview
        </button>
        <button 
          className={activeTab === 'skills' ? 'active' : ''}
          onClick={() => setActiveTab('skills')}
        >
          Skills
        </button>
        <button 
          className={activeTab === 'equipment' ? 'active' : ''}
          onClick={() => setActiveTab('equipment')}
        >
          Equipment
        </button>
        <button 
          className={activeTab === 'progression' ? 'active' : ''}
          onClick={() => setActiveTab('progression')}
        >
          Progression
        </button>
      </div>

      <div className="character-sheet-content">
        {activeTab === 'overview' && renderOverview()}
        {activeTab === 'skills' && renderSkills()}
        {activeTab === 'equipment' && renderEquipment()}
        {activeTab === 'progression' && renderProgression()}
      </div>
    </div>
  );
};