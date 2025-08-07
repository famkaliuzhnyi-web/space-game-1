import { describe, it, expect, beforeEach, vi } from 'vitest';
import { TutorialManager } from '../systems/TutorialManager';
import { PlayerManager } from '../systems/PlayerManager';
import { CharacterManager } from '../systems/CharacterManager';

// Mock dependencies
const mockPlayerManager = {
  getCredits: vi.fn(() => 100000),
  addCredits: vi.fn(),
} as unknown as PlayerManager;

const mockCharacterManager = {
  awardExperience: vi.fn(() => true),
} as unknown as CharacterManager;

describe('TutorialManager', () => {
  let tutorialManager: TutorialManager;

  beforeEach(() => {
    vi.clearAllMocks();
    tutorialManager = new TutorialManager(mockPlayerManager, mockCharacterManager);
  });

  describe('Tutorial Flow Management', () => {
    it('should initialize with available tutorial flows', () => {
      const availableFlows = tutorialManager.getAvailableFlows();
      
      expect(availableFlows).toBeDefined();
      expect(availableFlows.length).toBeGreaterThan(0);
      expect(availableFlows[0].id).toBe('basics');
      expect(availableFlows[0].name).toBe('Welcome to Space');
      expect(availableFlows[0].category).toBe('basics');
      expect(availableFlows[0].steps.length).toBe(5);
    });

    it('should start a tutorial flow successfully', () => {
      const result = tutorialManager.startTutorialFlow('basics');
      
      expect(result).toBe(true);
      
      const tutorialState = tutorialManager.getTutorialState();
      expect(tutorialState.currentFlow).toBe('basics');
      expect(tutorialState.currentStep).toBe(0);
    });

    it('should not start non-existent tutorial flow', () => {
      const result = tutorialManager.startTutorialFlow('non-existent');
      
      expect(result).toBe(false);
      
      const tutorialState = tutorialManager.getTutorialState();
      expect(tutorialState.currentFlow).toBeUndefined();
    });

    it('should advance to next tutorial step', () => {
      tutorialManager.startTutorialFlow('basics');
      
      const result = tutorialManager.nextStep();
      expect(result).toBe(true);
      
      const tutorialState = tutorialManager.getTutorialState();
      expect(tutorialState.currentStep).toBe(1);
    });

    it('should complete tutorial flow when reaching end', () => {
      tutorialManager.startTutorialFlow('basics');
      
      // Advance through all steps
      let result = true;
      let stepCount = 0;
      while (result && stepCount < 10) { // Safety limit
        result = tutorialManager.nextStep();
        stepCount++;
      }
      
      const tutorialState = tutorialManager.getTutorialState();
      expect(tutorialState.currentFlow).toBeUndefined();
      expect(tutorialState.currentStep).toBeUndefined();
      expect(tutorialState.completedFlows).toContain('basics');
    });

    it('should skip tutorial flow', () => {
      tutorialManager.startTutorialFlow('basics');
      
      tutorialManager.skipTutorialFlow();
      
      const tutorialState = tutorialManager.getTutorialState();
      expect(tutorialState.currentFlow).toBeUndefined();
      expect(tutorialState.skippedFlows).toContain('basics');
    });
  });

  describe('Tutorial Steps', () => {
    it('should return current tutorial step', () => {
      tutorialManager.startTutorialFlow('basics');
      
      const currentStep = tutorialManager.getCurrentStep();
      expect(currentStep).toBeDefined();
      expect(currentStep?.id).toBe('welcome');
      expect(currentStep?.title).toBe('Welcome, Captain!');
    });

    it('should return null when no active tutorial', () => {
      const currentStep = tutorialManager.getCurrentStep();
      expect(currentStep).toBeNull();
    });
  });

  describe('Tutorial Rewards', () => {
    it('should grant credits reward on completion', () => {
      tutorialManager.startTutorialFlow('basics');
      
      // Complete the tutorial
      while (tutorialManager.nextStep()) {
        // Continue until complete
      }
      
      expect(mockPlayerManager.addCredits).toHaveBeenCalledWith(5000);
    });

    it('should grant experience reward on completion', () => {
      tutorialManager.startTutorialFlow('basics');
      
      // Complete the tutorial
      while (tutorialManager.nextStep()) {
        // Continue until complete
      }
      
      expect(mockCharacterManager.awardExperience).toHaveBeenCalledWith(
        100, 
        'Tutorial completion', 
        'social'
      );
    });
  });

  describe('Unlock Conditions', () => {
    it('should respect unlock conditions', () => {
      // Navigation tutorial requires basics completion
      const availableFlows = tutorialManager.getAvailableFlows();
      const navigationFlow = availableFlows.find(f => f.id === 'navigation');
      
      // Should not be available initially (basics not completed)
      expect(navigationFlow).toBeUndefined();
    });

    it('should unlock tutorials after completing prerequisites', () => {
      // Complete basics tutorial
      tutorialManager.startTutorialFlow('basics');
      while (tutorialManager.nextStep()) {
        // Continue until complete
      }
      
      // Now navigation should be available
      const availableFlows = tutorialManager.getAvailableFlows();
      const navigationFlow = availableFlows.find(f => f.id === 'navigation');
      
      expect(navigationFlow).toBeDefined();
      expect(navigationFlow?.name).toBe('Navigation Mastery');
    });
  });

  describe('Settings Management', () => {
    it('should initialize with default settings', () => {
      const tutorialState = tutorialManager.getTutorialState();
      
      expect(tutorialState.settings.enabled).toBe(true);
      expect(tutorialState.settings.showHints).toBe(true);
      expect(tutorialState.settings.tooltipsEnabled).toBe(true);
    });

    it('should update settings', () => {
      tutorialManager.updateSettings({
        enabled: false,
        showHints: false
      });
      
      const tutorialState = tutorialManager.getTutorialState();
      expect(tutorialState.settings.enabled).toBe(false);
      expect(tutorialState.settings.showHints).toBe(false);
      expect(tutorialState.settings.tooltipsEnabled).toBe(true); // Should remain unchanged
    });
  });

  describe('Tooltips', () => {
    it('should provide tooltips for UI elements', () => {
      const navigationTooltip = tutorialManager.getTooltip('button[data-panel="navigation"]');
      
      expect(navigationTooltip).toBeDefined();
      expect(navigationTooltip?.title).toBe('Navigation');
      expect(navigationTooltip?.content).toContain('galaxy map');
    });

    it('should return undefined for non-existent elements', () => {
      const tooltip = tutorialManager.getTooltip('non-existent-selector');
      expect(tooltip).toBeUndefined();
    });
  });

  describe('Serialization', () => {
    it('should serialize tutorial state', () => {
      tutorialManager.startTutorialFlow('basics');
      tutorialManager.nextStep();
      
      const serialized = tutorialManager.serialize();
      
      expect(serialized).toBeDefined();
      expect(serialized.tutorialState).toBeDefined();
      expect(serialized.tutorialState.currentFlow).toBe('basics');
      expect(serialized.tutorialState.currentStep).toBe(1);
    });

    it('should deserialize tutorial state', () => {
      const mockData = {
        tutorialState: {
          currentFlow: 'basics',
          currentStep: 2,
          completedFlows: ['basics'],
          completedSteps: ['welcome', 'interface_overview'],
          skippedFlows: [],
          settings: {
            enabled: false,
            showHints: true,
            autoAdvance: true,
            highlightElements: false,
            tooltipsEnabled: true
          }
        },
        progressHistory: []
      };
      
      tutorialManager.deserialize(mockData);
      
      const tutorialState = tutorialManager.getTutorialState();
      expect(tutorialState.currentFlow).toBe('basics');
      expect(tutorialState.currentStep).toBe(2);
      expect(tutorialState.completedFlows).toContain('basics');
      expect(tutorialState.settings.enabled).toBe(false);
    });
  });

  describe('Tutorial Categories', () => {
    it('should provide different tutorial categories', () => {
      // Complete basics to unlock other tutorials
      tutorialManager.startTutorialFlow('basics');
      while (tutorialManager.nextStep()) {
        // Continue until complete
      }
      
      const availableFlows = tutorialManager.getAvailableFlows();
      const categories = [...new Set(availableFlows.map(f => f.category))];
      
      expect(categories).toContain('navigation');
      // Only navigation should be available after completing basics
      // Other tutorials have higher credit requirements or need more unlocks
      expect(categories.length).toBeGreaterThanOrEqual(1);
    });

    it('should sort tutorials by priority', () => {
      const availableFlows = tutorialManager.getAvailableFlows();
      
      // Check that flows are sorted by priority (lower number = higher priority)
      for (let i = 0; i < availableFlows.length - 1; i++) {
        expect(availableFlows[i].priority).toBeLessThanOrEqual(availableFlows[i + 1].priority);
      }
    });
  });
});