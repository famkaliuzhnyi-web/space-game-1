/**
 * SkillSpecializationManager
 * Manages skill trees, specializations, and advanced character progression
 */

import {
  SkillTree,
  SkillNode, 
  SkillSpecialization,
  PlayerSkillTrees,
  SkillPointCosts,
  SkillAdvancementNotification,
  EnhancedCharacterSkills,
  ActiveSkillBonus,
  SkillCategory
} from '../types/skillTrees';
import { CharacterSkills } from '../types/character';

interface SkillSpecializationManagerSaveData {
  playerSkillTrees: PlayerSkillTrees;
}

export class SkillSpecializationManager {
  private skillTrees: Map<string, SkillTree> = new Map();
  private specializations: Map<string, SkillSpecialization> = new Map();
  private playerSkillTrees: PlayerSkillTrees;
  private skillPointCosts: SkillPointCosts;
  private eventListeners: Map<string, ((notification: SkillAdvancementNotification) => void)[]> = new Map();

  constructor() {
    this.playerSkillTrees = {
      unlockedNodes: new Map(),
      specializations: [],
      availableSkillPoints: 0,
      totalSkillPointsSpent: 0
    };
    
    this.skillPointCosts = {
      tier1: 1,
      tier2: 2,
      tier3: 3,
      tier4: 5,
      tier5: 8
    };

    this.initializeSkillTrees();
    this.initializeSpecializations();
  }

