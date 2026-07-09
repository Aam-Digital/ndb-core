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
6. CASL's deny-by-default means unauthenticated (anonymous) users only get access via `permission.public` rules.

_Choke points:_

- `changes.controller.ts` is the replication-feed authorization boundary — the vast majority of read traffic is filtered there.

## CASL library details

Both repos use CASL v6.8.1. Key facts:

- **Deny-by-default**: If no rule matches a subject/action pair, access is denied.
- **No specificity**: CASL does not rank rules by how specific they are. Instead, it uses **last matching rule wins** — the last rule in the array that matches the subject/action/conditions determines the result, regardless of whether earlier rules are more specific.
- **Inverted rules**: A rule with `inverted: true` works as a deny, not a grant. This can be confusing with multiple roles; use with care.
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

### Permission structure

Permissions use JSON format with a role → rules mapping:

```json
{
  "_id": "Config:Permissions",
  "data": {
    "default": [
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
- **`default`**: Rules applied to all authenticated users (regardless of role)
- **Combining roles**: If a user has multiple roles, their rules combine. The most permissive wins.

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

- Frontend: `src/app/core/permissions/ability/ability.service.spec.ts`, `entity-ability.spec.ts`
- Backend: `src/permissions/rules/rules.service.spec.ts`, `src/permissions/permission/permission.service.spec.ts`

When testing permissions:

- Always pass the fully-loaded entity (not just the type string) if testing rules with conditions.
- Use `testing-entity-ability-factory.ts` (frontend) or test fixtures in `test/utils/test-app.ts` (backend) to seed test rules.
- Test both the allow and deny cases, especially for inverted rules.

## Links

- [CASL Documentation](https://casl.js.org/v6/en/guide/intro) — rule format, conditions, API reference
- [Backend (`replication-backend`)](https://github.com/Aam-Digital/replication-backend) — authoritative enforcement, replication filtering
