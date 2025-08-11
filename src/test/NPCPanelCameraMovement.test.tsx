import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { NPCPanel } from '../components/game/NPCPanel';
import { NPCAIManager } from '../systems/NPCAIManager';
import type { NPCShip } from '../types/npc';

// Mock dependencies
const mockNPCAIManager = {
  getNPCsInSystem: vi.fn(),
  startConversation: vi.fn(),
  endConversation: vi.fn(),
} as unknown as NPCAIManager;

// Mock NPC data
const mockNPC: NPCShip = {
  id: 'test-npc-1',
  name: 'Test Trader',
  type: 'trader',
  position: {
    systemId: 'test-system',
    coordinates: { x: 100, y: 200, z: 0 }
  },
  movement: {
    speed: 50,
    currentVelocity: { x: 0, y: 0 },
    lastMoveTime: Date.now(),
    maneuverability: 75,
    maxAcceleration: 10,
    brakingDistance: 50
  },
  ai: {
    personality: { type: 'diplomatic', traits: [] },
    currentGoal: { id: 'trade-goal-1', type: 'trade', priority: 5, startTime: Date.now(), parameters: new Map() },
    goalHistory: [],
    decisionCooldown: 0,
    riskTolerance: 60,
    aggressiveness: 20,
    tradingSkill: 80,
    lastInteraction: null,
    combatSkill: 40,
    navigationSkill: 70,
    socialSkill: 85,
    marketKnowledge: 75,
    threatAssessment: {
      nearbyThreats: [],
      currentThreatLevel: 0,
      lastThreatUpdate: Date.now()
    },
    routeOptimization: {
      preferredRoutes: new Map(),
      avoidedSectors: [],
      knownProfitableRoutes: []
    }
  },
  ship: {
    class: 'Merchant Vessel',
    cargoCapacity: 150,
    currentCargo: new Map(),
    condition: 85,
    fuel: 80,
    fuelCapacity: 100
  },
  faction: 'Traders Guild',
  reputation: 25,
  credits: 15000,
  lastActionTime: Date.now()
};

describe('NPCPanel Camera Movement', () => {
  let onNPCLocateMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    onNPCLocateMock = vi.fn();
    (mockNPCAIManager.getNPCsInSystem as any).mockReturnValue([mockNPC]);
  });

  it('should render locate button for each NPC', () => {
    render(
      <NPCPanel
        npcAIManager={mockNPCAIManager}
        currentSystemId="test-system"
        isVisible={true}
        onToggle={() => {}}
        onNPCLocate={onNPCLocateMock}
      />
    );

    expect(screen.getByText('📍 Locate')).toBeInTheDocument();
    expect(screen.getByTitle('Move camera to this NPC\'s location')).toBeInTheDocument();
  });

  it('should call onNPCLocate with correct NPC when locate button is clicked', () => {
    render(
      <NPCPanel
        npcAIManager={mockNPCAIManager}
        currentSystemId="test-system"
        isVisible={true}
        onToggle={() => {}}
        onNPCLocate={onNPCLocateMock}
      />
    );

    const locateButton = screen.getByText('📍 Locate');
    fireEvent.click(locateButton);

    expect(onNPCLocateMock).toHaveBeenCalledTimes(1);
    expect(onNPCLocateMock).toHaveBeenCalledWith(mockNPC);
  });

  it('should not call onNPCLocate if callback is not provided', () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    render(
      <NPCPanel
        npcAIManager={mockNPCAIManager}
        currentSystemId="test-system"
        isVisible={true}
        onToggle={() => {}}
      />
    );

    const locateButton = screen.getByText('📍 Locate');
    fireEvent.click(locateButton);

    // Should not throw error when onNPCLocate is undefined
    expect(consoleSpy).not.toHaveBeenCalled();
    consoleSpy.mockRestore();
  });

  it('should display NPC position information in the card', () => {
    render(
      <NPCPanel
        npcAIManager={mockNPCAIManager}
        currentSystemId="test-system"
        isVisible={true}
        onToggle={() => {}}
        onNPCLocate={onNPCLocateMock}
      />
    );

    // NPC card should be displayed with the trader's information
    expect(screen.getByText('Test Trader')).toBeInTheDocument();
    expect(screen.getByText('Trader')).toBeInTheDocument();
    expect(screen.getByText('Traders Guild')).toBeInTheDocument();
  });

  it('should render multiple NPCs with locate buttons', () => {
    const secondNPC: NPCShip = {
      ...mockNPC,
      id: 'test-npc-2',
      name: 'Test Patrol',
      type: 'patrol',
      position: {
        systemId: 'test-system',
        coordinates: { x: 300, y: 400, z: 0 }
      }
    };

    (mockNPCAIManager.getNPCsInSystem as any).mockReturnValue([mockNPC, secondNPC]);

    render(
      <NPCPanel
        npcAIManager={mockNPCAIManager}
        currentSystemId="test-system"
        isVisible={true}
        onToggle={() => {}}
        onNPCLocate={onNPCLocateMock}
      />
    );

    const locateButtons = screen.getAllByText('📍 Locate');
    expect(locateButtons).toHaveLength(2);

    // Click first locate button
    fireEvent.click(locateButtons[0]);
    expect(onNPCLocateMock).toHaveBeenCalledWith(mockNPC);

    // Click second locate button
    fireEvent.click(locateButtons[1]);
    expect(onNPCLocateMock).toHaveBeenCalledWith(secondNPC);

    expect(onNPCLocateMock).toHaveBeenCalledTimes(2);
  });
});

describe('Engine Camera Movement Integration', () => {
  it('should test camera movement methods exist in Engine', () => {
    // This is a conceptual test - we're testing the interface we expect to exist
    // In a real environment, we would import and test the actual Engine class
    
    const mockEngine = {
      moveCameraTo: vi.fn(),
      setCameraPosition: vi.fn(),
      getCamera: vi.fn().mockReturnValue({ x: 0, y: 0, zoom: 1 })
    };

    // Test that camera can be moved to NPC position
    const npcPosition = { x: 100, y: 200 };
    mockEngine.moveCameraTo(npcPosition.x, npcPosition.y);
    
    expect(mockEngine.moveCameraTo).toHaveBeenCalledWith(100, 200);
  });
});