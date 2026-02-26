# Write E2E Test

You are helping write an end-to-end test for the Aam Digital project using Playwright.

Follow the detailed patterns and guidelines in `.github/instructions/e2e-tests.instructions.md`.

## Command Usage

This command accepts an optional filename parameter:

- `/write-e2e-test` - searches for TODOs in all e2e test files
- `/write-e2e-test filename.spec.ts` - searches for TODOs only in the specified file

## TODO Implementation Mode

Search for TODO comments in e2e test files:

```bash
# If filename parameter provided, search only in that file:
grep -n "TODO" e2e/tests/[FILENAME] -A 10

# If no filename provided, search all e2e test files:
grep -r "TODO" e2e/tests/ --include="*.ts" -n -A 10
```

If TODOs are found:

1. **Implement One at a Time**: Only implement the FIRST TODO found - do not implement multiple TODOs in one run
2. **Create Test Case**: Replace the entire TODO comment block with a complete `test()` function in the specified file (or the file where the TODO was found)
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

If no TODOs are found, point the user to
`./doc/compodoc_sources/how-to-guides/end-to-end-tests.md` for instructions on
how to use the command.

Now write the e2e test following the guidelines from `.github/instructions/e2e-tests.instructions.md`.