  /**
   * Initialize all skill trees and their nodes
   */
  private initializeSkillTrees(): void {
    // Trading Mastery Tree
    const tradingTree: SkillTree = {
      id: 'trading_mastery',
      name: 'Trading Mastery',
      description: 'Advanced trading techniques and market manipulation',
      category: 'trading',
      baseSkills: ['trading', 'negotiation', 'economics'],
      nodes: [
        // Tier 1 nodes
        {
          id: 'market_sense',
          name: 'Market Sense',
          description: 'Intuitive understanding of market fluctuations',
          category: 'trading',
          baseSkill: 'trading',
          tier: 1,
          maxRank: 3,
          currentRank: 0,
          prerequisites: [
            { type: 'skill', id: 'trading', value: 25 }
          ],
          effects: [
            { type: 'percentage_bonus', target: 'trade_profit', value: 2, description: '+2% trade profit per rank' }
          ],
          icon: '📈'
        },
        {
          id: 'haggling_expert',
          name: 'Haggling Expert', 
          description: 'Exceptional negotiation skills for better deals',
          category: 'trading',
          baseSkill: 'negotiation',
          tier: 1,
          maxRank: 3,
          currentRank: 0,
          prerequisites: [
            { type: 'skill', id: 'negotiation', value: 20 }
          ],
          effects: [
            { type: 'percentage_bonus', target: 'contract_bonus', value: 3, description: '+3% contract bonuses per rank' }
          ],
          icon: '🤝'
        },
        {
          id: 'economic_analyst',
          name: 'Economic Analyst',
          description: 'Deep understanding of economic patterns and trends',
          category: 'trading',
          baseSkill: 'economics',
          tier: 1,
          maxRank: 3,
          currentRank: 0,
          prerequisites: [
            { type: 'skill', id: 'economics', value: 20 }
          ],
          effects: [
            { type: 'unlock_ability', target: 'market_prediction', value: 1, description: 'Unlocks advanced market prediction tools' }
          ],
          icon: '📊'
        },
        // Tier 2 nodes
        {
          id: 'trade_baron',
          name: 'Trade Baron',
          description: 'Mastery of high-value commodity trading',
          category: 'trading', 
          baseSkill: 'trading',
          tier: 2,
          maxRank: 2,
          currentRank: 0,
          prerequisites: [
            { type: 'skill', id: 'trading', value: 40 },
            { type: 'node', id: 'market_sense', value: 2 }
          ],
          effects: [
            { type: 'percentage_bonus', target: 'high_value_trade_bonus', value: 10, description: '+10% bonus on trades over 100k CR per rank' }
          ],
          icon: '👑'
        },
        {
          id: 'contract_master',
          name: 'Contract Master',
          description: 'Unparalleled skill in contract negotiation',
          category: 'trading',
          baseSkill: 'negotiation',
          tier: 2,
          maxRank: 2,
          currentRank: 0,
          prerequisites: [
            { type: 'skill', id: 'negotiation', value: 35 },
            { type: 'node', id: 'haggling_expert', value: 2 }
          ],
          effects: [
            { type: 'flat_bonus', target: 'contract_slots', value: 1, description: '+1 additional contract slot per rank' }
          ],
          icon: '📋'
        }
      ],
      layout: {
        width: 5,
        height: 4, 
        nodePositions: new Map([
          ['market_sense', { x: 1, y: 0 }],
          ['haggling_expert', { x: 2, y: 0 }],
          ['economic_analyst', { x: 3, y: 0 }],
          ['trade_baron', { x: 1, y: 1 }],
          ['contract_master', { x: 2, y: 1 }]
        ]),
        connections: [
          { fromNodeId: 'market_sense', toNodeId: 'trade_baron', connectionType: 'prerequisite' },
          { fromNodeId: 'haggling_expert', toNodeId: 'contract_master', connectionType: 'prerequisite' }
        ]
      }
    };

    // Technical Engineering Tree
    const technicalTree: SkillTree = {
      id: 'technical_mastery',
      name: 'Technical Mastery',
      description: 'Advanced engineering and ship systems expertise',
      category: 'technical',
      baseSkills: ['engineering', 'piloting', 'navigation'],
      nodes: [
        // Tier 1 nodes
        {
          id: 'systems_expert',
          name: 'Systems Expert',
          description: 'Deep knowledge of ship systems and maintenance',
          category: 'technical',
          baseSkill: 'engineering',
          tier: 1,
          maxRank: 3,
          currentRank: 0,
          prerequisites: [
            { type: 'skill', id: 'engineering', value: 25 }
          ],
          effects: [
            { type: 'percentage_bonus', target: 'maintenance_cost_reduction', value: 5, description: '-5% maintenance costs per rank' }
          ],
          icon: '⚙️'
        },
        {
          id: 'ace_pilot',
          name: 'Ace Pilot',
          description: 'Superior piloting skills and ship handling',
          category: 'technical',
          baseSkill: 'piloting',
          tier: 1,
          maxRank: 3,
          currentRank: 0,
          prerequisites: [
            { type: 'skill', id: 'piloting', value: 30 }
          ],
          effects: [
            { type: 'percentage_bonus', target: 'fuel_efficiency', value: 3, description: '+3% fuel efficiency per rank' }
          ],
          icon: '✈️'
        },
        {
          id: 'navigator',
          name: 'Navigator',
          description: 'Expert route planning and space navigation',
          category: 'technical',
          baseSkill: 'navigation', 
          tier: 1,
          maxRank: 3,
          currentRank: 0,
          prerequisites: [
            { type: 'skill', id: 'navigation', value: 25 }
          ],
          effects: [
            { type: 'percentage_bonus', target: 'travel_time_reduction', value: 4, description: '-4% travel time per rank' }
          ],
          icon: '🧭'
        },
        // Tier 2 nodes
        {
          id: 'master_engineer',
          name: 'Master Engineer',
          description: 'Pinnacle of engineering expertise',
          category: 'technical',
          baseSkill: 'engineering', 
          tier: 2,
          maxRank: 2,
          currentRank: 0,
          prerequisites: [
            { type: 'skill', id: 'engineering', value: 50 },
            { type: 'node', id: 'systems_expert', value: 3 }
          ],
          effects: [
            { type: 'unlock_ability', target: 'advanced_modifications', value: 1, description: 'Unlocks advanced ship modifications' }
          ],
          icon: '🔧'
        }
      ],
      layout: {
        width: 5,
        height: 3,
        nodePositions: new Map([
          ['systems_expert', { x: 1, y: 0 }],
          ['ace_pilot', { x: 2, y: 0 }],
          ['navigator', { x: 3, y: 0 }],
          ['master_engineer', { x: 1, y: 1 }]
        ]),
        connections: [
          { fromNodeId: 'systems_expert', toNodeId: 'master_engineer', connectionType: 'prerequisite' }
        ]
      }
    };

    // Combat Prowess Tree  
    const combatTree: SkillTree = {
      id: 'combat_prowess',
      name: 'Combat Prowess', 
      description: 'Advanced combat techniques and tactical superiority',
      category: 'combat',
      baseSkills: ['combat', 'tactics', 'security'],
      nodes: [
        {
          id: 'weapon_specialist',
          name: 'Weapon Specialist',
          description: 'Expert weapon handling and combat effectiveness',
          category: 'combat',
          baseSkill: 'combat',
          tier: 1,
          maxRank: 3,
          currentRank: 0,
          prerequisites: [
            { type: 'skill', id: 'combat', value: 25 }
          ],
          effects: [
            { type: 'percentage_bonus', target: 'weapon_damage', value: 8, description: '+8% weapon damage per rank' }
          ],
          icon: '⚔️'
        },
        {
          id: 'tactical_genius',
          name: 'Tactical Genius',
          description: 'Superior battlefield tactics and strategy',
          category: 'combat',
          baseSkill: 'tactics',
          tier: 1,
          maxRank: 3,
          currentRank: 0,
          prerequisites: [
            { type: 'skill', id: 'tactics', value: 30 }
          ],
          effects: [
            { type: 'percentage_bonus', target: 'combat_initiative', value: 5, description: '+5% combat initiative per rank' }
          ],
          icon: '🧠'
        }
      ],
      layout: {
        width: 4,
        height: 2,
        nodePositions: new Map([
          ['weapon_specialist', { x: 1, y: 0 }],
          ['tactical_genius', { x: 2, y: 0 }]
        ]),
        connections: []
      }
    };

    // Social Influence Tree
    const socialTree: SkillTree = {
      id: 'social_influence',
      name: 'Social Influence',
      description: 'Advanced networking and social manipulation',
      category: 'social',
      baseSkills: ['networking', 'investigation', 'leadership'],
      nodes: [
        {
          id: 'master_networker',
          name: 'Master Networker',
          description: 'Extensive contact network and influence',
          category: 'social',
          baseSkill: 'networking',
          tier: 1,
          maxRank: 3,
          currentRank: 0,
          prerequisites: [
            { type: 'skill', id: 'networking', value: 25 }
          ],
          effects: [
            { type: 'flat_bonus', target: 'contact_trust_gain', value: 2, description: '+2 trust gain with contacts per rank' }
          ],
          icon: '🤝'
        },
        {
          id: 'information_broker',
          name: 'Information Broker',
          description: 'Expert at gathering and trading information',
          category: 'social',
          baseSkill: 'investigation',
          tier: 1,
          maxRank: 3,
          currentRank: 0,
          prerequisites: [
            { type: 'skill', id: 'investigation', value: 30 }
          ],
          effects: [
            { type: 'unlock_ability', target: 'market_intelligence', value: 1, description: 'Unlocks advanced market intelligence gathering' }
          ],
          icon: '🕵️'
        }
      ],
      layout: {
        width: 4,
        height: 2,
        nodePositions: new Map([
          ['master_networker', { x: 1, y: 0 }],
          ['information_broker', { x: 2, y: 0 }]
        ]),
        connections: []
      }
    };

    // Register all skill trees
    this.skillTrees.set('trading_mastery', tradingTree);
    this.skillTrees.set('technical_mastery', technicalTree);
    this.skillTrees.set('combat_prowess', combatTree);
    this.skillTrees.set('social_influence', socialTree);
  }

