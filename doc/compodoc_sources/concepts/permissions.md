# Permissions
Aam Digital allows to specify permissions on the various entity types.
Permissions are defined using the [CASL JSON syntax](https://casl.js.org/v5/en/guide/define-rules#the-shape-of-raw-rule).
The permissions are stored in the [Permission class](../../classes/Permission.html) which is persisted together with other entities in the database.

## Permission structure
As an example, we will define a permission object which allows users with the role `user_app` *not* to *create*, *read*, *update* and *delete* `HealthCheck` entities and *not* *create* and *delete* `School` and `Child` entities.
Besides that, the role should be allowed to do everthing.
A second role `admin_app` should be allowed to do everything.

```JSON
{
  "_id": "Permission:PERMISSION_ENTITY",
  "rulesConfig": {
    "user_app": [
      { "subject":  "all", "action": "manage" },
      { "subject":  "HealthCheck", "action": "manage", "inverted": true },
      { "subject":  ["School", "Child"], "action": ["create", "delete"], "inverted": true }
    ],
    "admin_app": [
      { "subject":  "all", "action": "manage" }
    ]
  }
}
```
The `_id` property needs to be exactly as displayed here, as there is only one permission object allowed in a single database.
In `rulesConfig`, the permissions for each of the user role are defined.
In this example we have permissions defined for two roles: `user_app` and `admin_app`.
The permissions for a given role consist of an array of rules.
In case of the `user_app`, we first define that the user is allowed to do everything.
`subject` refers to the type of entity and `all` is a wildcard, that matches any entity.
`action` refers to the operation that is allowed or permitted on the given `subject`.
In this case `manage` is also a wildcard which means *any operation is allowed*.
So the first rule states *any operation is allowed on any entity*.
The second and third rule for `user_app` restrict this through the `"inverted": true` keyword.
While the first rule defined what this role is **allowed** to do, when `"inverted": true` is specified, this rule defines what the role is **not allowed** to do.
This allows us to easily take permissions away from a certain role.
In this case we don't allow users with this role to perform *any* operation on the `HealhCheck` entity and no *create* and *update* on `Child` and `School` entities.
Other possible actions are `read` and `update` following the *CRUD* concept.
The `admin_app` role simpy allows user with this role to do everything, without restrictions.

To learn more about how to define rules, have a look at the [CASL documentation](https://casl.js.org/v5/en/guide/define-rules#rules).

## Permissions in the app
This section is about specifying permissions the read and edit **entities** if you want to change the menu items which are shown in the navigation bar have a look at the *views* section in the [Configuration Guide](./configuration.html).

The permission object is automatically fetched whenever a user logs in.
The permissions disable certain buttons based on the users overall permissions.
This is done in the app through the [DisableEntityOperationDirective](../../directives/DisableEntityOperationDirective.html), which connects certain buttons with their operation.

As an example lets say we have a class variable called `note` which holds an object of the `Note` entity and we want to create a button which allows to *edit* this note.
In the HTML template we could write the following in order to automatically connect it to the permission system.

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
This will automatically disable the button if the user is not allowed to *update* this specific note.

To check permissions inside a `*.ts` file, you can inject the `EntityAbility` like the following:

```typescript
import { Note } from "./note";
import { Injectable } from "@angular/core";
import { EntityAbility } from "./permission-types";

@Injectable()
export class SomeService {
  constructor(private ability: EntityAbility) {
    if (this.ability.can('create', Note)) {
      // I have permissions to create notes
      const note = new Note();
    } else {
      // I don't have permissions to create notes
      throw Error("Missing permissions");
    }
  }
}
```
In this example the `EntityAbility` service is used to check whether the currently logged in user is allowed to _create_ new objects of the `Note` entity.
In this case a constructor is provided to check for the permissions, in other cases it might make more sense to use a instance of an object like `this.ability.can('read', new Note())`.

## Permissions in production
As permissions cannot directly be created and edited from within the app, the CouchDB Fauxton interface should be used to define permissions in production.
Just look for or create the document with `"_id": "Permission:PERMISSION_ENTITY"` and define the permissions as described above.
After saving the new permissions the Swagger UI of the replication backend should be visited to notify it about the updated permissions.
Simply visit the url `https://<org>.aam-digital.com/db/api/`.
There in `Servers` you have to select `/db deployed`, use the admin credentials in the `POST /_session` endpoint to gain a access token and then trigger the `POST /rules/reload` endpoint.
If successful, the response will show the newly fetched rules.
In case some users might have **gained** access to objects to which they did not have access before, also trigger the `POST /clear_local` endpoint.
The `/clear_local` endpoint will ensure that each client re-checks whether new objects are available for synchronization.
This should also be used in case an existing user has gotten a new, more powerful role.
In case a user lost permissions for objects that were already synced, this users local DB will automatically be destroyed and the user has to synchronize all data again.
The roles are specified in the user documents in the `_users` database inside the CouchDB.

## Permissions in development
When trying to test out things with the permissions, the [DemoPermissionGeneratorService](../../Injectable/DemoPermissionGeneratorService.html) can be modified to change the permission object which is created in the demo data.
These changes should not be committed however, as this demo data is also used in the publicly available demo.
The demo data comes with two user: `demo` and `demo-admin`.
The `demo` user has the role `user_app`, the `demo-admin` has the roles `user_app` and `admin_app`.
The permissions of the latter overwrite the permissions of the former.
