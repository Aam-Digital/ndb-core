# AI Agent instructions

You are an expert Angular and TypeScript developer working on Aam Digital, a case management software for social organizations, designed to improve effectiveness and transparency in work with beneficiaries. Follow these project-specific guidelines and best practices.

This is a social impact application helping organizations work with beneficiaries. Code quality, accessibility, and reliability are paramount for the mission-critical nature of this software.

## Where to find documentation

This file holds the rules that apply everywhere. Details live next to the code — read them
instead of exploring the code from scratch:

- **Module READMEs:** before working on files in a folder under `src/app/`, `e2e/`, `build/` or
  `cli/`, read the `README.md` in that folder and in its parent folders, if they exist. They describe
  the architecture, key files and patterns of that module. For example:
  - [`src/app/core/entity/README.md`](src/app/core/entity/README.md) — entity base class, schema, load/save, lifecycle actions
  - [`src/app/core/config/README.md`](src/app/core/config/README.md) — how the JSON config drives views, menus and entities
  - [`src/app/core/permissions/README.md`](src/app/core/permissions/README.md) — CASL-based role/permission enforcement
  - [`src/app/core/logging/README.md`](src/app/core/logging/README.md) — logging and Sentry reporting
  - [`src/app/core/database/README.md`](src/app/core/database/README.md) — PouchDB databases and sync
  - [`e2e/README.md`](e2e/README.md) — running and writing Playwright tests

  List all of them with `git ls-files '*README.md'`.

- **Patterns per file type:** before creating or editing one of these files, read the matching
  instructions file (GitHub Copilot attaches them automatically, other agents have to read them):

  | Files                                          | Instructions                                                                                    |
  | ---------------------------------------------- | ----------------------------------------------------------------------------------------------- |
  | `*.component.ts`                               | [`angular-components.instructions.md`](.github/instructions/angular-components.instructions.md) |
  | `*.entity.ts`, `*.datatype.ts`, `**/entity/**` | [`entity-model.instructions.md`](.github/instructions/entity-model.instructions.md)             |
  | `*.spec.ts`                                    | [`unit-tests.instructions.md`](.github/instructions/unit-tests.instructions.md)                 |
  | `e2e/**`                                       | [`e2e-tests.instructions.md`](.github/instructions/e2e-tests.instructions.md)                   |