  /**
   * Initialize specializations that can be unlocked
   */
  private initializeSpecializations(): void {
    const specializations: SkillSpecialization[] = [
      {
        id: 'merchant_prince',
        name: 'Merchant Prince',
        description: 'Master of commerce with unparalleled trading expertise',
        category: 'trading',
        unlockRequirements: [
          { type: 'node', id: 'trade_baron', value: 2 },
          { type: 'node', id: 'contract_master', value: 1 },
          { type: 'skill', id: 'trading', value: 60 }
        ],
        benefits: [
          { type: 'skill_cap_increase', target: 'trading', value: 20, description: 'Increases trading skill cap by 20' },
          { type: 'experience_bonus', target: 'trading', value: 50, description: '+50% trading experience gain' }
        ],
        title: 'Merchant Prince',
        isUnlocked: false
      },
      {
        id: 'chief_engineer', 
        name: 'Chief Engineer',
        description: 'Supreme technical expertise and engineering mastery',
        category: 'technical',
        unlockRequirements: [
          { type: 'node', id: 'master_engineer', value: 2 },
          { type: 'skill', id: 'engineering', value: 70 }
        ],
        benefits: [
          { type: 'skill_cap_increase', target: 'engineering', value: 25, description: 'Increases engineering skill cap by 25' },
          { type: 'cost_reduction', target: 'ship_modifications', value: 25, description: '-25% ship modification costs' }
        ],
        title: 'Chief Engineer',
        isUnlocked: false
      },
      {
        id: 'fleet_commander',
        name: 'Fleet Commander',
        description: 'Ultimate combat leadership and tactical supremacy',
        category: 'combat', 
        unlockRequirements: [
          { type: 'node', id: 'weapon_specialist', value: 3 },
          { type: 'node', id: 'tactical_genius', value: 2 },
          { type: 'skill', id: 'combat', value: 50 },
          { type: 'skill', id: 'tactics', value: 50 }
        ],
        benefits: [
          { type: 'unlock_content', target: 'fleet_combat', value: 1, description: 'Unlocks fleet combat mechanics' },
          { type: 'experience_bonus', target: 'combat', value: 100, description: '+100% combat experience gain' }
        ],
        title: 'Fleet Commander',
        isUnlocked: false
      },
      {
        id: 'shadow_broker',
        name: 'Shadow Broker',
        description: 'Master of information and social manipulation',
        category: 'social',
        unlockRequirements: [
          { type: 'node', id: 'master_networker', value: 3 },
          { type: 'node', id: 'information_broker', value: 2 },
          { type: 'skill', id: 'networking', value: 60 }
        ],
        benefits: [
          { type: 'unlock_content', target: 'information_trading', value: 1, description: 'Unlocks advanced information trading' },
          { type: 'skill_cap_increase', target: 'investigation', value: 30, description: 'Increases investigation skill cap by 30' }
        ],
        title: 'Shadow Broker',
        isUnlocked: false
      }
    ];

    specializations.forEach(spec => {
      this.specializations.set(spec.id, spec);
    });
  }

