# Write E2E Tests

Generate Playwright end-to-end tests for a feature.

## Guidelines

1. Read the detailed patterns from `.github/instructions/e2e-tests.instructions.md`
2. Import from `#e2e/fixtures.js` — **not** from `@playwright/test` directly
3. Generate test data using standalone `generate*()` functions
4. Use `loadApp(page, entities)` with custom entities
5. Use accessibility-based locators (priority: `getByLabel` > `getByTitle` > `getByPlaceholder` > `getByRole` > `getByText`)
6. Avoid `page.goto()` — click links and navigation elements instead
7. Include `argosScreenshot()` at key visual checkpoints
8. Use `waitForDashboardWidgetsToLoad()` before dashboard screenshots
9. Follow the pattern from existing tests in `e2e/tests/`
10. Remember: clock is mocked to `E2E_REF_DATE` ("2025-01-23")

## Available Generators

```typescript
import { generateUsers } from "#src/app/core/user/demo-user-generator.service.js";
import { generateChild } from "#src/app/child-dev-project/children/demo-data-generators/demo-child-generator.service.js";
import { generateNote } from "#src/app/child-dev-project/notes/demo-data/demo-note-generator.service.js";
import { generateTodo } from "#src/app/features/todos/model/demo-todo-generator.service.js";
import { generateActivity } from "#src/app/features/attendance/demo-data/demo-activity-generator.service.js";
```

## Verification

Run with `npm run e2e` to verify tests pass.
