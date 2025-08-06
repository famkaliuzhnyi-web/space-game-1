# GitHub Agent Instructions

## Overview

This document provides specific instructions for GitHub agents working on the Space Logistics RPG implementation. It complements the main execution plan with detailed guidance on task execution, code standards, and workflow procedures.

## Quick Start Guide

### Before Starting Any Task
1. **Read the relevant documentation:**
   - [Game Design Document](./docs/game-design-document.md)
   - [Execution Plan](./EXECUTION_PLAN.md)
   - Specific system documentation in `/docs/`

2. **Understand the context:**
   - Check dependencies and prerequisite tasks
   - Review existing codebase patterns
   - Identify affected systems and components

3. **Set up development environment:**
   ```bash
   npm install
   npm run dev  # Start development server
   npm run lint  # Check code standards
   npm run build  # Verify build works
   ```

## Development Workflow

### Task Assignment Process
1. **Task Selection:** Choose tasks marked as "Ready" in execution plan
2. **Dependency Check:** Verify all prerequisite tasks are completed
3. **Scope Definition:** Understand exact requirements and success criteria
4. **Time Estimation:** Provide realistic timeline for task completion

### Implementation Process
1. **Create feature branch:** `feature/[task-name]` or `fix/[bug-description]`
2. **Implement incrementally:** Small, focused commits
3. **Test continuously:** Unit tests and manual testing
4. **Document changes:** Update relevant documentation
5. **Create pull request:** With detailed description and testing notes

## Technical Guidelines

### Project Structure
```
/src/
  /components/     # Reusable UI components
  /systems/        # Game systems (economy, ships, etc.)
  /engine/         # Core game engine components
  /utils/          # Shared utilities and helpers
  /types/          # TypeScript type definitions
  /hooks/          # Custom React hooks
  /constants/      # Game constants and configuration
  /assets/         # Images, sounds, and static assets
```

### Code Standards

#### TypeScript Guidelines
```typescript
// Use strict typing
interface GameState {
  player: Player;
  sectors: Sector[];
  currentTime: number;
}

// Prefer const assertions for constants
const SHIP_CLASSES = ['courier', 'transport', 'heavy-freight'] as const;
type ShipClass = typeof SHIP_CLASSES[number];

// Use proper error handling
function loadGame(saveId: string): Result<GameState, Error> {
  try {
    // Implementation
  } catch (error) {
    return { success: false, error };
  }
}
```

#### React Component Guidelines
```typescript
// Use functional components with hooks
interface ShipDisplayProps {
  ship: Ship;
  onSelect?: (ship: Ship) => void;
}

const ShipDisplay: React.FC<ShipDisplayProps> = ({ ship, onSelect }) => {
  const handleClick = useCallback(() => {
    onSelect?.(ship);
  }, [ship, onSelect]);

  return (
    <div className="ship-display" onClick={handleClick}>
      {/* Component content */}
    </div>
  );
};
```

#### Game System Guidelines
```typescript
// Create modular, testable systems
class EconomicSystem {
  private commodities: Map<string, Commodity>;
  private priceHistory: Map<string, PricePoint[]>;

  calculatePrice(commodityId: string, stationId: string): number {
    // Implementation with clear business logic
  }

  updateMarketCycles(deltaTime: number): void {
    // Time-based market updates
  }
}
```

### Testing Standards

#### Unit Tests
```typescript
// Test business logic thoroughly
describe('EconomicSystem', () => {
  let economicSystem: EconomicSystem;

  beforeEach(() => {
    economicSystem = new EconomicSystem();
  });

  it('should calculate prices based on supply and demand', () => {
    // Arrange
    const commodity = createTestCommodity();
    const station = createTestStation();

    // Act
    const price = economicSystem.calculatePrice(commodity.id, station.id);

    // Assert
    expect(price).toBeGreaterThan(0);
    expect(price).toBeLessThan(1000);
  });
});
```

#### Integration Tests
```typescript
// Test system interactions
describe('Trading Integration', () => {
  it('should complete full trade cycle', async () => {
    // Test loading cargo -> traveling -> delivering -> payment
  });
});
```

## System-Specific Guidelines

