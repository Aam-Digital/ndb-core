# User Roles and Permissions

User roles and permission rules restrict what components a user can see and what data a user can access and edit.
These are stored in the backend and are available in the frontend after a successful login.

- Permissions are enforced during database sync by a special backend service, our [replication-backend](https://github.com/Aam-Digital/replication-backend).
- Permissions (and roles) can also be evaluated in the frontend to disable or hide certain UI elements

## User Roles

One or more roles can be assigned to a user account.
A role is linked to specific permission rules that define access for individual entities (i.e. database documents).

### Roles are assigned in Keycloak

When using Keycloak as an authenticator, the roles are assigned through so called Role-Mappings.
To assign a new role to a user, this role first has to be created in the realm.
To do this go to the Keycloak admin console, select the realm for which you want to create a role and go to the _Realm
roles_ menu item.
Here a new role can be created and also a description can be provided for it.
This description should explain non-technical users, what this role is there for.
Default roles that are always available are `user_app`, `admin_app` and `account_manager`.
After a role has been created, the role can be assigned to a user.
This can either be done in the frontend using the `UserSecurityComponent` or via the Keycloak admin console under _
Users_
-> _\<select user\>_ -> _Role mapping_ -> _Assign role_.

## Permissions

Aam Digital allows to specify permissions to restrict access of certain user roles to the various entity types.
Permissions are defined using the [CASL JSON syntax](https://casl.js.org/v5/en/guide/define-rules#the-shape-of-raw-rule).
The permissions are stored in a [config entity](../../classes/Config.html) `Config:Permissions` which is persisted together with other
entities in the database.

### Permission structure

In the following example, we define roles `user_app` and `admin_app`.
There are also some permissions for the general `default` role that is automatically applied to all authenticated users.

A user can have multiple roles and the permissions are then combined.

```JSON
{
  "_id": "Config:Permissions",
  "data": {
    "default": [
      {
        "subject": "Config",
        "action": "read"
      }
    ],
    "user_app": [
      {
        "subject": ["Child", "School"],
        "action": "manage"
      },
      {
        "subject": "RecurringActivity",
        "action": "manage",
        "action": [
          "create",
          "delete"
        ]
      },
      {
        "subject": "Note",
        "action": "manage",
        "conditions": {
          "authors": {
            "$elemMatch": {
              "$eq": "${user.name}"
            }
          }
        }
      }
    ],
    "admin_app": [
      {
        "subject": "all",
        "action": "manage"
      }
    ]
  }
}
```

- The `_id` property of the doc ("Config:Permissions") needs to be exactly as displayed here, as there is only one permission object allowed in a single database.
- In `data`, the permissions for each of the user role are defined.
- The permissions for a given role consist of an array of rules.
- `subject` refers to the type of entity.
  - `all` is a wildcard for the subject that matches any entity.
- `action` refers to the operation that is allowed or permitted on the given subject.
  - available actions from the CASL library are `create`, `read`, `update`, `delete`
  - `manage` is also a wildcard for the action which means _any operation is allowed_.

To learn more about how to define rules, have a look at
the [CASL documentation](https://casl.js.org/v5/en/guide/define-rules#rules).

### "Inverted" permission rules (disallowing actions)

It is possible to restrict / remove permissions, instead of adding permissions, through the `"inverted": true` keyword.
when `"inverted": true` is specified, this rule defines what the role is **not allowed** to do.

Use this with care: When users have multiple roles that overlap, it may not be intuitively clear which permissions apply.

### Conditions in permission rules

Instead of giving permission for all records of a given subject (i.e. entity type)
you can also apply conditions to narrow this down:

```json
{
  "subject": "Note",
  "action": "manage",
  "conditions": {
    "$or": [
      "authors": {
        "$elemMatch": {
          "$eq": "${user.entityId}"
        }
      },
      "assignedProjects": {
        "$elemMatch": {
          "$in": "${user.projects}"
        }
      },
      "category": {
        "$eq": "DISCUSSION"
      }
    ]
  }
}
```

Conditions follow MongoDB syntax. Refer to [CASL documentation](https://casl.js.org/v6/en/guide/conditions-in-depth) for details.

Aam Digital allows you to use certain details of the user entity for such conditions:

- `${user.entityId}` is the entity ID (including prefix) linked to the currently logged in user
  - this allows to grant access to entities that have explicitly been assigned to a certain user
- `${user.projects}` is the (array) field with ID `projects` on the entity linked to current user.
  You can configure this by editing the data structure of the relevant entity type(s).
  - usually this field is configured as a multi-select entity reference field to allow linking certain "groups" to an individual user.
    For example: Select schools the user is responsible for and allow the user to see all Note entities that are linked to one of their assigned schools.

---

## Implementing components with permissions

This section is about code using permissions to read and edit **entities**.
If you want to change the menu items which are shown in the navigation bar have a look at the _views_ section in
the [Configuration Guide](./configuration.html).

The permission object is automatically fetched whenever a user logs in.
The permissions disable certain buttons based on the users overall permissions.
This is done in the app through
the [DisableEntityOperationDirective](../../directives/DisableEntityOperationDirective.html), which connects certain
buttons with their operation.

As an example lets say we have a class variable called `note` which holds an object of the `Note` entity.
We want to create a button which allows to _edit_ this note.
In the HTML template we could write the following in order to automatically connect it to the permission system:

```HTML

<button
  *appDisabledEntityOperation="{
        entity: note,
        operation: 'update'
    }"
>
  Edit Note
</button>
```

This will automatically disable the button if the user is not allowed to _update_ this specific note.

To check permissions inside a `*.ts` file, you can inject the `EntityAbility`:

```typescript
import { Note } from "./note";
import { Injectable } from "@angular/core";
import { EntityAbility } from "./permission-types";

@Injectable()
export class SomeService {
  constructor(private ability: EntityAbility) {
    if (this.ability.can("create", Note)) {
      // I have permissions to create notes
      const note = new Note();
    } else {
      // I don't have permissions to create notes
      throw Error("Missing permissions");
    }
  }
}
```

In this example the `EntityAbility` service is used to check whether the currently logged in user is allowed to _create_
new objects of the `Note` entity.
In this case a constructor is provided to check for the permissions,
in other cases it might make more sense to use an instance of an object like `this.ability.can('read', new Note())`.

> WARNING: If you have conditions in your rules, make sure you pass the fully loaded entity and not only the string entity type.
> Otherwise, conditions for specific properties are ignored.

### Permissions in production

Permissions for roles are defined in the CouchDB database in a document `Config:Permissions`.
Each role must be created in the Keycloak realm also and assigning roles to accounts is managed via Keycloak
(or in app, which makes API calls to Keycloak for you then).

1. use CouchDB Fauxton GUI to edit database documents directly or open the JSON in the app: "Admin > Application Configuration: Edit permissions config"
2. In case some users might have **gained** access to documents to which they did not have access before,
   the app will automatically make an API call to the replication-backend (`POST /admin/clear_local/{db}`)
   to ensure that each client re-checks whether new objects are available for synchronization.
   This should also be used in case an existing user has gotten a new, more powerful role.
   In case a user lost permissions for objects that were already synced, this user's local DB will automatically be
   destroyed and the user has to synchronize all data again.

### Permissions in development

When trying to test out things with the permissions,
the [DemoPermissionGeneratorService](../../Injectable/DemoPermissionGeneratorService.html) can be modified to change the
permission object which is created in the demo data.
These changes should not be committed however, as this demo data is also used in the publicly available demo.

The demo data comes with two user: `demo` and `demo-admin`.
The `demo` user has the role `user_app`, the `demo-admin` has the roles `user_app` and `admin_app`.
The permissions of the latter overwrite the permissions of the former.
