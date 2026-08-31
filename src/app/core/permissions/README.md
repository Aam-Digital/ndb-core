# Permissions System

This module implements CASL-based role-based access control (RBAC) for Aam Digital.

## Quick Reference

- **Where it lives**: `Config:Permissions` CouchDB document (JSON rules)
- **Frontend enforcement**: `EntityAbility` blocks writes client-side before network
- **Backend enforcement**: [replication-backend](https://github.com/Aam-Digital/replication-backend) filters reads and validates writes
- **Configuration**: Admins edit via Admin UI or directly in the database
- **Rule format**: [CASL JSON syntax](https://casl.js.org/v6/en/guide/define-rules)

## Architecture: How permissions work end-to-end

### System design (high-level)

1. **Admin configures permissions**: An org's admin edits `Config:Permissions` in the database, defining which roles can do what on which entity types.
2. **Backend enforces on read**: `replication-backend` uses CASL rules to filter what documents each user can sync (via `_changes` feed and bulk-document endpoints).
3. **Frontend enforces on write**: `ndb-core` uses CASL rules to block write operations client-side (before hitting the network) via `EntityAbility.can()` checks.
4. **Backend enforces on write**: `replication-backend` also checks permissions on write operations as defense-in-depth.

### Frontend (`ndb-core`) architecture

_Key files:_

- `permission-types.ts` — type definitions (`EntityActionPermission`, `DatabaseRule`, `DatabaseRules`)
- `ability/entity-ability.ts` — extends CASL `Ability`, converts `Entity` instances to CASL subjects
- `ability/ability.service.ts` — loads `Config:Permissions` and builds the `EntityAbility`
- `../entity/entity-mapper/entity-mapper.service.ts` — calls `assertPermission()` before `save()` / `remove()` (write enforcement)
- `feature-permission/feature-permission.service.ts` — admin-facing editing of per-role access to a single "feature" entity type (see [Feature permission dialog](#feature-permission-dialog))

_Flow:_

1. On login, `AbilityService.initializeRules()` loads the `Config:Permissions` entity.
2. `getRulesForUser()` merges rules: `[...admin-default-rules, ...role-rules]`.
3. Rules are interpolated (`${user.entityId}`, `${user.projects}`) and fed to `EntityAbility.update(rules)`.
4. When saving an entity, `EntityAbility.assertPermission(action, entity)` throws if `ability.cannot()` — this blocks the write before network.
5. Reads are not gated client-side; PouchDB sync and the backend's replication filter determine what gets downloaded.

_Rule evaluation order:_ Last matching rule wins (CASL default).

### Backend (`replication-backend`) architecture

_Key files:_

- `src/permissions/rules/permission.ts` — defines `Permission` entity (doc ID `Config:Permissions`)
- `src/permissions/rules/rules.service.ts` — loads and hot-reloads `Config:Permissions`, implements `getRulesForUser()`
- `src/permissions/permission/permission.service.ts` — builds `Ability` from rules, exports `getAbilityFor()` and `isAllowedTo()`
- `src/restricted-endpoints/replication/changes/changes.controller.ts` — filters `_changes` feed via `ability.can('read', doc)`
- `src/restricted-endpoints/replication/bulk-document/bulk-document.service.ts` — filters bulk-pull, bulk-push via `ability.can()`
- `src/restricted-endpoints/document/document-write.service.ts` — checks write permissions via `isAllowedTo()`

_Flow:_

1. On startup, `RulesService.onModuleInit()` loads `Config:Permissions` and subscribes to live changes to hot-reload.
2. If the doc is missing (404), it falls back to bootstrap mode: only `admin_app` users get full access.
3. `getRulesForUser(user)` merges rules: for authenticated users, `[...admin-default, ...role-rules]` (rule order same as frontend).
4. Rules are interpolated and passed to `PermissionService.getAbilityFor(user)`.
5. Every access point (changes feed, bulk-doc, REST write, design-doc) calls `.can()` on this ability or goes through `isAllowedTo()`.
6. CASL's deny-by-default means unauthenticated (anonymous) users only get access via the `_public` rules (legacy `public` read as a fallback).

_Choke points:_

- `changes.controller.ts` is the replication-feed authorization boundary — the vast majority of read traffic is filtered there.

## CASL library details

Both repos use CASL v6.8.1. Key facts:

- **Deny-by-default**: If no rule matches a subject/action pair, access is denied.
- **No specificity**: CASL does not rank rules by how specific they are. Instead, it uses **last matching rule wins** — the last rule in the array that matches the subject/action/conditions determines the result, regardless of whether earlier rules are more specific.
- **Inverted rules**: A rule with `inverted: true` works as a deny, not a grant. This can be confusing with multiple roles; use with care.
  - The Admin UI does not ensure the order or rules is kept, so inverted rules effects might change!
- **Conditions**: Rules can specify MongoDB-style conditions to restrict access to specific documents or fields. Conditions are only evaluated if the document is passed to `ability.can(subject, doc)` — not just the subject type string.
- **`cannot()`**: Calling `ability.cannot(action, subject)` is literally `!ability.can(action, subject)`.

## Configuring Permissions (Admin Guide)

All permission rules are defined in a single document: `Config:Permissions` in the database.
Admins edit this document to control what each role can do.

### How to edit permissions

**In the Aam Digital app:**

- Go to Admin > Application Configuration > Edit permissions config
- This opens the `Config:Permissions` document in the app's JSON editor

**Directly in the database:**

- Use CouchDB Fauxton GUI or another database tool to edit the document directly

**Per feature, from its admin list view:**

- On an internal "feature" type (e.g. Export Templates, Email Templates, Public Forms) use the "Configure Permissions" button next to "Add New"
- See [Feature permission dialog](#feature-permission-dialog) below for what this can and cannot change

### Permission structure

Permissions use JSON format with a role → rules mapping:

```json
{
  "_id": "Config:Permissions",
  "data": {
    "_default": [
      {
        "subject": "Config",
        "action": "read"
      }
    ],
    "field_officer": [
      {
        "subject": ["Child", "School"],
        "action": "manage"
      },
      {
        "subject": "Note",
        "action": "manage",
        "conditions": {
          "authors": {
            "$elemMatch": {
              "$eq": "${user.entityId}"
            }
          }
        }
      }
    ],
    "supervisor": [
      {
        "subject": "all",
        "action": "manage"
      }
    ]
  }
}
```

**Key concepts:**

- **`subject`**: The entity type(s) — e.g., `Child`, `School`, `Note`, or `all` for any type
- **`action`**: What users can do — `read`, `create`, `update`, `delete`, or `manage` (all operations)
- **`_default`**: Rules applied to all authenticated users (regardless of role)
- **`_public`**: Rules applied to anonymous (not logged-in) visitors
- **Reserved section keys**: `_default` and `_public` are reserved section keys, not roles. The leading underscore keeps them from colliding with a realm role of the same name, and any user role that starts with `_` is ignored when resolving rules. Older documents may still use the non-prefixed `default` / `public` names; these are read as a fallback: every place loading the document normalizes it with `migrateLegacySectionKeys()` (see `permissions-config-migration.ts`), so all readers can rely on the prefixed keys. The stored document is migrated to the underscore form by the `oneoff-20260724-permissions-key-rename` migration (see `cli/migration/`). `_default` and `_public` are the only allowed underscore-prefixed keys; do not create realm roles, or any other rule section, whose name starts with `_`.
- **Combining roles**: If a user has multiple roles, their rules are appended in order (the `_default` rules first, then each role's rules). CASL evaluates them so that the **last matching rule wins** — this is not necessarily the most permissive one. This ordering matters when deny/inverted rules are involved: a later `"inverted": true` rule can revoke access granted earlier, and a later granting rule can re-enable access a previous inverted rule denied.

### Feature permission dialog

Instead of editing raw JSON, admins can review and change who has access to one
entity type directly from its list view. It is offered as a button next to
"Add New" on internal "feature" types (`isInternalEntity`, e.g. `TemplateExport`,
`EmailTemplate`, `PublicFormConfig`, `ReportConfig`); on mobile, where the header
has no room, the same action sits in the list's overflow (`⋮`) menu. Regular
entity types do not offer it - their list menu is already crowded, and their
permissions are managed in the advanced editor.

It shows one row per user role with a checkbox per action:

| Checkbox   | Action written |
| ---------- | -------------- |
| **Add**    | `create`       |
| **Read**   | `read`         |
| **Update** | `update`       |
| **Delete** | `delete`       |

The selected actions are stored as a single rule for this entity type: a plain
string for one action, an array for several and `"manage"` when all four are
selected (keeping the shape an admin would write by hand).

**The shared `_default` row.** The `_default` section applies to every logged-in
user on top of their roles, so it is listed as a read-only first row. An action it
grants is shown checked and disabled on every role row: it cannot be revoked for a
single role here (that would require an inverted rule), and it is never duplicated
into a role's own rules when saving. Other actions of the same role stay editable.

**What it will not touch.** Checkboxes cannot represent arbitrary CASL rules, so
the dialog only ever adds or removes rules whose `subject` is _exactly_ this one
entity type with plain feature actions. Everything else is read (to display the
effective state) but never written:

- grouped subjects (`subject: ["A", "B"]`) and the `all` wildcard
- rules with `conditions` or `inverted: true`
- the shared `_default` and `_public` sections (and their legacy `default` / `public` spellings)
- managed `[system-default]` rules written by the backend

A role whose access is decided by one of those rules is shown **read-only** for the
whole row with a lock icon, because the dialog cannot change such a rule without
affecting other roles or entity types. In the default config `user_app` and
`admin_app` hold `{ subject: "all", action: "manage" }`, so both appear locked.

The checkboxes show what a role can actually do, resolved the way CASL does it: of
all rules matching this entity type and action, the **last matching one wins**. So a
grant followed by an `"inverted": true` rule renders as unchecked, and a granting
rule after that inverted one renders as checked again.

The dialog always links to the advanced (JSON) editor, and says explicitly when at
least one row is read-only.

Every save first stores a timestamped backup document (`Config:Permissions:<timestamp>`)
and offers an "Undo" action.

The one case in which the dialog writes a `_default` section is the very first save on
an instance that has no permissions config at all: an absent config means "everyone may
do everything", so `_default: [{ subject: "all", action: "manage" }]` is seeded alongside
the new rules to avoid locking every logged-in user out of everything else.

Who may open the dialog is derived from CASL (`update` on `Config`), not from a hardcoded
role name, so an instance that grants permission editing to a role other than `admin_app`
gets the same UI.

_Key files:_ `feature-permission/feature-permission.service.ts` (rule reading/writing),
`feature-permission/feature-permission-dialog/`, `permissions-config.service.ts`
(shared loading, backup/undo and admin check), `entity-list/entity-list.component.html`
(where the dialog is offered).

### Restricting access (inverted rules)

Use `"inverted": true` to deny access instead of grant it:

```json
{
  "subject": "SensitiveReport",
  "action": "delete",
  "inverted": true
}
```

This says: the role cannot delete `SensitiveReport` documents.

> **⚠️ Warning:** When a user has multiple roles with overlapping inverted rules, it can be unclear which permissions actually apply. Use inverted rules sparingly and document them well.

### Conditional access (restrict by user or entity field)

Instead of allowing all access to an entity type, you can restrict to specific documents:

```json
{
  "subject": "Note",
  "action": "manage",
  "conditions": {
    "authors": {
      "$elemMatch": {
        "$eq": "${user.entityId}"
      }
    }
  }
}
```

This allows users to manage only Notes they authored.

**Available user variables:**

- `${user.entityId}` — the entity ID of the currently logged-in user (e.g., `User:john_doe`)
- `${user.projects}` — array of projects linked to the user (if configured in the user entity)

**Example:** Restrict by linked projects:

```json
{
  "subject": "Report",
  "action": "read",
  "conditions": {
    "project": {
      "$in": "${user.projects}"
    }
  }
}
```

Users can only read Reports linked to one of their assigned projects.

> **⚠️ Warning:** Conditions do not support the $or operator (or $and, $nor, $not). Instead, you combine multiple separate can rules for the same action and subject to mimic an logical OR condition.

### When permissions change

If you change `Config:Permissions`:

1. **Users gain new permissions** — The app automatically re-syncs available data. No action needed.
2. **Users lose permissions** — Their local database is cleared on next login, and they re-sync only what they're allowed to access.

## Common Tasks

### Check permissions in code (TypeScript)

```typescript
import { EntityAbility } from "@app/core/permissions/ability/entity-ability";

export class MyService {
  constructor(private ability: EntityAbility) {
    if (this.ability.can("read", new SomeEntity())) {
      // Permission granted
    } else {
      // Permission denied
    }
  }
}
```

### Check permissions in templates (HTML)

```html
<button
  *appDisabledEntityOperation="{
    entity: myEntity,
    operation: 'update'
  }"
>
  Edit
</button>
```

The `DisableEntityOperationDirective` automatically disables buttons based on the user's permissions.
Pass the entity and the operation (`create`, `read`, `update`, `delete`, `manage`).

## Testing

- Frontend: `src/app/core/permissions/ability/ability.service.spec.ts`, `entity-ability.spec.ts`, `feature-permission/feature-permission.service.spec.ts`
- Backend: `src/permissions/rules/rules.service.spec.ts`, `src/permissions/permission/permission.service.spec.ts`

When testing permissions:

- Always pass the fully-loaded entity (not just the type string) if testing rules with conditions.
- Use `testing-entity-ability-factory.ts` (frontend) or test fixtures in `test/utils/test-app.ts` (backend) to seed test rules.
- Test both the allow and deny cases, especially for inverted rules.

## Links

- [CASL Documentation](https://casl.js.org/v6/en/guide/intro) — rule format, conditions, API reference
- [Backend (`replication-backend`)](https://github.com/Aam-Digital/replication-backend) — authoritative enforcement, replication filtering