### Game Engine Components
- **Performance:** Maintain 60fps target
- **Memory:** Efficient object pooling for frequently created objects
- **State:** Immutable state updates with proper reconciliation
- **Input:** Support keyboard, mouse, and touch events

### UI Components
- **Responsive:** Mobile-first design approach
- **Accessibility:** ARIA labels and keyboard navigation
- **Performance:** Virtual scrolling for large lists
- **State:** Proper form state management

### Economic Systems
- **Precision:** Use appropriate number precision for calculations
- **Performance:** Efficient algorithms for market simulations
- **Balance:** Ensure economic balance through testing
- **Realism:** Follow documented economic principles

### Ship Systems
- **Modularity:** Clean separation between ship types and equipment
- **Performance:** Efficient collision detection and movement
- **Persistence:** Proper serialization for save systems
- **Validation:** Input validation for ship configurations

## Common Implementation Patterns

### State Management
```typescript
// Use React Context for global game state
const GameContext = createContext<GameState | null>(null);

// Custom hooks for specific state slices
const usePlayer = () => {
  const context = useContext(GameContext);
  return context?.player;
};
```

### Game Loop Integration
```typescript
// Systems that need game loop updates
interface GameSystem {
  update(deltaTime: number): void;
  render?(context: CanvasRenderingContext2D): void;
}

// Register systems with the game loop
const gameLoop = new GameLoop();
gameLoop.addSystem(new EconomicSystem());
gameLoop.addSystem(new ShipMovementSystem());
```

### Event Handling
```typescript
// Use event emitter pattern for game events
interface GameEvents {
  'ship.docked': { ship: Ship; station: Station };
  'cargo.delivered': { cargo: Cargo; payment: number };
  'faction.reputation.changed': { faction: string; change: number };
}

const gameEvents = new TypedEventEmitter<GameEvents>();
```

## Quality Assurance

### Code Review Checklist
- [ ] Follows TypeScript/React best practices
- [ ] Includes appropriate tests
- [ ] Performance considerations addressed
- [ ] Error handling implemented
- [ ] Documentation updated
- [ ] Mobile compatibility verified
- [ ] Accessibility requirements met

### Testing Checklist
- [ ] Unit tests for business logic
- [ ] Integration tests for system interactions
- [ ] Manual testing on different screen sizes
- [ ] Performance testing with realistic data
- [ ] Error case testing

### Documentation Requirements
- [ ] Code comments for complex logic
- [ ] README updates for new features
- [ ] API documentation for public interfaces
- [ ] Design decision documentation

## Common Issues and Solutions

### Performance Issues
- **Problem:** Slow rendering on mobile
- **Solution:** Implement object pooling and canvas optimization
- **Prevention:** Regular performance testing during development

### State Management Issues
- **Problem:** Component re-rendering performance
- **Solution:** Use React.memo and useMemo appropriately
- **Prevention:** Profile component render cycles

### Mobile Compatibility Issues
- **Problem:** Touch events not working correctly
- **Solution:** Use unified input handling with proper event prevention
- **Prevention:** Test on actual mobile devices regularly

## Resources and References

### Documentation
- [Game Design Document](./docs/game-design-document.md) - Core game vision
- [Game Loop Documentation](./docs/game-loop.md) - Gameplay mechanics
- [Economic Systems](./docs/economy/README.md) - Economic simulation details

### Technical References
- [React Documentation](https://react.dev/) - React best practices
- [TypeScript Handbook](https://www.typescriptlang.org/docs/) - TypeScript guide
- [Canvas API](https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API) - 2D rendering

### Tools and Utilities
- ESLint configuration for code quality
- Prettier for code formatting
- Jest for testing framework
- Vite for build and development

## Communication Guidelines

### Progress Reporting
- Daily updates on task progress
- Immediate notification of blockers
- Weekly summary of completed work
- Request for review when ready

### Issue Reporting
- Clear reproduction steps
- Expected vs actual behavior
- Environment information
- Relevant code snippets or screenshots

### Knowledge Sharing
- Document architectural decisions
- Share useful patterns and solutions
- Collaborate on complex problems
- Mentor newer team members

---

*This guide should be updated as the project evolves and new patterns emerge. Keep it practical and focused on helping agents deliver quality code efficiently.*