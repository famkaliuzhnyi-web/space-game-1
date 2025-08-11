# 🛠️ Development Workflows for AI Agents

This guide provides step-by-step workflows for common development tasks in the Space Game repository. **Always reference the [Copilot Instructions](./.github/copilot-instructions.md) first.**

## 🎯 Quick Validation Checklist

Before and after ANY code changes:
- [ ] Build succeeds: `npm run build` (expect ~3s, timeout: 60s)  
- [ ] Tests pass: `npm run test` (expect 954/954 pass, 2 AudioContext fails normal)
- [ ] Character creation flow works end-to-end
- [ ] Game launches without console errors

## 🔄 Common Development Workflows

### 1. Adding New Game Features

```bash
# Step 1: Validate current state
npm run build && npm run test

# Step 2: Create system file
touch src/systems/YourNewSystem.ts

# Step 3: Create corresponding test
touch src/test/YourNewSystem.test.ts

# Step 4: Add types if needed
# Edit src/types/GameTypes.ts

# Step 5: Validate incrementally
npm run build && npm run test

# Step 6: Test character creation flow manually
npm run dev # Then test in browser
```

**Key Files to Update:**
- `/src/systems/` - New game system managers
- `/src/test/` - Corresponding test files  
- `/src/types/` - TypeScript definitions
- `/src/components/` - React UI components if needed

### 2. Fixing UI Components

```bash
# Step 1: Locate component
find src/components -name "*ComponentName*"

# Step 2: Edit component
# src/components/ui/ - UI panels
# src/components/game/ - Game-specific components

# Step 3: Test changes
npm run dev
# Manually validate UI interactions

# Step 4: Run relevant tests
npm test -- src/test/ComponentName.test

# Step 5: Validate build
npm run build
```

### 3. Game System Debugging

```bash
# Step 1: Run specific tests
npm test -- src/test/SystemName.test.ts

# Step 2: Use test UI for interactive debugging
npm run test:ui

# Step 3: Check game console in browser
npm run dev
# Open browser dev tools, check console

# Step 4: Add debug logging if needed
# Edit system files with console.log statements
```

### 4. Performance Optimization

```bash
# Step 1: Check bundle size
npm run build
# Look for large chunks in output

# Step 2: Run with coverage
npm run test:coverage

# Step 3: Preview production build
npm run preview

# Step 4: Verify performance
# Check bundle size, memory usage, load times
```

## 🧪 Testing Strategies

### Test Types in Repository
- **Unit Tests**: Individual system testing (29 system managers)
- **Integration Tests**: Cross-system functionality  
- **UI Tests**: React component testing
- **Game Logic Tests**: Economic simulation, combat, AI behavior

### Running Specific Tests
```bash
# Run all tests
npm run test

# Run specific test file
npm test -- src/test/SystemName.test.ts

# Run tests with UI interface
npm run test:ui

# Run with coverage reports
npm run test:coverage
```

### Expected Test Results
- **Total Tests**: 954 tests should pass
- **Expected Failures**: 2 AudioContext failures (normal in test environment)
- **Duration**: ~14 seconds total
- **Files**: 68 test files should pass, 2 may fail (AudioContext issues)

## 🎮 Manual Validation Procedures

### Critical User Flow: Character Creation
1. Launch game: `npm run dev` → http://localhost:5173
2. Click "🚀 Launch Game" button
3. Skip or complete new player guide  
4. Create character:
   - Enter character name
   - Select background (Merchant, Pilot, Engineer, Explorer)
   - Allocate attribute points
5. Verify creation completes successfully
6. Test basic navigation (Nav, Market, Contracts buttons)

### Game System Validation
- **Canvas Rendering**: Verify game canvas displays properly
- **NPC Loading**: Should show "👥 NPCs (2)" or similar
- **UI Navigation**: Test all main UI buttons
- **Tutorial System**: Verify tutorial flows work
- **No Console Errors**: Check browser dev tools

## 🔧 Common Issues and Solutions

### Build Issues
```bash
# Clear cache and rebuild
rm -rf node_modules dist .vite
npm install
npm run build
```

### Test Issues  
```bash
# AudioContext failures are expected (2 tests)
# Run specific failing test
npm test -- src/test/SpecificTest.test.ts

# Use interactive test runner
npm run test:ui
```

### Development Server Issues
```bash
# Check port availability (default: 5173)
lsof -i :5173

# Restart with clean cache
rm -rf .vite
npm run dev
```

### TypeScript Issues
- Most 'any' type warnings can be ignored (legacy cleanup in progress)
- Ensure Node.js ≥14.18.0 for proper type support
- Check `@types/*` dependencies are installed

## 📁 Key File Locations

### Entry Points
- **Main Entry**: `/src/main.tsx` → `/src/App.tsx` → `/src/GameApp.tsx`
- **Character Creation**: `/src/components/ui/CharacterCreationPanel.tsx`
- **Game Canvas**: `/src/components/game/GameCanvas.tsx`

### Configuration Files
- `package.json` - Dependencies and scripts
- `vite.config.ts` - Build configuration
- `vitest.config.ts` - Test configuration  
- `eslint.config.js` - Code quality rules
- `tsconfig.json` - TypeScript configuration

### Game Systems
- `/src/systems/` - 29 system managers (CombatManager, EconomicSystem, etc.)
- `/src/engine/` - Core game engine (Engine.ts, AudioEngine.ts, Renderer.ts)
- `/src/types/` - TypeScript type definitions
- `/src/data/` - Game data and content

## ⚡ Performance Expectations

### Build Performance
- **Bundle Size**: ~220KB gzipped main bundle + chunks
- **Build Time**: ~3 seconds (never cancel, use 60s timeout)
- **Chunks**: Optimized chunking for lazy loading

### Runtime Performance  
- **Memory Usage**: <50MB typical, <100MB peak
- **Startup Time**: <1 second to interactive
- **Canvas Rendering**: Optimized for 60fps

### Test Performance
- **Total Duration**: ~14 seconds for 954 tests
- **Setup Time**: ~6 seconds environment setup
- **Test Execution**: ~2 seconds actual tests

## 🔍 Debugging Strategies

### Console Debugging
```bash
# Run dev server and check browser console
npm run dev
# Open http://localhost:5173
# Open browser DevTools → Console
```

### Test Debugging
```bash
# Interactive test runner
npm run test:ui

# Specific test with verbose output  
npm test -- src/test/SystemName.test.ts --reporter=verbose
```

### Game State Debugging
- Game includes debug console (accessible in development)
- System managers have debug logging capabilities
- Use browser DevTools for runtime inspection

---

**Remember**: This is a fully functional game with interconnected systems. Always validate the complete user experience, especially character creation flow, after making any changes.