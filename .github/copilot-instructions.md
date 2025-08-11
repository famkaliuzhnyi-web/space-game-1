# Space Game - Advanced 2D Space Trading RPG
Space Game is a fully functional space trading RPG built with React 18, TypeScript, and Vite. It features complex game systems including character progression, combat, trading economics, faction politics, and a comprehensive quest system.

**Always reference these instructions first and fallback to search or bash commands only when you encounter unexpected information that does not match the info here.**

## 📚 Additional Documentation Resources

**For comprehensive workflows and troubleshooting:**
- **[Development Workflows](../DEVELOPMENT_WORKFLOWS.md)** - Step-by-step procedures for common tasks
- **[Troubleshooting Guide](../TROUBLESHOOTING.md)** - Quick solutions for common issues  
- **[Repository README](../README.md)** - Project overview and architecture
- **[Issue Templates](./ISSUE_TEMPLATES/README.md)** - Structured development task templates

## Working Effectively

### Bootstrap, Build, and Test the Repository
```bash
# Install dependencies - takes ~1 minute
npm install

# Build for production - takes ~3.12 seconds. NEVER CANCEL. Set timeout to 60+ seconds.
npm run build

# Run comprehensive test suite - takes ~14.29 seconds. NEVER CANCEL. Set timeout to 60+ seconds.
npm run test
# Expected: 713/713 tests pass, 2 AudioContext failures in test environment are normal

# Run development server - starts in ~195ms
npm run dev
# Opens on http://localhost:5173 with hot module replacement
```

### Code Quality and Validation
```bash
# Run ESLint - takes ~few seconds
npm run lint
# Expected: ~159 issues (3 errors, 156 warnings) - mostly TypeScript 'any' warnings, not blocking

# Run tests with UI - for interactive test debugging
npm run test:ui

# Run tests with coverage reports
npm run test:coverage

# Preview production build locally
npm run preview
```

## Manual Validation Requirements

**CRITICAL**: Always run through complete user scenarios after making changes. Simply starting/stopping the application is NOT sufficient.

### Essential Validation Scenarios
1. **Character Creation Flow**:
   - Launch game with "🚀 Launch Game" button
   - Skip or complete new player guide
   - Create character: enter name, select background, allocate attributes
   - Verify character creation completes successfully

2. **Basic Game Navigation**:
   - Test main UI navigation buttons (Nav, Market, Contracts, etc.)
   - Verify game canvas renders properly
   - Check that NPCs load (should show "👥 NPCs (2)" or similar)
   - Test tutorial system functionality

3. **Core Game Systems**:
   - Trading interface and market functionality
   - Character progression and skill systems
   - Quest system and faction interactions
   - Combat and security systems (if modifying related code)

**Always validate that your changes don't break the character creation flow - this is the critical user onboarding experience.**

## System Requirements and Dependencies

### Essential Requirements
- **Node.js**: >=14.18.0 (specified in package.json engines)
- **Modern Browser**: Chrome, Firefox, Safari, Edge with Canvas and WebGL support
- **Memory**: Game uses ~50MB for full experience
- **No additional SDK installations required** - all dependencies via npm

### Key Technologies
```json
{
  "frontend": "React 18 + TypeScript + Vite 6",
  "testing": "Vitest + Testing Library + jsdom", 
  "graphics": "HTML5 Canvas + Three.js",
  "state": "Custom Game Engine with Object Pooling",
  "build": "Vite + TypeScript compilation"
}
```

## Timeout Values and Timing Expectations

**CRITICAL**: Set appropriate timeouts for all operations. Do not use default timeouts that may cause premature cancellation.

### Command Timing Guide
- `npm install` - **1 minute. Set timeout: 300+ seconds**
- `npm run build` - **3.12 seconds. NEVER CANCEL. Set timeout: 60+ seconds**  
- `npm run test` - **14.29 seconds. NEVER CANCEL. Set timeout: 60+ seconds**
- `npm run dev` - **195ms startup. Set timeout: 30+ seconds**
- `npm run lint` - **Few seconds. Set timeout: 30+ seconds**

