# Implement Feature

Implement a feature or change following all project conventions.

## Guidelines

1. Follow all conventions from `AGENTS.md`
2. Include unit tests alongside implementation
3. Use `$localize` for all user-facing strings
4. Use `Logging` (from `#src/app/core/logging/logging.service`) — never `console.log`
5. Check for TypeScript errors after each change
6. Remove unused imports
7. If similar changes are needed in multiple places, implement in one and ask for review
8. If the change is complex, break it into smaller parts and ask for review after each

## Before Finishing

- Run `npm run lint:fix` to fix formatting and lint issues
- Run `npm run test -- --watch=false --include='**/relevant-file.spec.ts'` for affected tests
- Check terminal output for unused Angular component imports or other warnings
- Verify no `any` types were introduced
- Ensure all new components use `changeDetection: ChangeDetectionStrategy.OnPush`
