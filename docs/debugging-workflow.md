# Debugging Workflow - Test-Driven Development (TDD) Approach

## Overview

This document outlines the systematic debugging workflow used in the GodWear project to resolve TypeScript errors and maintain code quality. This approach follows Test-Driven Development (TDD) principles adapted for error resolution.

## Core Principles

### 1. **Test-First Approach**
- Always run tests before making any changes
- Understand the current state and specific errors
- Never assume what needs to be fixed without evidence

### 2. **Incremental Changes**
- Make small, focused changes per iteration
- Fix one category of errors at a time
- Verify each change before proceeding

### 3. **Continuous Validation**
- Run tests after each change
- Ensure fixes don't introduce new errors
- Maintain functionality while fixing issues

### 4. **Clean Commits**
- Commit only when a task is fully complete
- Write comprehensive commit messages
- Document the impact and benefits of changes

## The 5-Step Debugging Workflow

### Step 1: **Initial Test Run**
```bash
npm test
```

**Purpose:** Establish baseline and identify specific errors
- Count total errors: `npm run type-check 2>&1 | grep -c "error TS"`
- Identify error categories: `npm run type-check 2>&1 | grep "TS2339\|TS4111\|TS2375"`
- Document current state for comparison

### Step 2: **Analyze and Plan**
- Group errors by type and root cause
- Prioritize fixes based on impact and dependencies
- Plan incremental approach for each error category

### Step 3: **Implement Fixes**
- Make targeted changes to address specific error types
- Follow AI-First principles where applicable:
  - File-local schemas and types
  - Complete autonomy per file
  - Eliminate shared dependencies where possible

### Step 4: **Validate Changes**
```bash
npm test
```

**Validation Checks:**
- Verify target errors are resolved
- Ensure no new errors introduced
- Check error count reduction
- Test specific functionality if needed

### Step 5: **Iterate or Commit**
- **If errors remain:** Return to Step 3 with refined approach
- **If task complete:** Proceed to git commit with detailed message

## Task-Specific Workflow

### For Each Task:

1. **Start with Test Run**
   ```bash
   npm test
   ```

2. **Identify Task-Specific Errors**
   ```bash
   # Example for TS2339 errors
   npm run type-check 2>&1 | grep "TS2339"
   ```

3. **Apply Fixes Incrementally**
   - Fix one file or error type at a time
   - Run tests after each significant change

4. **Verify Task Completion**
   ```bash
   # Check if specific error type is eliminated
   npm run type-check 2>&1 | grep -c "TS2339"
   ```

5. **Git Commit When Complete**
   ```bash
   git add .
   git commit -m "feat: descriptive commit message with impact"
   ```

## Error Categories and Approaches

### TS4111 - Index Signature Access
**Pattern:** `Property 'x' comes from an index signature, so it must be accessed with ['x']`

**Solution:**
- Convert `obj.property` to `obj['property']`
- Add local environment schemas with Zod validation
- Apply AI-First file-local approach

### TS2339 - Property Does Not Exist
**Pattern:** `Property 'x' does not exist on type 'Y'`

**Solution:**
- Add missing properties to interfaces/schemas
- Use local type definitions instead of shared types
- Apply AI-First file-local schemas

### TS2375 - exactOptionalPropertyTypes Conflicts
**Pattern:** `Type 'string | undefined' is not assignable to type 'string'`

**Solution:**
- Add proper undefined handling
- Use non-undefined defaults
- Update type definitions for strict optional properties

### TS2304 - Cannot Find Name
**Pattern:** `Cannot find name 'TypeName'`

**Solution:**
- Add missing type definitions
- Fix import statements
- Create local type definitions

## AI-First Debugging Principles

### File-Local Approach
- Each file should be completely self-contained
- Define local schemas using Zod for validation
- Eliminate shared type dependencies where possible
- Every file tells its complete story

### Benefits
- **Isolation:** Files can be understood independently
- **Testing:** Each file is testable in isolation
- **AI-Friendly:** AI can understand and modify files without context
- **Maintainability:** No cascading changes across files

## Example Workflow Session

```bash
# Step 1: Initial test run
npm test
# Output: 200+ TypeScript errors

# Step 2: Analyze specific error type
npm run type-check 2>&1 | grep -c "Property 'to' does not exist"
# Output: 30 errors

# Step 3: Apply fixes (add local schemas, fix property access)
# ... make changes ...

# Step 4: Validate
npm run type-check 2>&1 | grep -c "Property 'to' does not exist"
# Output: 0 errors

npm run type-check 2>&1 | grep -c "error TS"
# Output: 170 errors (30 fewer)

# Step 5: Commit
git add .
git commit -m "feat: resolve email service interface mismatches with AI-First file-local schemas"
```

## Quality Metrics

### Success Indicators
- ✅ Target error type completely eliminated
- ✅ Total error count reduced
- ✅ No new errors introduced
- ✅ Functionality maintained
- ✅ Clean, descriptive commit message

### Red Flags
- ❌ New errors introduced
- ❌ Error count increased
- ❌ Functionality broken
- ❌ Incomplete fix (some errors remain)

## Tools and Commands

### Essential Commands
```bash
# Full test suite
npm test

# TypeScript compilation only
npm run type-check

# Count total errors
npm run type-check 2>&1 | grep -c "error TS"

# Find specific error types
npm run type-check 2>&1 | grep "TS2339"

# Biome linting
npm run check

# Git operations
git add .
git commit -m "message"
```

### Useful Grep Patterns
```bash
# Property access errors
grep -n "Property.*does not exist"

# Index signature errors  
grep -n "comes from an index signature"

# Optional property conflicts
grep -n "exactOptionalPropertyTypes"

# Missing type definitions
grep -n "Cannot find name"
```

## Best Practices

### Do's
- ✅ Always run tests before and after changes
- ✅ Make incremental, focused changes
- ✅ Document error counts and progress
- ✅ Use AI-First file-local approach when applicable
- ✅ Write comprehensive commit messages
- ✅ Verify functionality is maintained

### Don'ts
- ❌ Make large, sweeping changes without testing
- ❌ Ignore new errors introduced by fixes
- ❌ Commit incomplete or broken fixes
- ❌ Skip validation steps
- ❌ Use generic commit messages

## Troubleshooting

### When Tests Won't Run
1. Check TypeScript compilation first: `npm run type-check`
2. Fix compilation errors before running full test suite
3. Use `npm run check` to verify Biome linting

### When Errors Persist
1. Verify the fix targets the right error type
2. Check for typos in property names or types
3. Ensure all related files are updated consistently
4. Consider if a different approach is needed

### When New Errors Appear
1. Identify if they're related to your changes
2. Fix immediately or revert and try different approach
3. Never commit with new errors introduced

## Conclusion

This debugging workflow ensures systematic, reliable error resolution while maintaining code quality and functionality. The combination of TDD principles with AI-First architecture creates a robust development process that scales effectively across large codebases.

The key to success is discipline: always test first, make incremental changes, validate continuously, and commit only when complete.
