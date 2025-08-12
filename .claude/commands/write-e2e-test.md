# Write E2E Test

You are helping write an end-to-end test for the Aam Digital project using Playwright.

## TODO Implementation Mode

First, search for TODO comments in e2e test files:

```bash
# Search for TODO comments in e2e test files
grep -r "TODO" e2e/tests/ --include="*.ts" -n -A 10
```

If TODOs are found:

1. **Implement One at a Time**: Only implement the FIRST TODO found - do not implement multiple TODOs in one run
2. **Create Test Case**: Replace the entire TODO comment block with a complete `test()` function
3. **Expected TODO Format**: 
   ```typescript
   /*
   TODO: Test user can create a new child record
   Given I am on the children overview page
   When I click "Add Child" button
   And I fill in required fields (name, dateOfBirth)
   And I click "Save"
   Then I should see the new child in the list
   */
   ```

If no TODOs are found, explain:
- How to add TODO comments with scenario steps in Gherkin format (Given/When/Then)  
- That each TODO block will become a separate test case
- That the command will implement one TODO at a time when run again
- The preferred `/* ... */` comment format for multi-line TODOs
- Example of how to structure a test file with TODOs

## Framework & Setup
- Use Playwright with browser-local database
- Import from `#e2e/fixtures.ts` instead of `@playwright/test`
- Run tests with `npx playwright test` or `npm run e2e`

## Test Structure Best Practices

### Locators (in order of preference)
1. `getByLabel()` - for form fields with labels
2. `getByRole()` - for buttons, links, checkboxes, etc.
3. `getByTitle()` - for elements with title attributes
4. `getByPlaceholder()` - for input fields with placeholders
5. `getByText()` - for text content

### Actions
- Prefer direct actions over checking visibility first
- Use `click()` directly rather than checking if clickable
- Navigate via clicks instead of `page.goto()` to avoid reloads

### Test Fixtures
- Create explicit fixtures using generator functions (`generateUsers()`, `generateChild()`, `generateActivity()`)
- Use semantic names: `childToAdd`, `activityToTest`, `userToAssign`
- Load all data via `loadApp(page, [...users, ...children, ...activities])`
- Generate additional context entities for realism
- Use descriptive titles with angle brackets for test activities (e.g., `"<COACHING CLASS>"`, `"<MATH TUTORING>"`) to distinguish them from real data

## Common Patterns

### Navigation
```typescript
// Main menu navigation
await page.getByRole("navigation").getByText("[Menu]").click()

// Button clicks
await page.getByRole("button", { name: "[Button]" }).click()

// Tab navigation
await page.getByRole("tab", { name: "[Tab]" }).click()

// Field clicks
await page.getByLabel("[Field]").click()
```

### Form Interactions
```typescript
// Select options
await page.getByRole("option", { name: fixture.name }).click()

// Fill forms
await page.getByLabel("[Field]").fill(fixture.value)

// For select options with checkboxes
await page.getByRole("option", { name: fixture.name }).getByRole("checkbox", { checked: true })
```

### Verification
```typescript
// Check visibility
await expect(page.getByText(fixture.name)).toBeVisible()

// Check selection state
await expect(page.getByRole("option", { name: fixture.name }).getByRole("checkbox", { checked: true })).toBeVisible()

// Check absence
await expect(page.getByText(fixture.value)).not.toBeVisible()
```

### Table/List Interactions
```typescript
// Click table cells
await page.getByRole("cell", { name: fixture.title }).click()

// Click list items
await page.getByText(fixture.name).click()
```

## Visual Regression Testing
- Use `argosScreenshot(page, "descriptive-name")` after actions complete
- Screenshots captured when CI or SCREENSHOT env vars set
- Use `aria-busy=true` on loading elements for stability

## Quirks & Special Cases
- For select options with checkboxes, use `{ checked: true }` not `{ selected: true }`
- Modal interactions: use specific button names within modal context

Now write the e2e test following these guidelines.
