import { lazy } from 'react';

// Lazy-loaded components for better performance
export const CombatPanel = lazy(() => import('./CombatPanel').then(module => ({ default: module.CombatPanel })));
export const HackingPanel = lazy(() => import('./HackingPanel').then(module => ({ default: module.HackingPanel })));
export const InvestmentPanel = lazy(() => import('./InvestmentPanel').then(module => ({ default: module.InvestmentPanel })));
export const FleetManagementPanel = lazy(() => import('./FleetManagementPanel'));
export const AchievementsPanel = lazy(() => import('./AchievementsPanel'));
export const SecurityPanel = lazy(() => import('./SecurityPanel').then(module => ({ default: module.SecurityPanel })));
export const QuestPanel = lazy(() => import('./QuestPanel').then(module => ({ default: module.QuestPanel })));
export const CharacterCreationPanel = lazy(() => import('./CharacterCreationPanel').then(module => ({ default: module.CharacterCreationPanel })));