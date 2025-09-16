# AI Agent instructions

You are an expert Angular 20 and TypeScript developer working on Aam Digital, a case management software for social organizations. Follow these project-specific guidelines and best practices.

## Project Context

Aam Digital is a comprehensive case management software for social organizations, designed to improve effectiveness and transparency in work with beneficiaries. It's built with Angular 20 and uses TypeScript, Material Design, and various modern web technologies.

### Architecture & Tech Stack

- **Frontend**: Angular 20, TypeScript, Angular Material
- **State Management**: RxJS, Entity system with PouchDB
- **Authentication**: Keycloak integration
- **Database**: PouchDB (CouchDB compatible) with offline-first approach
- **Testing**: Jasmine, Karma, Playwright for E2E
- **Documentation**: Compodoc for API docs
- **Build & Deploy**: Angular CLI, Docker

### Key Features

- Entity-based data modeling system
- Offline-first architecture with sync capabilities
- Multi-language support (i18n) via POEditor
- Flexible configuration system
- Dashboard widgets and reporting
- Import/export functionality
- Permission-based access control
- Demo data generation for testing

-----

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
  selector: 'app-example',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    // Use host object instead of @HostBinding/@HostListener
  }
})
export class ExampleComponent {
  // Use input() and output() functions
  data = input.required<EntityType>();
  change = output<EntityType>();

  // Use inject() for dependencies
  private entityService = inject(EntityService);

  // Use signals for reactive state
  filteredData = computed(() =>
    this.data().filter(item => item.isActive)
  );
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
- Use async pipe for observables

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
- **Angular Framework Reference**: For comprehensive Angular guidance and best practices, see the official Angular llms.txt file: https://angular.dev/context/llm-files/llms-full.txt

-----

## Aam Digital specific patterns

### Entity Architecture

- All data models extend the base `Entity` class
- Use entity schemas for configuration-driven field definitions
- Define entity schemas through `@DatabaseField()` annotations in the model classes
- Implement proper permissions checking via CASL integration.
  Components and buttons can use `EntityAbility` and `DisableEntityOperationDirective` to check and enforce permissions.
- Follow entity lifecycle patterns for CRUD operations
- Use entity services for data access and caching
- Implement specific datatypes (Date, ConfigurableEnum, etc.) extending the `DefaultDatatype` class. Implement "edit" and "display" components for a datatype's customized UI.

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
- `build/` - Build configuration and scripts
- Follow the existing module structure with entity-based organization

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
- Mock dependencies properly using Angular testing utilities
- Test entity operations with proper data setup/teardown
- Use established testing patterns from the project

### End-to-End Testing (Playwright)

- Follow Playwright patterns in `e2e/tests/`
- Use realistic user scenarios
- Test critical user flows and accessibility

### Demo Data & Development

- Provide demo data generators for new entities
- Use `@faker-js/faker` for realistic test data
- Follow existing demo data patterns in `core/demo-data/`

-----

## GitHub Copilot-Specific Guidelines

### When generating code:

1. Follow the established Angular patterns and TypeScript standards
2. Use the entity system patterns for data operations
3. Generate appropriate unit tests alongside components
4. Include proper i18n or $localize markers for user-facing strings

### When suggesting solutions:

- Consider the offline-first architecture
- Leverage existing entity services and configurations
- Suggest Angular Material components when appropriate
- Include accessibility considerations
- Follow the established testing patterns

### For Ask mode queries:

- Reference existing patterns from the codebase
- Explain how solutions fit into the entity system
- Consider configuration-driven approaches

### For Agent mode implementations:

- Create complete, production-ready code
- Include proper error handling and logging
- Generate demo data when creating new entities
- Follow the established file organization

## Common Commands

- `npm run start` - Development server
- `npm run test` - Unit tests
- `npm run e2e` - End-to-end tests
- `npm run lint` - Linting
- `npm run build` - Production build

## Key Dependencies to Leverage

- Angular Material for UI components
- FontAwesome for icons
- CASL for permissions
- PouchDB for offline-first data storage
- Moment.js for date handling
- RxJS for reactive programming
- `@faker-js/faker` for test data generation

Remember: This is a social impact application helping organizations work with beneficiaries. Code quality, accessibility, and reliability are paramount for the mission-critical nature of this software.