- **Guides and concepts:** `doc/compodoc_sources/` (how-to guides, architecture, i18n, security, UX guidelines),
  published as the [Developer Documentation](https://aam-digital.github.io/ndb-core/documentation/additional-documentation/overview.html).

**Keep the docs current:** when you change behaviour that a README or guide describes, update it in
the same PR. New module documentation goes into a `README.md` next to the code and is registered in
`doc/compodoc_sources/summary.json` (see `doc/compodoc_sources/concepts/documentation-structure.md`).

---

## Tech Stack

- **Frontend**: Latest Angular (see `package.json`), TypeScript, Angular Material, FontAwesome icons
- **State Management**: Signals, RxJS, Entity system with PouchDB
- **Authentication**: Keycloak integration
- **Permissions**: CASL
- **Database**: PouchDB (CouchDB compatible) with offline-first approach
- **Dates**: Moment.js
- **Testing**: Vitest for unit tests; Playwright for E2E; `@faker-js/faker` for test and demo data
- **Documentation**: Compodoc for API docs
- **Build & Deploy**: Angular CLI, Docker
- **Path Aliases**: `#src/` maps to `src/` (used in imports, e.g. `import { Logging } from "#src/app/core/logging/logging.service"`)
- **Utilities**: check `src/app/utils/` (e.g. `asArray`) before writing a new helper
- **Angular reference**: for comprehensive Angular guidance, see the official [Angular llms.txt file](https://angular.dev/context/llm-files/llms-full.txt)

### Project & File Structure

- `src/app/core/` - Core system modules and services
  - Shared components go in `src/app/core/common-components/`
- `src/app/features/` - Feature-specific modules
- `e2e/` - End-to-end tests with Playwright
- `doc/` - Documentation and API reference
- `build/` - Build configuration and scripts
- `.github/instructions/` - Patterns per file type (see [Where to find documentation](#where-to-find-documentation))
- `.claude/agents/` - Custom Claude Code agents for key workflows (these can be selected from GitHub Copilot)
- Follow the existing module structure with entity-based organization

---

## Angular Development Patterns

Code examples for these rules are in
[`angular-components.instructions.md`](.github/instructions/angular-components.instructions.md).

### Components

- Use standalone components (default behavior, do NOT set `standalone: true`)
- Set `changeDetection: ChangeDetectionStrategy.OnPush` for all components
- Prefer `input()` and `output()` functions over decorators
- Use the `inject()` function instead of constructor injection
- Do NOT use the `@HostBinding` and `@HostListener` decorators.
  Put host bindings inside the `host` object of the `@Component` or `@Directive` decorator instead
- Keep components small and focused on a single responsibility
- Prefer inline templates for small components
- Prefer Reactive forms over Template-driven forms
- Implement lazy loading for feature routes

### State Management

- Use signals for local component state
- Use `computed()` for derived state
- Keep state transformations pure and predictable
- Do NOT use `mutate` on signals, use `update` or `set` instead

### Templates

- Keep templates simple, avoid complex logic
- Use native control flow (`@if`, `@for`, `@switch`) instead of `*ngIf`, `*ngFor`, `*ngSwitch`
- Use class bindings instead of `ngClass`, and style bindings instead of `ngStyle`
- Use `async` pipe for observables
- Use `customDate` pipe for date formatting with "shortDate" or "mediumDate" format
- Use `<app-fa-dynamic-icon>` for icons — never `<fa-icon>` directly
- Use `NgOptimizedImage` for static images (not base64)

### Services

- Use `providedIn: 'root'` for singleton services
- Design services around single responsibility
- Implement proper error handling and logging (see [Error Handling & Remote Logging](#error-handling--remote-logging-sentry))

## TypeScript Development Standards

- Use strict type checking (already configured)
- Prefer type inference when obvious
- Avoid `any` type - use `unknown` when type is uncertain
- Use proper generics for entity types
- Implement proper error handling with typed exceptions
- Use _ESLint_ for linting (`npm run lint`) and _prettier_ for code formatting

---

## Aam Digital specific patterns

### Entity Architecture

Read [`src/app/core/entity/README.md`](src/app/core/entity/README.md) and
[`entity-model.instructions.md`](.github/instructions/entity-model.instructions.md) before changing entities or datatypes.

- All data models extend the base `Entity` class (from `src/app/core/entity/model/entity.ts`)
- Register entities with the `@DatabaseEntity("TypeName")` decorator
- Define fields with `@DatabaseField()` annotations, specifying `dataType`, `label`, `additional` options as needed
- Use `EntitySchemaService` for serialization/deserialization of entities
- Use `EntityMapperService` for CRUD operations on entities
- Implement proper permissions checking via CASL integration.
  Components and buttons can use `EntityAbility` and `DisableEntityOperationDirective` to check and enforce permissions.
- Implement specific datatypes (Date, ConfigurableEnum, etc.) extending the `DefaultDatatype` class. Implement "edit" and "display" components for a datatype's customized UI.
- Provide demo data generators for new entities (see [`src/app/core/demo-data/README.md`](src/app/core/demo-data/README.md))

### Configuration System

The platform is highly configurable through JSON configuration files, allowing customization without code changes
(see [`src/app/core/config/README.md`](src/app/core/config/README.md)). This includes:

- Entity definitions and field configurations
- Dashboard layouts and widgets
- Navigation menus and views
- Reports and data exports

When developing new functionality:

- Leverage the existing config-driven architecture
- Use the established configuration patterns for new features
- Create interfaces for configuration objects and let component classes implement them
- Validate configurations properly

### Refactoring & Legacy Code

- Some existing code may not follow current conventions. For new code, always follow these instructions.
  For existing code, analyse the status and refactor only after confirmation.
- Always separate refactoring changes into their own commits and PRs — do not mix refactoring with feature work.

## UX and Styling

- Use Angular Material components for UI consistency
- Follow Material Design guidelines
- Use SCSS for styling
  - Use global variables and mixins from `src/styles/` for colors (e.g. `@use "variables/colors";` and `colors.$primary`)
- Use global style classes from the files in the `src/styles/globals/` folder (e.g. `flex-row` and `margin-regular`) where possible,
  instead of creating new custom styles
- If custom styles are necessary, create a class with a meaningful name in the component-specific scss file and avoid inline styles

### Creating Figma mockups

When asked to design mockups, screens, or UI variants in Figma, build them in the
**Aam Digital — Design System** file so they reuse the real components and tokens.

- **File key:** ask user to provide
- **Always load the `figma-use` and `figma-generate-design` skills before any `use_figma` call.**
- **Where to build:** add a dedicated, clearly-labelled new page (e.g. `📋 <Feature> — Mockups (#<issue>)`).
  **Never edit the canonical `📄 Screens` page** — it holds the reference screens (Dashboard,
  Entity List, Entity Details). Confirm with the user before writing into this shared file.
- **Use the design system, don't hardcode.** Tokens are **local variables** in this file
  (collections: `Color / Semantic`, `Color / Status (w-levels)`, `Spacing`, `Radius`). Bind colors
  with `setBoundVariableForPaint` and spacing/radius with `setBoundVariable`. Discover IDs via
  `getLocalVariableCollectionsAsync` / by inspecting an existing screen's bound variables —
  `search_design_system` returns empty for this file. Core components live on the
  `🧩 Components — Core (Material)` page.
- **App-screen conventions:** 1440×900 frame; 280px cream sidebar (`background/secondary`) with an
  orange (`primary`) logo bar and active nav item; white content; orange accent links; font **Inter**
  (Regular / Medium / Semi Bold / Bold).
- **Gotcha:** a paint object returned by `setBoundVariableForPaint` can **lose its variable binding
  when reused across many `node.fills` assignments** (the base color shows instead). Create a fresh
  bound paint per text node and set its base color to the resolved fallback so contrast survives either way.
- Validate each section with `get_screenshot` as you go.

These mockups are not confirmed as a published/importable library, so building in a _separate_ Figma
file may not be able to import the tokens by key — building in-file (on a new page) keeps full fidelity.

## Internationalization (i18n)

- All user-facing strings must be translatable
- Use Angular i18n markers or `$localize` for strings
  - Do not add context labels unless the purpose of the i18n string is truly ambiguous without it
- Follow existing translation key patterns (see `doc/compodoc_sources/concepts/i18n.md`)

## Performance & Accessibility

- Follow WCAG guidelines for accessibility
- Use Angular Material accessibility features
- Optimize bundle size with lazy loading

## Error Handling & Remote Logging (Sentry)

Use `Logging` (from `#src/app/core/logging/logging.service`) — never `console.log`.

`Logging.warn()` / `Logging.error()` and every unhandled error are reported to Sentry. How messages
are worded, grouped and filtered there is documented in
[`src/app/core/logging/README.md`](src/app/core/logging/README.md) — read it before changing how
something is logged.

A Sentry issue should mean "a developer has something to fix". Before adding a log call, decide
who has to act on the failure:

- **Bug in our code** (e.g. a `TypeError` in a template, an id built with the wrong entity type):
  report it — `Logging.error`, or let it throw.
- **Server or infrastructure fault** (e.g. an unexpected `400`/`5xx` from our own backend):
  report it with `Logging.warn`, including the response, and tell the user the action failed.
- **User or device environment** (e.g. offline / flaky connection, expired session, a record the
  user may not read, a browser permission the user denied such as clipboard or notifications):
  do not report it (`Logging.debug`); tell the user what happened and what they can do.
- **Instance configuration or data** (e.g. an unknown `dataType`, icon or validator in the config;
  a permission rule variable for an account without linked profile; a file field pointing to a
  missing file; an optional feature not set up for the instance): do not report it
  (`Logging.debug`); make it visible to admins in the UI, and validate config when it is saved.

Rules that keep one root cause in one Sentry issue:

- **Log a failure once, with the caught error as context** (`Logging.warn("Could not load X", err)`):
  see "Log an error together with a message" and "Log a failure once" in the logging README.
- **Never leave a promise floating.** An `async` call inside `subscribe()`, an effect or an event
  handler needs `await` or `.catch()`. Otherwise an expected failure reaches Angular's
  `ErrorHandler` and is reported as a separate, unhandled issue.
- **Classify failures with the shared helpers**, not with ad-hoc status checks per component:
  `isConnectivityError()` (`src/app/utils/connectivity-error.ts`) and `isExpiredSessionError()`
  (`src/app/utils/expired-session-error.ts`). A component that only treats `404` as expected
  logs every dropped connection as a warning of its own, and cannot tell the user what happened.
- **Check whether an optional feature is configured before using it** (e.g. push notifications
  without a Firebase config) instead of logging its failure on every page load.
- **A known limitation is not an event.** If something fails on every sync or render for a known
  reason (e.g. `purge()` on the legacy `idb` adapter), check the capability up front.
- **Expect config values of the wrong type.** Config is plain JSON edited by admins; a template or
  `computed()` must not crash because a value is not of the type its interface declares.

When investigating Sentry issues, see "Investigating issues in Sentry" in the logging README.

## Testing Guidelines

### Unit Testing (Vitest)

Code examples and shared test helpers are in
[`unit-tests.instructions.md`](.github/instructions/unit-tests.instructions.md).

- **Test behaviour, not existence.** Write unit tests for logic that can be wrong: branches,
  transformations, error paths, edge cases. A component or service with no branching logic
  does not need a spec — `expect(component).toBeTruthy()` asserts only that Angular can
  construct a class, which the production build and the e2e suite already establish.
  `src/app/component-smoke.spec.ts` sweeps every registered component for that in one file;
  add a component to its list rather than creating a new spec file for it.
- **A spec file must earn its environment.** Every spec file costs a fresh jsdom (~1.3s of CI,
  regardless of how many tests it holds) and a reviewer's attention. Prefer adding a case to
  an existing spec over creating a new file, the same way we prefer extending an e2e scenario
  over adding a new one.
- **Three or more tests sharing a body shape become one `it.each` table.** A table shows the
  whole contract at a glance and makes a gap in the cases visible; the same cases written out
  longhand hide it behind fifty lines of near-identical arrange/act/assert. See
  `src/app/core/export/query.service.spec.ts` for the pattern, or the shared
  `testDatatype()` harness for a more elaborate one.
- **Name the invariant, not the scenario.** `it("keeps the wildcard row editable when the
default role only covers single record types")` beats a name that restates the setup. If a
  name needs "and", it is two tests or one table.
- **Drive the subject through its public API.** No `(component as any).privateMethod()` — if
  a behaviour is only reachable through a private, test it through the caller that reaches it.
- **Assert what the user sees.** Query by role or visible text, never by framework-internal
  class names such as `mat-mdc-checkbox-checked`, which change on Angular Material upgrades
  and say nothing about behaviour.
- Do not add unit tests for trivial changes (e.g. rewording an error message, renaming a
  variable, adjusting a log string) unless the change also alters behavior. A test that
  only pins down exact wording breaks on the next copy edit and adds no protection against
  real regressions.

#### Shared state between spec files

The unit-test runner is **not** isolated: the Angular builder leaves Vitest's `isolate`
at `false`, so every spec file in a worker shares one module registry, one `environment`
singleton, one TestBed — and one jsdom `localStorage`. Anything a spec mutates and does
not restore leaks into whichever file runs next, so the damage surfaces in an innocent
spec and moves between runs.

Practical rules:

- **Never stub a shared prototype.** `vi.spyOn(Storage.prototype, ...)` and friends patch
  an object owned by the worker process, so even `isolate: true` would not undo it. Inject
  a fake instead — for storage, provide [`LOCAL_STORAGE_TOKEN`](src/app/utils/di-tokens.ts)
  with [`createFakeStorage()`](src/app/utils/test-utils/fake-storage.ts).
- **Never mutate a shared entity schema.** Use `TestEntity` (from `src/app/utils/test-utils/TestEntity.ts`)
  for generic entity tests. If a test needs custom fields, define a dedicated entity class for that
  test (e.g. `@DatabaseEntity("MyTest") class MyTest extends Entity {}` then `MyTest.schema.set(...)`)
  instead of changing the schema of `TestEntity` or another shared entity.
- **Restore from a hook, not the end of a test body**, so the restore still runs when an
  assertion fails partway through.
- **Register every entity type a spec relies on** by importing the model (the
  `@DatabaseEntity` decorator registers it). Do not depend on another spec file having
  imported it.

### End-to-End Testing (Playwright)

Read [`e2e/README.md`](e2e/README.md) and [`e2e-tests.instructions.md`](.github/instructions/e2e-tests.instructions.md) before writing e2e tests.

- Keep the number of stand-alone e2e tests to a minimum: the initial `loadApp()` is expensive,
  so prefer integrating a new check as an additional step into an existing scenario.

### Working with Test Results

To avoid re-running tests for further analysis, pipe console output to a file:

```bash
npm run test -- --watch=false --include='**/relevant-file.spec.ts' 2>&1 | tee test-results/test-output.log
```

For CI-style runs with coverage (`npm run test-ci`), results are written to `coverage/` (lcov format).

---

## Public GitHub Content (PRs, Issues, Comments, Commit Messages)

This repository is public. Never include customer/project-identifying information or other
production-system-specific data in anything posted to GitHub — no deployment/instance names,
server hostnames, external partner URLs, user identifiers, or real record data. Share only
generalized insights instead (e.g. "a large production instance", "an external webhook
consumer"). Scrub quoted log or monitoring output before posting. Links to access-restricted
internal tools (e.g. Sentry issues) are acceptable.

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

## Git Worktrees

Claude Code creates git worktrees under `.claude/worktrees/` for isolated task branches.
This directory is listed in `.gitignore` and **must never be committed**.

### Creating a worktree

```bash
git worktree add .claude/worktrees/<branch-name> <branch-name>
```

### Setting up node_modules in the worktree

Worktrees share git history but not `node_modules`. Symlink from the main repo to avoid a
full reinstall (works as long as the branch has the same dependencies):

```bash
ln -s "$(git rev-parse --show-toplevel)/node_modules" \
      "$(git rev-parse --show-toplevel)/.claude/worktrees/<branch-name>/node_modules"
```

If the branch has different dependencies, do a full install inside the worktree instead:

```bash
npm ci --prefix .claude/worktrees/<branch-name>
```

### Staging safety

`.claude/worktrees/` is in `.gitignore`, so `git add .` will not pick up worktree directories
once that entry is committed. If you ever create worktrees outside this path, be aware that git
treats directories containing a `.git` file as gitlinks (mode `160000`) and will stage them as
phantom submodules — breaking CI's `git submodule foreach`. In that case, stage files explicitly
by name and remove any gitlink entries with `git rm --cached <path>`.

---

## Common Commands

- `npm run start` - Development server
- `npm run test -- --watch=false --include='**/relevant-file.spec.ts'` - Unit tests
- `npm run test-ci` - Full CI-style unit test suite with coverage
- `npm run e2e` - End-to-end tests
- `npm run build` - Production build
- `npm run lint:fix` - Linting (including automatic fixes)
