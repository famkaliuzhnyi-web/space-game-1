# Task Templates for GitHub Agents

## Quick Reference

Use these templates when creating issues or documenting work on the Space Game project. Copy the appropriate template and fill in the details.

## Implementation Task Template

```markdown
# [Task Title]: [Brief Description]

## Overview
**Phase:** [Phase Number - e.g., Phase 1]
**Component:** [System/Component Name - e.g., Core Engine, UI Components]
**Size:** [Small/Medium/Large]
**Priority:** [High/Medium/Low]
**Estimated Duration:** [X days/weeks]

## Context
[Brief description of why this task is needed and how it fits into the overall project]

## Requirements
### Functional Requirements
- [ ] [Specific functional requirement 1]
- [ ] [Specific functional requirement 2]
- [ ] [Specific functional requirement 3]

### Non-Functional Requirements
- [ ] [Performance requirement]
- [ ] [Accessibility requirement]
- [ ] [Mobile compatibility requirement]
- [ ] [Browser compatibility requirement]

### Technical Requirements
- [ ] [Technical constraint or requirement 1]
- [ ] [Technical constraint or requirement 2]
- [ ] [Integration requirement]

## Success Criteria
- [ ] [Measurable success criterion 1]
- [ ] [Measurable success criterion 2]
- [ ] [Testing requirement]
- [ ] [Documentation requirement]

## Dependencies
**Blocked by:**
- [ ] [Task/feature that must be completed first]
- [ ] [Another dependency]

**Blocks:**
- [ ] [Task/feature that depends on this work]
- [ ] [Another dependent task]

## Implementation Notes
### Technical Approach
[Describe the recommended technical approach, architectural decisions, or implementation strategy]

### Code Location
**Primary Files:**
- `src/[component]/[filename].ts`
- `src/[component]/[filename].tsx`

**Test Files:**
- `src/[component]/__tests__/[filename].test.ts`

**Related Documentation:**
- [Link to relevant design documentation]
- [Link to API documentation]

### Design Considerations
[Any specific design patterns, performance considerations, or architectural notes]

## Testing Requirements
### Unit Tests
- [ ] Test [specific functionality 1]
- [ ] Test [specific functionality 2]
- [ ] Test error handling scenarios
- [ ] Test edge cases

### Integration Tests
- [ ] Test integration with [related system]
- [ ] Test [end-to-end scenario]

### Manual Testing
- [ ] Test on desktop browsers
- [ ] Test on mobile devices
- [ ] Test accessibility features
- [ ] Test performance under load

## Documentation Updates Required
- [ ] Update API documentation
- [ ] Update user documentation
- [ ] Update code comments
- [ ] Update README if needed
- [ ] Update progress tracker

## Definition of Done
- [ ] All requirements implemented and tested
- [ ] Code reviewed and approved
- [ ] All tests passing
- [ ] Documentation updated
- [ ] Performance benchmarks met
- [ ] Mobile compatibility verified
- [ ] Accessibility requirements met
- [ ] Deployed to staging environment

## Notes
[Any additional notes, considerations, or context]
```

## Bug Fix Task Template

```markdown
# [Bug]: [Brief Description of Issue]

## Overview
**Priority:** [Critical/High/Medium/Low]
**Severity:** [Critical/High/Medium/Low]
**Component:** [Affected system/component]
**Environment:** [Where the bug occurs - dev/staging/prod]
**Assignee:** [If known]

## Description
[Clear description of the bug and its impact]

## Reproduction Steps
1. [Step 1]
2. [Step 2]
3. [Step 3]
4. [Observe the issue]

## Expected Behavior
[What should happen instead]

## Actual Behavior
[What actually happens]

## Environment Details
- **Browser:** [Browser and version]
- **Device:** [Desktop/Mobile/Tablet]
- **Screen Size:** [If relevant]
- **Operating System:** [If relevant]

## Impact Assessment
**Users Affected:** [Number or percentage of users]
**Business Impact:** [How this affects the game experience]
**Workaround Available:** [Yes/No - describe if yes]

## Root Cause Analysis
[Fill in after investigation]
**Likely Cause:** [Hypothesis about what's causing the issue]
**Investigation Notes:** [Notes from debugging process]

## Solution Approach
[Fill in during implementation]
**Proposed Fix:** [Description of how to fix the issue]
**Alternative Solutions:** [Other approaches considered]
**Risk Assessment:** [Risks of the proposed fix]

## Testing Requirements
- [ ] Verify fix resolves the reported issue
- [ ] Test regression scenarios
- [ ] Test related functionality
- [ ] Test on different browsers/devices
- [ ] Verify performance impact

## Files to Change
[List of files that need modification]
- `[filename]` - [reason for change]
- `[filename]` - [reason for change]

## Definition of Done
- [ ] Issue reproduced and understood
- [ ] Root cause identified
- [ ] Fix implemented and tested
- [ ] Regression testing completed
- [ ] Code reviewed and approved
- [ ] Fix deployed and verified
- [ ] Issue closed and documented

## Related Issues
[Links to related issues or tasks]
```