**WARNING**: Build and test processes should NEVER be cancelled. Even if they appear to hang, wait at least 60 seconds before considering alternatives.

## Repository Structure and Navigation

### Source Code Organization
```
/src/
├── components/          # React UI components
│   ├── game/           # Game-specific components (GameCanvas, NPCPanel)
│   ├── ui/             # UI panels (Market, Character, Combat panels)
│   └── debug/          # Debug utilities and console
├── systems/            # Game logic managers (29 system managers)
│   ├── CombatManager.ts
│   ├── EconomicSystem.ts
│   ├── NPCAIManager.ts
│   └── ...            # Character, Quest, Faction, Investment systems
├── engine/            # Core game engine
│   ├── Engine.ts      # Main game engine
│   ├── AudioEngine.ts # 3D audio system
│   └── Renderer.ts    # Canvas rendering
├── types/             # TypeScript type definitions
├── data/              # Game data and content
└── test/              # Test files (39 test files)
```

### Important Files and Locations
- **Game Entry**: `/src/main.tsx` -> `/src/App.tsx` -> `/src/GameApp.tsx`
- **Character Creation**: `/src/components/ui/CharacterCreationPanel.tsx`
- **Game Canvas**: `/src/components/game/GameCanvas.tsx`
- **Test Setup**: `/src/test/setup.ts`
- **Build Config**: `vite.config.ts`, `vitest.config.ts`
- **Type Configs**: `tsconfig.json`, `tsconfig.app.json`

### Configuration Files
- `package.json` - Dependencies and scripts
- `eslint.config.js` - Code quality rules (allows 'any' warnings in legacy code)
- `vite.config.ts` - Build configuration with chunk optimization
- `vitest.config.ts` - Test configuration with jsdom environment

## Validation and CI Requirements

### Pre-commit Validation
Always run these commands before committing changes:
```bash
npm run lint    # Fix code style issues
npm run test    # Ensure tests pass
npm run build   # Verify build succeeds
```

### Manual Testing Checklist
After making changes, ALWAYS:
1. ✅ Test character creation flow end-to-end
2. ✅ Verify game launches without console errors
3. ✅ Check that UI interactions work properly
4. ✅ Test any specific systems you modified
5. ✅ Take screenshots of UI changes for verification

## Troubleshooting

### Common Issues and Solutions

**Build Errors:**
```bash
# Clear cache and rebuild
rm -rf node_modules dist .vite
npm install
npm run build
```

**Test Failures:**
- AudioContext failures in test environment are expected (2 failing tests normal)
- Run specific test: `npm test -- src/test/SystemName.test.ts`
- Use test UI for debugging: `npm run test:ui`

**Development Server Issues:**
- Ensure port 5173 is available
- Check browser console for WebGL/Canvas errors
- Verify no ad blockers interfere with localhost

**TypeScript Issues:**
- Most 'any' type warnings can be ignored (legacy code cleanup in progress)
- Ensure Node.js >=14.18.0 for proper type support
- Check that all `@types/*` dependencies are installed

### Performance Expectations
- **Bundle Size**: ~220KB gzipped main bundle + chunked modules
- **Memory Usage**: <50MB typical, <100MB peak
- **Startup Time**: <1 second to interactive
- **Test Performance**: 713 tests in ~14 seconds

## Common Development Tasks

### Adding New Game Systems
1. Create system file in `/src/systems/`
2. Add corresponding test file in `/src/test/`
3. Update type definitions in `/src/types/`
4. Always test with full character creation flow

### Modifying UI Components
1. Components are in `/src/components/ui/` or `/src/components/game/`
2. Test changes with actual game interactions
3. Verify responsive behavior across screen sizes
4. Check console for React warnings

### Working with Game Data
- Game content in `/src/data/` directory
- Faction data, equipment, quests, and economic data
- Always validate JSON structure and type compatibility

**Remember: This is a fully functional game, not a template. All systems are interconnected and changes may have cascading effects. Always validate the complete user experience.**