# 🚀 Quick Reference Card for AI Agents

## Essential Commands
```bash
npm install           # ~1 min (timeout: 300s)
npm run build        # ~3s (timeout: 60s) - NEVER cancel
npm run test         # ~14s (timeout: 60s) - NEVER cancel  
npm run dev          # ~195ms (timeout: 30s)
npm run lint         # ~few seconds (timeout: 30s)
```

## Expected Results
- **Build**: ✅ Success in ~3s, creates dist/ folder
- **Tests**: ✅ 954/954 pass, 2 AudioContext failures (normal)
- **Lint**: ⚠️ ~159 issues (mostly 'any' warnings, OK)
- **Dev Server**: ✅ Starts on http://localhost:5173

## Critical Validation
**ALWAYS test after changes:**
1. Character creation flow (🚀 Launch Game → Create Character)
2. Game launches without console errors
3. UI navigation works (Nav, Market, Contracts buttons)

## Key File Locations
```
/src/systems/        # 29 game system managers
/src/components/ui/  # React UI panels  
/src/test/          # 68+ test files
/src/types/         # TypeScript definitions
.github/copilot-instructions.md  # Complete agent guide
```

## Documentation Hierarchy
1. **[Copilot Instructions](./.github/copilot-instructions.md)** - START HERE
2. **[Development Workflows](./DEVELOPMENT_WORKFLOWS.md)** - How-to procedures
3. **[Troubleshooting](./TROUBLESHOOTING.md)** - Problem solutions
4. **[README](./README.md)** - Project overview

## Emergency Recovery
```bash
# If build breaks:
rm -rf node_modules dist .vite && npm install && npm run build

# If tests fail unexpectedly:
npm test -- --reporter=verbose

# If character creation breaks (CRITICAL):
npm test -- src/test/CharacterCreationPanel.test
npm run dev  # Test manually in browser
```

## Expected vs Unexpected

### ✅ Expected (Don't Fix)
- 2 AudioContext test failures
- ~159 ESLint warnings (mostly 'any' types)
- Canvas warnings in test environment

### ❌ Unexpected (Must Fix)
- Build taking >60 seconds
- <950 tests passing  
- Character creation failing
- New console errors on game launch

---
**Remember**: This is a fully functional game. Always validate the complete user experience!