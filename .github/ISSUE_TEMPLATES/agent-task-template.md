# 🤖 Agent Development Task Template

Use this template for creating well-structured development tasks that AI agents can execute effectively.

## Task Structure

```markdown
# [Priority Level] [Feature/Bug] Brief Description

## 🎯 Objective
Clear, specific description of what needs to be accomplished.

## 📋 Requirements
- [ ] Specific requirement 1
- [ ] Specific requirement 2  
- [ ] Specific requirement 3

## 🧪 Acceptance Criteria
- [ ] Build succeeds: `npm run build`
- [ ] Tests pass: `npm run test` (expect 954/954, 2 AudioContext fails OK)
- [ ] Character creation flow works end-to-end
- [ ] [Specific functionality] works as expected
- [ ] No new console errors introduced

## 🔍 Implementation Approach

### Files to Modify
- `src/systems/SystemName.ts` - Main implementation
- `src/test/SystemName.test.ts` - Test coverage
- `src/types/GameTypes.ts` - Type definitions (if needed)

### Testing Strategy
1. Unit tests for core functionality
2. Integration tests for system interactions
3. Manual validation of user-facing changes

## 📝 Validation Steps
1. Run existing tests to ensure no regressions
2. Test specific functionality in development mode
3. Validate character creation flow still works
4. Check browser console for errors

## 🔗 Related Documentation
- [Copilot Instructions](../.github/copilot-instructions.md)
- [Development Workflows](../DEVELOPMENT_WORKFLOWS.md)
- [Troubleshooting Guide](../TROUBLESHOOTING.md)

## 💡 Additional Context
Any additional information, constraints, or considerations.
```

## Agent-Friendly Features

This template includes:
- ✅ **Clear Success Criteria** - Specific, measurable outcomes
- ✅ **Validation Steps** - Manual testing procedures
- ✅ **File Guidance** - Which files typically need changes
- ✅ **Testing Strategy** - How to validate changes
- ✅ **Cross-References** - Links to relevant documentation

## Priority Levels

- **🔴 HIGH** - Critical bugs, security issues, blocking problems
- **🟡 MEDIUM** - Feature improvements, performance optimizations  
- **🟢 LOW** - Nice-to-have features, code cleanup, documentation

## Common Task Categories

### 🎮 Game System Enhancements
- New gameplay mechanics
- AI behavior improvements
- Economic simulation tweaks
- Combat system updates

### 🖼️ UI/UX Improvements
- Interface updates
- User experience enhancements
- Accessibility improvements
- Mobile optimization

### 🔧 Technical Improvements
- Performance optimizations
- Code refactoring
- Type safety improvements
- Build system updates

### 🧪 Testing & Quality
- Test coverage improvements
- Bug fixes
- Code quality enhancements
- Documentation updates

---

**Remember**: Good tasks are specific, measurable, and include clear validation criteria. Always consider the impact on character creation flow!