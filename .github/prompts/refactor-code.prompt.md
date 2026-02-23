# Refactor Code

Analyze code and suggest refactorings to improve quality.

## Steps

1. Identify code smells: large components, mixed responsibilities, duplicated logic
2. Check for DRY violations across similar components
3. Verify `changeDetection: ChangeDetectionStrategy.OnPush` on all components
4. Check signals/`computed()` usage — replace imperative patterns where appropriate
5. Check `inject()` vs constructor injection — prefer `inject()`
6. Look for `any` types that could be more specific (`unknown` or proper generics)
7. Verify `host` object usage instead of `@HostBinding`/`@HostListener`
8. Verify native control flow (`@if`, `@for`) instead of structural directives
9. Suggest simplifications while preserving behavior
10. Ensure refactoring doesn't break existing tests

## Output

Provide:
- **Issues found**: List of code smells and violations
- **Suggested changes**: Specific refactorings with before/after code
- **Risk assessment**: What could break and how to verify
- **Priority**: Which changes provide the most value
