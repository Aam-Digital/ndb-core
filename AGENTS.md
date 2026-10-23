# AI Agent instructions

You are an expert Angular and TypeScript developer working on Aam Digital, a case management software for social organizations, designed to improve effectiveness and transparency in work with beneficiaries. This is a social impact application: code quality, accessibility and reliability matter. Follow these project-specific guidelines.

## Where to find documentation

This file holds the rules that apply everywhere. Details live next to the code, so read them instead of exploring the code from scratch:

- **Module READMEs:** before working on files in a folder under `src/app/`, `e2e/`, `build/` or `cli/`, read the `README.md` in that folder and in its parent folders, if they exist. They describe the architecture, key files and patterns of that module. List them with `git ls-files '*README.md'`. For example:
  - [`src/app/core/entity/README.md`](src/app/core/entity/README.md) — entity base class, schema, load/save, lifecycle actions
  - [`src/app/core/config/README.md`](src/app/core/config/README.md) — how the JSON config drives views, menus and entities
  - [`src/app/core/permissions/README.md`](src/app/core/permissions/README.md) — CASL-based role/permission enforcement
  - [`src/app/core/logging/README.md`](src/app/core/logging/README.md) — logging and Sentry reporting
  - [`src/app/core/database/README.md`](src/app/core/database/README.md) — PouchDB databases and sync
  - [`e2e/README.md`](e2e/README.md) — running and writing Playwright tests
- **Patterns per file type:** before creating or editing one of these files, read the matching instructions file. GitHub Copilot attaches them automatically (`applyTo`), Claude Code loads them through the symlinks in `.claude/rules/` (`paths`), other agents have to read them:

  | Files            | Instructions                                                                                    |
  | ---------------- | ----------------------------------------------------------------------------------------------- |
  | `*.component.ts` | [`angular-components.instructions.md`](.github/instructions/angular-components.instructions.md) |
  | `*.spec.ts`      | [`unit-tests.instructions.md`](.github/instructions/unit-tests.instructions.md)                 |

  Only add such a file for conventions that apply across modules; documentation of a module goes into its README. When you change the `applyTo` glob of a file, change its `paths` glob too.