## Research/Investigation Task Template

```markdown
# [Research]: [Topic/Question to Investigate]

## Overview
**Purpose:** [Why this research is needed]
**Timeline:** [When results are needed]
**Effort Level:** [Small/Medium/Large investigation]

## Research Questions
1. [Primary question to answer]
2. [Secondary question]
3. [Additional questions]

## Scope
**In Scope:**
- [What should be investigated]
- [What aspects to consider]

**Out of Scope:**
- [What should not be covered]
- [Boundaries of the investigation]

## Research Methods
- [ ] Literature review (documentation, articles, etc.)
- [ ] Code analysis and experimentation
- [ ] Performance testing
- [ ] User research/feedback analysis
- [ ] Competitive analysis
- [ ] Technical prototyping

## Expected Deliverables
- [ ] Research summary document
- [ ] Recommendations and next steps
- [ ] Code examples or prototypes (if applicable)
- [ ] Performance benchmarks (if applicable)

## Success Criteria
- [ ] All research questions answered
- [ ] Clear recommendations provided
- [ ] Actionable next steps identified
- [ ] Findings documented and shared

## Timeline
- **Start Date:** [Date]
- **Key Milestones:** [Important interim deadlines]
- **Completion Date:** [When results are needed]

## Resources Needed
- [Access to specific tools or systems]
- [Time allocation]
- [Collaboration with specific team members]

## Output Template
[Structure for the final research report]
```

## Documentation Task Template

```markdown
# [Documentation]: [What needs to be documented]

## Overview
**Type:** [API docs, user guide, technical specs, etc.]
**Audience:** [Who will use this documentation]
**Priority:** [High/Medium/Low]

## Scope
**Content to Cover:**
- [ ] [Specific topic 1]
- [ ] [Specific topic 2]
- [ ] [Specific topic 3]

**Documentation Goals:**
- [ ] [Goal 1 - e.g., help new developers get started]
- [ ] [Goal 2 - e.g., reduce support questions]

## Content Requirements
### Structure
[Outline of the documentation structure]

### Detail Level
[How deep to go - overview, detailed, comprehensive]

### Examples and Code Samples
- [ ] [Type of example needed]
- [ ] [Code sample requirements]

### Visual Elements
- [ ] Screenshots needed
- [ ] Diagrams required
- [ ] Code flow charts

## Target Format
- [ ] Markdown files
- [ ] Interactive documentation
- [ ] Video tutorials
- [ ] Code comments
- [ ] README updates

## Review Requirements
- [ ] Technical accuracy review
- [ ] Content review for clarity
- [ ] User testing of documentation
- [ ] Accessibility review

## Success Criteria
- [ ] Content is accurate and up-to-date
- [ ] Target audience can successfully use the documentation
- [ ] Documentation is discoverable and well-organized
- [ ] Examples work as expected
- [ ] Feedback mechanisms in place

## Maintenance Plan
[How this documentation will be kept up-to-date]
```

## Usage Guidelines

### When to Use Each Template
- **Implementation Task:** For new features, components, or system implementations
- **Bug Fix:** For addressing defects or issues in existing code
- **Research/Investigation:** For exploring technical options or understanding problems
- **Documentation:** For creating or updating project documentation

### Customizing Templates
- Remove sections that don't apply to your specific task
- Add project-specific sections as needed
- Adapt the language to match your team's style
- Include links to relevant project documentation

### Best Practices
1. Fill out templates completely before starting work
2. Update progress regularly in the task description
3. Use checklists to track completion
4. Link related tasks and dependencies
5. Document decisions and rationale
6. Include relevant screenshots or code examples

---

*These templates should be adapted based on team needs and project evolution. Keep them practical and focused on delivering value.*