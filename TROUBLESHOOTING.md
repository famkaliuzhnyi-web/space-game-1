# 🚨 Agent Troubleshooting Guide

Quick reference for common issues AI agents encounter when working with the Space Game repository.

## ⚠️ Critical Timeouts

**NEVER cancel these operations** - use proper timeouts:

| Command | Expected Duration | Required Timeout | 
|---------|------------------|------------------|
| `npm install` | ~1 minute | 300+ seconds |
| `npm run build` | ~3 seconds | 60+ seconds |
| `npm run test` | ~14 seconds | 60+ seconds |
| `npm run dev` | ~195ms | 30+ seconds |

## 🔍 Common Error Scenarios

### 1. Build Failures

**Error**: TypeScript compilation errors
```bash
# Solution: Check for syntax errors, missing imports
npm run build 2>&1 | head -20  # Show first 20 errors
```

**Error**: Vite build timeouts
```bash
# Solution: Clear cache and rebuild
rm -rf node_modules dist .vite
npm install
npm run build
```

### 2. Test Failures

**Expected Failures** (Normal):
- `AudioContext || window.webkitAudioContext) is not a constructor` (2 tests)
- These occur in `src/App.test.tsx` and `src/test/ThreeRenderer.test.ts`

**Unexpected Failures**:
```bash
# Run specific test for debugging
npm test -- src/test/FailingTest.test.ts

# Use interactive test runner
npm run test:ui

# Check test with verbose output
npm test -- src/test/FailingTest.test.ts --reporter=verbose
```

### 3. Development Server Issues

**Error**: Port 5173 already in use
```bash
# Check what's using the port
lsof -i :5173
# Kill process or use different port
npm run dev -- --port 5174
```

**Error**: Canvas/WebGL initialization failed
- This usually happens in headless environments
- Game requires browser with Canvas support
- Not an issue for production builds

### 4. Character Creation Flow Broken

**Symptoms**: Game loads but character creation fails
**Critical Impact**: This breaks the main user onboarding experience

**Debugging Steps**:
```bash
# 1. Check console errors in browser
npm run dev
# Open http://localhost:5173
# Open DevTools → Console, look for errors

# 2. Test character creation components  
npm test -- src/test/CharacterCreationPanel.test

# 3. Verify game systems initialization
npm test -- src/test/GameEngine.test
```

## 🛠️ System-Specific Issues

### Game Engine Problems

**Error**: Engine initialization failures
```bash
# Check engine tests
npm test -- src/test/Engine.test.ts

# Verify Canvas/WebGL support
# (Only relevant in browser environment)
```

**Error**: Audio system failures (AudioContext)
- Expected in test environment
- Only affects testing, not production
- 2 failing tests are normal

### UI Component Issues

**Error**: React component rendering failures
```bash
# Check component tests
npm test -- src/test/ComponentName.test.tsx

# Verify React/DOM setup
npm test -- src/test/setup.ts
```

**Error**: Canvas not rendering
- Ensure browser supports HTML5 Canvas
- Check for ad blockers interfering
- Verify no console errors in browser

### Game System Issues

**Error**: NPC AI system failures
```bash
# Test NPC systems specifically
npm test -- src/test/NPCAIManager.test.ts

# Check for initialization order issues
```

**Error**: Economic system crashes
```bash
# Test economic simulation
npm test -- src/test/EconomicSystem.test.ts

# Verify market data integrity
```

## 📊 Expected vs Unexpected Behaviors

### Expected Behaviors ✅

| Scenario | Expected Result |
|----------|----------------|
| `npm run build` | Completes in ~3s, creates dist/ folder |
| `npm run test` | 954 tests pass, 2 AudioContext failures |
| `npm run dev` | Server starts on port 5173 |
| ESLint check | ~159 issues (mostly 'any' warnings) |
| Character creation | Completes successfully in browser |
| Game launch | No console errors, UI responsive |

### Unexpected Behaviors ❌

| Scenario | Problem Indicator |
|----------|------------------|
| Build > 60s | Something is hanging, check timeout |
| Tests < 900 passing | Real test failures need investigation |
| Dev server crash | Port conflicts or missing dependencies |
| Character creation fails | Critical user flow broken |
| Console errors on launch | Game initialization problems |

## 🎯 Validation Checklists

### Before Making Changes
- [ ] `npm run build` succeeds (~3s)
- [ ] `npm run test` shows expected results (954 pass, 2 fail)
- [ ] Character creation flow works in browser
- [ ] No unexpected console errors

### After Making Changes
- [ ] Build still succeeds with your changes
- [ ] No new test failures introduced
- [ ] Character creation still works
- [ ] UI changes work as expected
- [ ] No new console errors introduced

### Before Committing
- [ ] `npm run lint` shows expected warnings only
- [ ] All new code has appropriate tests
- [ ] Manual testing of affected systems completed
- [ ] Documentation updated if needed

## 🚨 Emergency Recovery

### If You Break the Build
```bash
# 1. Check what changed
git diff

# 2. Revert if necessary
git checkout -- path/to/problematic/file

# 3. Clear everything and start fresh
rm -rf node_modules dist .vite
npm install
npm run build
```

### If Tests Start Failing Unexpectedly
```bash
# 1. Run tests with verbose output
npm test -- --reporter=verbose

# 2. Check for environment issues
rm -rf node_modules
npm install
npm run test

# 3. Run specific failing tests
npm test -- src/test/FailingTest.test.ts
```

### If Character Creation Breaks
**This is critical - fix immediately!**
```bash
# 1. Test character creation component
npm test -- src/test/CharacterCreationPanel.test

# 2. Check game engine initialization
npm test -- src/test/GameEngine.test

# 3. Verify in browser manually
npm run dev
# Navigate to http://localhost:5173
# Test complete character creation flow
```

## 📝 Error Message Quick Reference

### Common ESLint Warnings (Can Ignore)
- `@typescript-eslint/no-explicit-any` - Legacy code cleanup in progress
- `@typescript-eslint/no-unused-vars` - May indicate dead code
- `@typescript-eslint/prefer-const` - Style issue, not breaking

### Critical Error Patterns (Must Fix)
- `TypeError: Cannot read property` - Runtime errors
- `Module not found` - Import/dependency issues  
- `Unexpected token` - Syntax errors
- `Canvas element not available` - Game initialization failures

### Test Environment Warnings (Expected)
- `AudioContext is not a constructor` - Normal in jsdom environment
- `Warning: A suspended resource` - React testing library warnings
- Canvas/WebGL warnings - Normal in headless test environment

## 🔗 Quick Reference Links

- **[Copilot Instructions](./.github/copilot-instructions.md)** - Complete agent guide
- **[Development Workflows](./DEVELOPMENT_WORKFLOWS.md)** - Step-by-step procedures
- **[Repository Structure](./README.md#-technical-details)** - File organization
- **[Issue Templates](./.github/ISSUE_TEMPLATES/README.md)** - Common development tasks

---

**Remember**: Most issues stem from not following the proper timeout values or not understanding which failures are expected vs unexpected. Always reference the copilot instructions first.