# Initial System Setup

A newly deployed instance starts with an **empty database**: no `Config:CONFIG_ENTITY`, no entity types
beyond those defined in code, no records. This module turns such an empty instance into a usable system
by letting the first user pick a "use case" (a _base config_) and importing it.

It also hosts the **Assistant**, the side panel the setup UI is shown in, which later doubles as
context-aware guidance and the entry point to the [Setup Wizard](../admin/setup-wizard/) once a config
exists.

## Flow

1. On login, the toolbar checks whether a config has loaded yet. If not, it opens the Assistant
   directly — there's no route guard or app initializer for this, so setup only ever happens as an
   authenticated user.
2. The Assistant shows a "Create System" tab that lets the user pick a use case (and optionally
   generate demo data), then triggers the import.
3. Importing a base config means fetching its JSON documents and saving them as entities, force-
   overwriting anything already there. `Config:CONFIG_ENTITY` is just one of these documents, alongside
   permissions, enum definitions, site settings, sample reports/forms, etc.
4. Once the config document is saved, the app reconfigures itself reactively — routing and entity
   types are rebuilt and the current page re-renders. There's no redirect and no page reload.
5. If the logged-in account isn't linked to any profile yet, a second step offers to create one and
   link the account to it (see below) before showing "Start Exploring".
6. From then on, the Assistant instead shows context-aware guidance and, until it's marked finished,
   the multi-step [Setup Wizard](../admin/setup-wizard/) for further onboarding.

## Linking the initial admin's account to a profile

Keycloak's very first user is created with no `exact_username` attribute, so nothing links their login
account to a "profile" entity (the record `${user.entityId}` permission rules and `createdBy`/`updatedBy`
resolve to). `UserEntityLinkService` and a step in `system-init-assistant/` close that gap, once per
account, right after setup:

- **Only offered when `SessionInfo.entityId` is unset** (`UserEntityLinkService.shouldOfferStep`) - the
  same "no linked profile" state that's already valid and silent for any account outside setup (see
  above). This is also what makes demo mode skip the step automatically: its hardcoded session already
  sets `entityId`.
- **Which entity type to create is asked, not assumed.** `getUserEntityTypes()` returns every type with
  `enableUserAccounts` set, in entity-registry order - there is no defensible "first" one. The step
  renders nothing for zero types, skips the picker for exactly one, and shows a dropdown for several.
- **The form reuses the type's own details-view config** (its first panel's `Form` component, falling
  back to `toStringAttributes` if there is none) rather than a setup-specific field list, and saves
  through `EntityFormService` like any other form.
- **The account is linked only after the entity is saved**, via the same `updateUser(accountId, {
  userEntityId })` write path the user administration UI (`../user/user-details/`) uses to re-link an
  existing account - this step is really just that same operation, automated for the very first login.
- **A successful link reloads the app.** `SessionInfo.entityId` comes from a token claim set at login;
  writing the Keycloak attribute server-side doesn't change an already-issued token, so the app has to
  do a fresh login (`init()`'s SSO check) to pick it up - the reload is only skipped when the write
  wasn't actually persisted, which is also what keeps this safe on a demo/e2e session (excluded by the
  gate above regardless, but asserted explicitly in tests as the invariant that matters).
- **Never rolled back.** The entity is saved before the link is attempted, so a failed link (missing
  permission, network error) leaves a real, unlinked record behind rather than losing the user's input;
  the user is told an admin can link it later.

## Base configs

A base config is a small descriptor (id, name, description, locale) plus a list of JSON documents to
import. Configs come from two places: the ones shipped with the app, and external URLs so partners can
offer their own use cases without a code change. The picker filters these to the current locale.

## Things worth knowing before changing this flow

- Setup can be driven entirely by a `?useCase=<id>` URL parameter, skipping the picker — this is how
  e2e tests bootstrap a system. Any new step must work on this fully-automated path too. An unknown id
  fails silently (the picker just stays on screen), by design.
- Config-derived entity types and metadata (e.g. the `User` entity type) only exist once the app has
  finished reacting to the new config — code that reads config-derived entity info needs to wait for
  that, not just for the config document itself.
- Saved configs go through migrations on load, so what the app ends up with isn't always byte-identical
  to the imported JSON (e.g. user accounts get enabled by migration regardless of what a use case
  declares).
- `SystemResetService` (in `../admin/system-reset/`) wipes a system back to this empty state (except
  the current user's own profile) — the standard way to re-test setup against a real database.
- In demo mode the session and database are both in-memory and unauthenticated against any real
  backend, so anything that talks to an external server (e.g. Keycloak) must be skipped. The generated
  data also only exists until the page is reloaded, so setup code must never trigger a reload on a demo
  session.

## Key files

- `setup.service.ts` — lists and imports base configs; also hosts the app-wide gate for "has the config
  question been settled yet"
- `assistant.service.ts` / `assistant-dialog/` — opens and manages the Assistant panel and its tabs
- `assistant-button/` — toolbar entry point that auto-opens the panel when no config exists
- `system-init-assistant/` — the initial setup UI, including the `?useCase=` shortcut, use-case picker,
  and the post-setup account-linking step
- `user-entity-link.service.ts` — resolves which entity type(s) can be linked, the form fields for
  creating one, and performs the account link
- `context-aware-assistant/` — the post-setup guidance tab
- `../../../assets/base-configs/` — the shipped base configs and the descriptors listing them
- `../admin/setup-wizard/` — the post-setup stepper
- `../admin/system-reset/` — resets a system back into this flow