  /**
   * Check if a player can unlock a specific skill node
   */
  canUnlockNode(nodeId: string, playerSkills: CharacterSkills, playerLevel: number, playerAttributes: Record<string, number>): { canUnlock: boolean, missingRequirements: string[] } {
    const node = this.getNodeById(nodeId);
    if (!node) {
      return { canUnlock: false, missingRequirements: ['Node not found'] };
    }

    // Check if already at max rank
    if (node.currentRank >= node.maxRank) {
      return { canUnlock: false, missingRequirements: ['Already at maximum rank'] };
    }

    const missingRequirements: string[] = [];

    // Check all prerequisites
    for (const req of node.prerequisites) {
      switch (req.type) {
        case 'skill': {
          const skillValue = (playerSkills as any)[req.id] || 0;
          if (skillValue < req.value) {
            missingRequirements.push(`${req.id} skill must be ${req.value} (currently ${skillValue})`);
          }
          break;
        }
        case 'node': {
          const nodeRank = this.playerSkillTrees.unlockedNodes.get(req.id) || 0;
          if (nodeRank < req.value) {
            missingRequirements.push(`${req.id} node must be rank ${req.value} (currently ${nodeRank})`);
          }
          break;
        }
        case 'level':
          if (playerLevel < req.value) {
            missingRequirements.push(`Character level must be ${req.value} (currently ${playerLevel})`);
          }
          break;
        case 'attribute': {
          const attrValue = playerAttributes[req.id] || 0;
          if (attrValue < req.value) {
            missingRequirements.push(`${req.id} attribute must be ${req.value} (currently ${attrValue})`);
          }
          break;
        }
      }
    }

    return { canUnlock: missingRequirements.length === 0, missingRequirements };
  }

