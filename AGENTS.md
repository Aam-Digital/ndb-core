# AI Agent instructions

You are an expert Angular and TypeScript developer working on Aam Digital, a case management software for social organizations. Follow these project-specific guidelines and best practices.

## Project Context

Aam Digital is a comprehensive case management software for social organizations, designed to improve effectiveness and transparency in work with beneficiaries. It's built with latest Angular (see `package.json` for current version) and uses TypeScript, Material Design, and various modern web technologies.

### Architecture & Tech Stack

- **Frontend**: Latest Angular (see `package.json`), TypeScript, Angular Material
- **State Management**: RxJS, Entity system with PouchDB
- **Authentication**: Keycloak integration
- **Database**: PouchDB (CouchDB compatible) with offline-first approach
- **Testing**: Jasmine, Karma for unit tests; Playwright for E2E
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
- Maintain a comprehensive test suite with Karma and Playwright

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
- `.github/prompts/` - Reusable prompt files for key agent workflows
- Follow the existing module structure with entity-based organization

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

### Unit Testing (Jasmine/Karma)

- Write unit tests for all new components and services
- Use `MockedTestingModule.withState()` as the standard test setup (from `src/app/utils/mocked-testing.module.ts`)
- Use `TestEntity` (from `src/app/utils/test-utils/TestEntity.ts`) for generic entity tests
- Mock dependencies with `jasmine.createSpyObj` and `mockEntityMapperProvider()`
- Custom Jasmine matchers available: `toHaveType`, `toContainFormError`, `toHaveValue`, `toBeValidForm`, `toBeEnabled`, `toHaveKey`, `toBeEmpty`, `toBeFinite`, `toBeDate`
- Use `fakeAsync`/`tick`/`flush` for async test patterns
- Use `expectObservable()` from `src/app/utils/test-utils/observable-utils.ts` for observable assertions
- Run tests: `npm run test -- --watch=false --include='**/relevant-file.spec.ts'`
- See [`.github/instructions/unit-tests.instructions.md`](.github/instructions/unit-tests.instructions.md) for detailed patterns and examples

### End-to-End Testing (Playwright)

- Import from `#e2e/fixtures.js` (not `@playwright/test` directly — ESLint enforced)
- Use `loadApp(page, entities?)` to bootstrap app with optional custom entity data
- Use standalone `generate*()` functions for test data: `generateChild()`, `generateNote()`, `generateTodo()`, `generateActivity()`, `generateUsers()`
- Use `argosScreenshot()` for visual regression snapshots
- Use accessibility-based locators (priority: `getByLabel` > `getByTitle` > `getByPlaceholder` > `getByRole` > `getByText`)
- Clock is mocked to fixed date via `E2E_REF_DATE`
- Run tests: `npm run e2e`
- See [`.github/instructions/e2e-tests.instructions.md`](.github/instructions/e2e-tests.instructions.md) for detailed patterns and examples

### Demo Data & Development

- Provide demo data generators for new entities
- Use `@faker-js/faker` for realistic test data
- Follow existing demo data patterns in `core/demo-data/`

---

## Agent Workflows

Agents support these key workflows. Use `.github/prompts/` files where available:

1. **Fleshing out requirements** — Read the linked GitHub issue, identify affected entities/components, list acceptance criteria and edge cases, flag ambiguities. See `.github/prompts/analyze-requirements.prompt.md`.
2. **Troubleshooting** — Analyze stack traces, use Sentry MCP for production errors, use `Logging` service (not `console.log`). See `.github/prompts/troubleshoot.prompt.md`.
3. **Planning implementation** — Analyze existing patterns, propose structure following conventions, consider config-driven approaches and offline-first implications. See `.github/prompts/plan-implementation.prompt.md`.
4. **Implementing changes** — Follow all conventions, include unit tests, use `$localize` for strings, run lint and tests. See `.github/prompts/implement-feature.prompt.md`.
5. **Analyzing & refactoring** — Identify code smells, check DRY violations, verify OnPush/signals/inject() usage, suggest simplifications. See `.github/prompts/refactor-code.prompt.md`.
6. **Generating e2e tests** — Use Playwright fixtures, standalone generators, accessibility locators, visual regression snapshots. See `.github/prompts/write-e2e-tests.prompt.md`.

## MCP Servers

The following MCP servers are available in `.vscode/mcp.json`:

| Server | Purpose |
|---|---|
| `angular-cli` | Angular CLI operations, schematics, component generation |
| `chrome-devtools` | Runtime debugging, DOM inspection, console access |
| `sentry` | Production error data, issue investigation |
| `github` | Issues, PRs, comments, diffs, repository context |

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

---

## Custom Agents

Custom agents are defined in `.claude/agents/`. They are automatically invoked based on your request.

### `business-analyst`
**When to use:** When you have rough or unclear requirements that need refining into a structured, testable requirement document before engineering begins.

**Example prompts:**
- "Refine these rough notes into a requirement doc: [paste notes]"
- "Clean up this feature request and make the acceptance criteria testable"
- "Turn this client call transcript into proper requirements"

---

### `implementation-planner`
**When to use:** When you want a technical breakdown before writing any code. Provide a GitHub issue number — it will explore the codebase and post the plan as a comment on the issue.

**Example prompts:**
- "Plan the implementation for issue #1234"
- "Create a technical breakdown for this feature: [describe feature]"
- "Break this requirement into tasks: [paste requirement]"

---

### `implementation-executor`
**When to use:** When a plan already exists as a GitHub issue comment and you want to build it — implements task by task, commits after each, and opens a PR.

**Example prompts:**
- "Execute the implementation plan on issue #1234"
- "Start coding the plan from this issue: [url]"
- "We've planned the feature, now let's build it"

---

### Typical workflow

```
1. business-analyst      →  refine rough requirements into a clear requirement doc
2. implementation-planner  →  create a technical plan posted on the GitHub issue
3. implementation-executor →  implement the plan, commit per task, open PR
```
