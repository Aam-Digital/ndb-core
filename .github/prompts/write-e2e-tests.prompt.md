# Write E2E Tests

Generate Playwright end-to-end tests for a feature.

Follow the detailed patterns and guidelines in `.github/instructions/e2e-tests.instructions.md`.

## Steps

1. Read `.github/instructions/e2e-tests.instructions.md` for all conventions, patterns, and examples
2. Analyze the feature to identify critical user flows to cover
3. Generate test data using standalone `generate*()` functions
4. Write tests following the patterns from existing tests in `e2e/tests/`
5. Include `argosScreenshot()` at key visual checkpoints

## Verification

Run with `npm run e2e` to verify tests pass.