  /**
   * Unlock or upgrade a skill node
   */
  unlockNode(nodeId: string, playerSkills: CharacterSkills, playerLevel: number, playerAttributes: Record<string, number>): SkillAdvancementNotification | null {
    const canUnlock = this.canUnlockNode(nodeId, playerSkills, playerLevel, playerAttributes);
    if (!canUnlock.canUnlock) {
      return null;
    }

    const node = this.getNodeById(nodeId);
    if (!node) {
      return null;
    }

    // Calculate skill point cost
    const costMultiplier = this.getSkillPointCost(node.tier);
    const skillPointCost = costMultiplier;

    if (this.playerSkillTrees.availableSkillPoints < skillPointCost) {
      return null;
    }

    // Deduct skill points and advance node
    this.playerSkillTrees.availableSkillPoints -= skillPointCost;
    this.playerSkillTrees.totalSkillPointsSpent += skillPointCost;
    
    const currentRank = this.playerSkillTrees.unlockedNodes.get(nodeId) || 0;
    const newRank = currentRank + 1;
    this.playerSkillTrees.unlockedNodes.set(nodeId, newRank);
    this.playerSkillTrees.lastNodeUnlocked = nodeId;

    // Update node's current rank
    node.currentRank = newRank;

    // Create notification
    const notification: SkillAdvancementNotification = {
      type: newRank === 1 ? 'node_unlocked' : 'rank_increased',
      nodeId,
      newRank,
      skillPointsSpent: skillPointCost,
      effects: node.effects
    };

    // Emit event
    this.emitEvent('skill_advancement', notification);

    // Check for newly unlocked specializations
    this.checkSpecializationUnlocks(playerSkills);

    return notification;
  }

  /**
   * Check if any specializations can be unlocked
   */
  private checkSpecializationUnlocks(playerSkills: CharacterSkills): void {
    for (const [specId, specialization] of this.specializations) {
      if (specialization.isUnlocked || this.playerSkillTrees.specializations.includes(specId)) {
        continue;
      }

      // Check if requirements are met
      const requirementsMet = specialization.unlockRequirements.every(req => {
        switch (req.type) {
          case 'skill':
            return ((playerSkills as any)[req.id] || 0) >= req.value;
          case 'node':
            return (this.playerSkillTrees.unlockedNodes.get(req.id) || 0) >= req.value;
          default:
            return false;
        }
      });

      if (requirementsMet) {
        this.unlockSpecialization(specId);
      }
    }
  }

  /**
   * Unlock a specialization
   */
  private unlockSpecialization(specializationId: string): void {
    const specialization = this.specializations.get(specializationId);
    if (!specialization || specialization.isUnlocked) {
      return;
    }

    specialization.isUnlocked = true;
    specialization.dateUnlocked = new Date();
    this.playerSkillTrees.specializations.push(specializationId);

    // Create notification
    const notification: SkillAdvancementNotification = {
      type: 'specialization_unlocked',
      specializationId,
      skillPointsSpent: 0,
      effects: []
    };

    this.emitEvent('specialization_unlocked', notification);
  }

  /**
   * Get skill point cost for a tier
   */
  private getSkillPointCost(tier: number): number {
    switch (tier) {
      case 1: return this.skillPointCosts.tier1;
      case 2: return this.skillPointCosts.tier2;
      case 3: return this.skillPointCosts.tier3;
      case 4: return this.skillPointCosts.tier4;
      case 5: return this.skillPointCosts.tier5;
      default: return 1;
    }
  }

  /**
   * Calculate enhanced skills with all bonuses applied
   */
  calculateEnhancedSkills(baseSkills: CharacterSkills): EnhancedCharacterSkills {
    const baseSkillsRecord = { ...baseSkills } as Record<string, number>;
    const nodeBonus: Record<string, number> = {};
    const totalSkills: Record<string, number> = { ...baseSkillsRecord };
    const activeBonuses: ActiveSkillBonus[] = [];

    // Apply bonuses from unlocked skill nodes
    for (const [nodeId, rank] of this.playerSkillTrees.unlockedNodes) {
      const node = this.getNodeById(nodeId);
      if (!node) continue;

      // Apply each effect based on rank
      for (const effect of node.effects) {
        const totalValue = effect.value * rank;
        
        switch (effect.type) {
          case 'skill_bonus':
            nodeBonus[effect.target] = (nodeBonus[effect.target] || 0) + totalValue;
            totalSkills[effect.target] = (totalSkills[effect.target] || 0) + totalValue;
            break;
          case 'percentage_bonus':
          case 'flat_bonus':
          case 'unlock_ability':
            activeBonuses.push({
              source: nodeId,
              type: effect.type === 'percentage_bonus' ? 'percentage' : 'flat',
              target: effect.target,
              value: totalValue,
              description: `${effect.description} (Rank ${rank})`
            });
            break;
        }
      }
    }

    return {
      baseSkills: baseSkillsRecord,
      nodeBonus,
      totalSkills,
      activeBonuses
    };
  }

