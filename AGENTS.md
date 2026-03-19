# AI Agent instructions

You are an expert Angular and TypeScript developer working on Aam Digital, a case management software for social organizations. Follow these project-specific guidelines and best practices.

## Project Context

Aam Digital is a comprehensive case management software for social organizations, designed to improve effectiveness and transparency in work with beneficiaries. It's built with latest Angular (see `package.json` for current version) and uses TypeScript, Material Design, and various modern web technologies.

### Architecture & Tech Stack

- **Frontend**: Latest Angular (see `package.json`), TypeScript, Angular Material
- **State Management**: RxJS, Entity system with PouchDB
- **Authentication**: Keycloak integration
- **Database**: PouchDB (CouchDB compatible) with offline-first approach
- **Testing**: Vitest for unit tests; Playwright for E2E
- **Documentation**: Compodoc for API docs
- **Build & Deploy**: Angular CLI, Docker
- **Path Aliases**: `#src/` maps to `src/` (used in imports, e.g. `import { Logging } from "#src/app/core/logging/logging.service"`)

### Key Features

- Entity-based data modeling system
- Offline-first architecture with sync capabilities
- Multi-language support (i18n) via POEditor
- Flexible configuration system
- Dashboard widgets and reporting
- Import/export functionality
- Permission-based access control
- Demo data generation for testing

---

## Angular Development Patterns

### Component Architecture

- Use standalone components (default behavior, do NOT set `standalone: true`)
- Prefer `input()` and `output()` functions over decorators
- Use signals for reactive state management with `computed()` for derived state
- Set `changeDetection: ChangeDetectionStrategy.OnPush` for all components
- Use `inject()` function instead of constructor injection
- Implement lazy loading for feature routes
- Use native control flow (`@if`, `@for`, `@switch`) instead of structural directives

### Component Structure Example

```typescript
@Component({
  selector: "app-example",
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    // Use host object instead of @HostBinding/@HostListener
  },
})
export class ExampleComponent {
  // Use input() and output() functions
  data = input.required<EntityType>();
  change = output<EntityType>();

  // Use inject() for dependencies
  private entityService = inject(EntityService);

  // Use signals for reactive state
  filteredData = computed(() => this.data().filter((item) => item.isActive));
}
```

### Component Guidelines

- Keep components small and focused on single responsibility
- Prefer inline templates for small components
- Prefer Reactive forms over Template-driven forms
- Use class bindings instead of `ngClass`
- Use style bindings instead of `ngStyle`
- Use `NgOptimizedImage` for static images (not base64)

### Template Best Practices

- Keep templates simple, avoid complex logic
- Use native control flow (`@if`, `@for`, `@switch`) instead of `*ngIf`, `*ngFor`, `*ngSwitch`
- Use `async` pipe for observables
- Use `customDate` pipe for date formating with "shortDate" or "mediumDate" format

### Service Patterns

- Use `providedIn: 'root'` for singleton services
- Design services around single responsibility
- Use the `inject()` function instead of constructor injection
- Implement proper error handling and logging
- Use dependency injection for testability

### State Management

- Use signals for local component state
- Use `computed()` for derived state
- Keep state transformations pure and predictable
- Do NOT use `mutate` on signals, use `update` or `set` instead

### Host Bindings

- Do NOT use the `@HostBinding` and `@HostListener` decorators
- Put host bindings inside the `host` object of the `@Component` or `@Directive` decorator instead

## TypeScript Development Standards

### Type Safety

- Use strict type checking (already configured)
- Prefer type inference when obvious
- Avoid `any` type - use `unknown` when type is uncertain
- Use proper generics for entity types
- Implement proper error handling with typed exceptions

### Code Quality

- Keep components small and focused on a single responsibility
- Prefer inline templates for small components
- Write maintainable, performant, and accessible code
- Use _ESLint_ for linting (`npm run lint`)
- Use _prettier_ for code formatting
- Maintain a comprehensive test suite with Vitest and Playwright

### Additional Resources

- **Angular Framework Reference**: For comprehensive Angular guidance and best practices, see the official Angular llms.txt file: <https://angular.dev/context/llm-files/llms-full.txt>

---

## Aam Digital specific patterns

### Entity Architecture

- All data models extend the base `Entity` class (from `src/app/core/entity/model/entity.ts`)
- Register entities with the `@DatabaseEntity("TypeName")` decorator
- Define fields with `@DatabaseField()` annotations, specifying `dataType`, `label`, `additional` options as needed
- Use `EntitySchemaService` for serialization/deserialization of entities
- Use `EntityMapperService` for CRUD operations on entities
- Implement proper permissions checking via CASL integration.
  Components and buttons can use `EntityAbility` and `DisableEntityOperationDirective` to check and enforce permissions.
- Implement specific datatypes (Date, ConfigurableEnum, etc.) extending the `DefaultDatatype` class. Implement "edit" and "display" components for a datatype's customized UI.
- Use `TestEntity` (from `src/app/utils/test-utils/TestEntity.ts`) for generic entity tests
- See `doc/compodoc_sources/how-to-guides/` for detailed guides on entities, datatypes, and more

### Configuration System

The platform is highly configurable through JSON configuration files, allowing customization without code changes. This includes:

- Entity definitions and field configurations
- Dashboard layouts and widgets
- Navigation menus and views
- Reports and data exports

When developing new functionality:

