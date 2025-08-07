/**
 * Tutorial system types for Space Game
 * Comprehensive tutorial system for guiding new players through game mechanics
 */

export interface TutorialStep {
  id: string;
  title: string;
  description: string;
  target?: string; // CSS selector for highlighting UI elements
  position?: 'top' | 'bottom' | 'left' | 'right';
  action?: 'click' | 'navigate' | 'wait' | 'input';
  actionData?: Record<string, unknown>;
  prerequisites?: string[]; // Required conditions to show this step
  optional?: boolean;
  skipable?: boolean;
  timeout?: number; // Auto-advance after X seconds
}

export interface TutorialFlow {
  id: string;
  name: string;
  description: string;
  category: TutorialCategory;
  priority: number; // Lower numbers = higher priority
  steps: TutorialStep[];
  unlockConditions?: string[]; // Conditions to unlock this tutorial
  rewards?: TutorialReward[];
}

export interface TutorialReward {
  type: 'credits' | 'experience' | 'achievement' | 'item';
  amount: number;
  description: string;
}

export type TutorialCategory = 
  | 'basics'
  | 'navigation'
  | 'trading'
  | 'character'
  | 'combat'
  | 'advanced'
  | 'investment'
  | 'storyline';

export interface TutorialState {
  currentFlow?: string;
  currentStep?: number;
  completedFlows: string[];
  completedSteps: string[];
  skippedFlows: string[];
  settings: TutorialSettings;
}

export interface TutorialSettings {
  enabled: boolean;
  showHints: boolean;
  autoAdvance: boolean;
  highlightElements: boolean;
  tooltipsEnabled: boolean;
}

export interface TutorialProgress {
  flowId: string;
  stepId: string;
  completed: boolean;
  timestamp: number;
  timeSpent: number;
}

export interface TutorialHint {
  id: string;
  text: string;
  target: string;
  condition: string; // When to show this hint
  priority: number;
  category: string;
}

export interface TutorialTooltip {
  element: string; // CSS selector
  title: string;
  content: string;
  position: 'top' | 'bottom' | 'left' | 'right';
  trigger: 'hover' | 'click' | 'focus';
}