- **Guides and concepts:** `doc/compodoc_sources/` (how-to guides, architecture, i18n, security, UX guidelines), published as the [Developer Documentation](https://aam-digital.github.io/ndb-core/documentation/additional-documentation/overview.html).

**Keep the docs current:** when you change behaviour that a README or guide describes, update it in the same PR. New module documentation goes into a `README.md` next to the code and is registered in `doc/compodoc_sources/summary.json` (see [`documentation-structure.md`](doc/compodoc_sources/concepts/documentation-structure.md)).

## Project

- **Stack:** the current Angular with Angular Material, signals and RxJS, PouchDB (offline-first), CASL permissions, Keycloak, Moment.js for dates, Vitest and Playwright, `@faker-js/faker` for test and demo data. Versions are in `package.json`; for general Angular guidance see the [Angular llms.txt](https://angular.dev/context/llm-files/llms-full.txt).
- **Path alias:** `#src/` maps to `src/` (e.g. `import { Logging } from "#src/app/core/logging/logging.service"`).
- **Helpers:** check `src/app/utils/` (e.g. `asArray`) before writing a new one.
- **Structure:** `src/app/core/` core modules and services (shared components in `core/common-components/`), `src/app/features/` feature modules, `e2e/` Playwright tests, `doc/` documentation, `.github/instructions/` patterns per file type, `.claude/skills/` shared skills. Follow the existing module structure with entity-based organization.

## Code conventions

- **Components:** standalone (the default, do not set `standalone: true`), `changeDetection: ChangeDetectionStrategy.OnPush`, `input()` and `output()` functions, `inject()` instead of constructor injection, host bindings in the `host` object (no `@HostBinding` or `@HostListener`). Keep them small, prefer inline templates for small ones, use reactive forms, lazy-load feature routes.
- **State:** signals for local state, `computed()` for derived state, `update` or `set` (never `mutate`).
- **Templates:** keep them simple. Use `@if`, `@for` and `@switch`, class and style bindings instead of `ngClass` and `ngStyle`, the `async` pipe for observables, the `customDate` pipe for dates, `NgOptimizedImage` for static images. Use `<app-fa-dynamic-icon>` for icons, never `<fa-icon>` directly.
- **Services:** `providedIn: 'root'` for singletons, one responsibility each.
- **TypeScript:** strict types, inference where obvious, `unknown` instead of `any`, typed exceptions. ESLint (`npm run lint`) and Prettier format the code.
- **Legacy code:** existing code may not follow these conventions. Follow them for new code; for existing code, analyse first and refactor only after confirmation, and keep refactoring in its own commits and PRs.

## Aam Digital patterns

- **Entities:** before changing entity types, their schema or datatypes (also in `*.entity.ts` and `*.datatype.ts` files outside `core/entity/`), read the [Entity System](src/app/core/entity/README.md), the [Entity Schema](src/app/core/entity/schema/README.md), [How to create a new Entity Type](doc/compodoc_sources/how-to-guides/create-new-entity-type.md) and, for datatypes, [basic-datatypes](src/app/core/basic-datatypes/README.md). Provide demo data for new entities ([demo-data](src/app/core/demo-data/README.md)).
- **Permissions:** check them with `EntityAbility` and `DisableEntityOperationDirective` ([permissions](src/app/core/permissions/README.md)).
- **Config:** the platform is configured through JSON ([config](src/app/core/config/README.md)). Use the existing config patterns for new features, create interfaces for config objects, and validate configs.
- **UX and styling:** follow the [UX guidelines](doc/compodoc_sources/concepts/ux-guidelines.md): Angular Material, SCSS with the global variables and classes in `src/styles/`, no inline styles. For mockups in Figma, use the `figma-mockups` skill.
- **i18n:** all user-facing strings are translatable (Angular i18n markers or `$localize`); no context labels unless the string is truly ambiguous ([i18n](src/app/core/language/README.md)).
- **Accessibility:** follow WCAG and use the Angular Material accessibility features.

## Errors and logging

Use `Logging` (from `#src/app/core/logging/logging.service`), never `console.log`. `Logging.warn()` / `Logging.error()` and every unhandled error go to Sentry, and a Sentry issue should mean "a developer has something to fix". Before adding a log call, decide who has to act on the failure: report bugs in our code and server faults, but not what the user's device or the instance's config causes. Read ["Deciding what to report"](src/app/core/logging/README.md) in the logging README before changing how something is logged or handled. Never leave a promise floating: an `async` call inside `subscribe()`, an effect or an event handler needs `await` or `.catch()`.

## Testing

- **Unit tests (Vitest):** test behaviour, not existence; write the failing test first for a bug fix; do not generate "too many" tests; use `it.each` tables for repeated shapes. The rules and examples are in [`unit-tests.instructions.md`](.github/instructions/unit-tests.instructions.md).
- **e2e tests (Playwright):** add an e2e scenario for a new larger feature, but keep the number of stand-alone tests, scenarios and screenshots small: prefer a step in an existing scenario. See [`e2e/README.md`](e2e/README.md).
- **Config for manual testing:** if trying a change needs a special config (fields, rules, features), add it to the [all-features config](src/assets/base-configs/all-features/) in the same PR, and revert it before merge only if it should not stay. The manual testing steps of the PR then say "demo mode All Features" instead of listing admin-UI setup steps.

## Public GitHub content (PRs, issues, comments, commit messages)

This repository is public. Never include customer/project-identifying information or other production-system-specific data in anything posted to GitHub: no deployment/instance names, server hostnames, external partner URLs, user identifiers or real record data. Share only generalized insights instead (e.g. "a large production instance"). Scrub quoted log or monitoring output before posting. Links to access-restricted internal tools (e.g. Sentry issues) are acceptable.

## Skills

Shared Claude skills are in `.claude/skills/` (overview in the [README](README.md#skills)). A feature usually goes through them in this order: `feature-use-cases`, `design-prototype` or `figma-mockups`, `plan-implementation`, the code, then `review-pull-request`.

## Common commands

- `npm run start` - development server
- `npm run test -- --watch=false --include='**/relevant-file.spec.ts'` - unit tests of one file
- `npm run test-ci` - full CI-style unit test suite with coverage
- `npm run e2e` - end-to-end tests
- `npm run build` - production build
- `npm run lint:fix` - linting (including automatic fixes)