- Leverage the existing config-driven architecture
- Use the established configuration patterns for new features
- Create interfaces for configuration objects and let component classes implement them
- Validate configurations properly

### Project & File Structure

- `src/app/core/` - Core system modules and services
  - Shared components go in `src/app/core/common-components/`
- `src/app/features/` - Feature-specific modules
- `e2e/` - End-to-end tests with Playwright
- `doc/` - Documentation and API reference
  - `doc/compodoc_sources/how-to-guides/` - Detailed developer guides (entities, datatypes, testing, etc.)
- `build/` - Build configuration and scripts
- `.github/instructions/` - Auto-attached Copilot instructions per file type (detailed patterns and examples)
- `.claude/agents/` - Custom Claude Code agents for key workflows (these can be selected from GitHub Copilot)
- Follow the existing module structure with entity-based organization

### Refactoring & Legacy Code

- Some existing code may not follow current conventions. For existing code, analyse the status and refactor only after confirmation.
- Always separate refactoring changes into their own commits and PRs — do not mix refactoring with feature work.

## UX and Styling

- Use Angular Material components for UI consistency
- Follow Material Design guidelines
- Use SCSS for styling
  - Use global variables and mixins from `src/styles/` for colors (e.g. `@use "variables/colors";` and `colors.$primary`)
- Use global style classes from the files in the `src/styles/globals/` folder (e.g. `flex-row` and `margin-regular`) where possible,
  instead of creating new custom styles
- If custom styles are necessary, create a class with a meaningful name in the component-specific scss file and avoid inline styles

## Internationalization (i18n)

- All user-facing strings must be translatable
- Use Angular i18n markers or `$localize` for strings
- Follow existing translation key patterns

## Performance & Accessibility

- Implement OnPush change detection strategy
- Use trackBy functions for lists
- Follow WCAG guidelines for accessibility
- Optimize bundle size with lazy loading
- Use Angular Material accessibility features

## Testing Guidelines

### Unit Testing (Vitest)

- Write unit tests for all new components and services
- Run tests: `npm run test -- --watch=false --include='**/relevant-file.spec.ts'`
- Run the full CI-style unit test suite with coverage: `npm run test-ci`
- See [`.github/instructions/unit-tests.instructions.md`](.github/instructions/unit-tests.instructions.md) for detailed patterns and examples

### End-to-End Testing (Playwright)

- Run tests: `npm run e2e`
- See [`.github/instructions/e2e-tests.instructions.md`](.github/instructions/e2e-tests.instructions.md) for detailed patterns and examples

### Working with Test Results

To avoid re-running tests for further analysis, pipe console output to a file:

```bash
npm run test -- --watch=false --include='**/relevant-file.spec.ts' 2>&1 | tee test-results/test-output.log
```

For CI-style runs with coverage, results are written to `coverage/` (lcov format).

### Demo Data & Development

- Provide demo data generators for new entities
- Use `@faker-js/faker` for realistic test data
- Follow existing demo data patterns in `core/demo-data/`

---

## Agent Workflows

Custom agents are defined in `.claude/agents/`. They support these key workflows (in logical order):

1. **Fleshing out requirements** — Refine rough feature requests into structured, testable requirement documents. See `.claude/agents/1-business-analyst.md`.
2. **Planning implementation** — Create detailed technical breakdowns with phased tasks, posted as GitHub issue comments. See `.claude/agents/2-implementation-planner.md`.
3. **Implementing changes** — Execute an implementation plan task by task, committing after each, and opening a PR. See `.claude/agents/3-implementation-executor.md`.
4. **Troubleshooting** — Debug issues using Sentry, devtools, stack traces, and codebase analysis. See `.claude/agents/1b-troubleshooter.md`.
5. **Analyzing & refactoring** — Identify code smells, check convention adherence, suggest specific refactorings. See `.claude/agents/4-refactorer.md`.
6. **Generating e2e tests** — Write Playwright tests with fixtures, accessibility locators, and visual regression snapshots. See `.claude/agents/5-e2e-test-writer.md`.

### Typical workflow

```
1-business-analyst        →  refine rough requirements into a clear requirement doc
2-implementation-planner  →  create a technical plan posted on the GitHub issue
3-implementation-executor →  implement the plan, commit per task, open PR
```

## MCP Servers

The following MCP servers are available in `.vscode/mcp.json`:

| Server            | Purpose                                                  |
| ----------------- | -------------------------------------------------------- |
| `angular-cli`     | Angular CLI operations, schematics, component generation |
| `chrome-devtools` | Runtime debugging, DOM inspection, console access        |
| `sentry`          | Production error data, issue investigation               |
| `github`          | Issues, PRs, comments, diffs, repository context         |

## Common Commands

- `npm run start` - Development server
- `npm run test -- --watch=false --include='**/relevant-file.spec.ts'` - Unit tests
- `npm run e2e` - End-to-end tests
- `npm run build` - Production build
- `npm run lint:fix` - Linting (including automatic fixes)

## Key Dependencies to Leverage

- Angular Material for UI components
- FontAwesome for icons
- CASL for permissions
- PouchDB for offline-first data storage
- Moment.js for date handling
- RxJS for reactive programming
- `@faker-js/faker` for test data generation
- Utility functions like `asArray` from "src/app/utils/" folder

Remember: This is a social impact application helping organizations work with beneficiaries. Code quality, accessibility, and reliability are paramount for the mission-critical nature of this software.