  /**
   * Add skill points to the player's available pool
   */
  addSkillPoints(amount: number): void {
    this.playerSkillTrees.availableSkillPoints += amount;
  }

  /**
   * Get a specific skill tree by ID
   */
  getSkillTree(treeId: string): SkillTree | null {
    return this.skillTrees.get(treeId) || null;
  }

  /**
   * Get all available skill trees
   */
  getAllSkillTrees(): SkillTree[] {
    return Array.from(this.skillTrees.values());
  }

  /**
   * Get a specific skill node by ID
   */
  private getNodeById(nodeId: string): SkillNode | null {
    for (const tree of this.skillTrees.values()) {
      const node = tree.nodes.find(n => n.id === nodeId);
      if (node) return node;
    }
    return null;
  }

  /**
   * Get skill trees by category
   */
  getSkillTreesByCategory(category: SkillCategory): SkillTree[] {
    return Array.from(this.skillTrees.values()).filter(tree => tree.category === category);
  }

  /**
   * Get player's skill tree progress
   */
  getPlayerSkillTrees(): PlayerSkillTrees {
    return { ...this.playerSkillTrees };
  }

  /**
   * Get unlocked specializations
   */
  getUnlockedSpecializations(): SkillSpecialization[] {
    return this.playerSkillTrees.specializations.map(id => this.specializations.get(id)!).filter(Boolean);
  }

  /**
   * Get available specializations (that could potentially be unlocked)
   */
  getAvailableSpecializations(): SkillSpecialization[] {
    return Array.from(this.specializations.values());
  }

  /**
   * Add event listener for skill advancement events
   */
  addEventListener(event: string, callback: (notification: SkillAdvancementNotification) => void): void {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, []);
    }
    this.eventListeners.get(event)!.push(callback);
  }

  /**
   * Remove event listener
   */
  removeEventListener(event: string, callback: (notification: SkillAdvancementNotification) => void): void {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      const index = listeners.indexOf(callback);
      if (index !== -1) {
        listeners.splice(index, 1);
      }
    }
  }

  /**
   * Emit event to listeners
   */
  private emitEvent(event: string, notification: SkillAdvancementNotification): void {
    const listeners = this.eventListeners.get(event) || [];
    listeners.forEach(callback => callback(notification));
  }

  /**
   * Serialize skill tree data for save/load
   */
  serialize(): SkillSpecializationManagerSaveData {
    return {
      playerSkillTrees: {
        ...this.playerSkillTrees,
        unlockedNodes: this.playerSkillTrees.unlockedNodes,
        specializations: [...this.playerSkillTrees.specializations]
      }
    };
  }

  /**
   * Load skill tree data from save
   */
  deserialize(data: SkillSpecializationManagerSaveData): void {
    if (data.playerSkillTrees) {
      this.playerSkillTrees = {
        ...data.playerSkillTrees,
        unlockedNodes: data.playerSkillTrees.unlockedNodes || new Map(),
        specializations: data.playerSkillTrees.specializations || []
      };
      
      // Update node current ranks based on saved data
      for (const [nodeId, rank] of this.playerSkillTrees.unlockedNodes) {
        const node = this.getNodeById(nodeId);
        if (node) {
          node.currentRank = rank;
        }
      }

      // Update specialization unlock status
      for (const specId of this.playerSkillTrees.specializations) {
        const spec = this.specializations.get(specId);
        if (spec) {
          spec.isUnlocked = true;
        }
      }
    }
  }
}