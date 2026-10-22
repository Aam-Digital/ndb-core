# Database: queries, indices and local storage

The `EntityMapperService` gives you an easy way to access
all entities of an Entity type or an individual entity by its ID (see [Loading, saving and deleting data](../entity/README.md#loading-saving-and-deleting-data) for these basics).
However, for more advance features this will not be enough and you may need more powerful ways to load certain data.
This is where (persistent) queries come into play.

> The easiest workaround to get a specific set of entities is to load all entities of that type using the EntityMapperService
> and then just use standard JavaScript/TypeScript to select the required entities.
> With larger databases this is hitting its limitations however.

## PouchDB Queries

Our application is to some extent coupled with PouchDB/CouchDB.
As queries and database indexing is closely related to the underlying database this feature (at the moment)
directly refers to the underlying PouchDB feature.

Please read through the PouchDB documentation referring to map/reduce queries:
<https://pouchdb.com/guides/queries.html>

## Creating a persistent query / database index

Before you can use `query` to load specific data you have to create the related "design document" for it in the PouchDB.

To do this, create a design document object according to the PouchDB documentation
and then use `saveDatabaseIndex` on the `Database` service:

```
constructor(private db: Database) {}

private createQueryIndex() {
 const designDoc = {
   _id: '_design/my_index',
   views: {
     by_child: {
       map: `(doc) => {
         if (!doc._id.startsWith("${ChildSchoolRelation.ENTITY_TYPE}")) return;
         emit(doc.childId);
         }`,
     },
   },
 };
 this.db.saveDatabaseIndex(designDoc);
}
```

This is one of the rare cases where you will need to inject `Database` directly rather than only interacting with `EntityMapperService`.

Beware, unfortunately the `map:` function has to be a string containing the javascript function (to prevent the build optimization from messing this up).

## Loading data through a query

After following above steps to `saveDatabaseIndex` that query is now available in the database.

You can now use this query to load data through its query id,
which is combined from the design document `_id` (without the "\_design/" prefix) and the `views` key:

```
const result = await this.db.query('my_index/by_child', {key: childId, include_docs: true});
```

Also note the additional options parameter with a `key` (the "search value") and `include_docs` set to true.
The `query` function is a direct wrapper for PouchDB's `query` function, please refer to their docs for details.

As the query result is not automatically parsed by our EntityMapperService you have to map them manually:

```
let resultEntities: Note[];
resultEntities = result.rows.map(loadedRow => {
    const entity = new Note('');
    this.entitySchemaService.loadDataIntoEntity(entity, loadedRow.doc);
    return entity;
});
```

## Local database: PouchDB adapter and migration

In synced mode (`session_type: "synced"`) each user's data is stored in a local PouchDB in the browser's IndexedDB.
By default this uses PouchDB's newer `indexeddb` adapter, with database names based on the user's Keycloak UUID
(`<uuid>-app`, `<uuid>-notifications`, see `db-name-helpers.ts`).
Older installations used the legacy `idb` adapter with username-based names (`<username>-app`, `notifications_<uuid>`).

The environment flag `use_indexeddb_adapter` (default `true`) controls this.
A deployment can opt out and keep the legacy adapter by setting `"use_indexeddb_adapter": false` in its `assets/config.json`,
which overrides the values of `environment.ts` at startup (see `bootstrap-environment.ts`).

`IndexeddbMigrationService.resolveDbConfig()` decides at login which database to open, and tracks the scenario as a usage analytics event (category `indexeddb_adapter_migration`):

| Scenario                                          | Database opened                     | Analytics event                 |
| ------------------------------------------------- | ----------------------------------- | ------------------------------- |
| flag disabled                                     | legacy names, `idb`                 | `idb_indexeddb-disabled-config` |
| no legacy database for this user (fresh install)  | new names, `indexeddb`              | `indexeddb_fresh-install`       |
| migration completed before (`DB_MIGRATED_<uuid>`) | new names, `indexeddb`              | `indexeddb_after-migration`     |
| legacy database exists, not migrated yet          | legacy names, `idb` (migration due) | `idb_migration-pending`         |

For an existing user, the migration does not copy the local database. It runs in the background while the user keeps working on the old database:

1. If online, `runBackgroundMigration()` replicates the "app" database from the server into the new local database.
   The old database keeps syncing as usual.
2. When both this replication and the old database's sync have completed, the user is asked to reload.
3. Only when the user confirms, a final sync pushes all local changes of the old database to the server,
   while a modal progress dialog keeps the user from making further changes.
   If that succeeds, the `DB_MIGRATED_<uuid>` flag is set in `localStorage` and the app reloads into the new database,
   whose regular sync then also pulls those last changes from the server.

The app therefore does not switch away from a database that still holds unsynced changes
(except changes the server rejects, e.g. for lack of permission, and changes made in another tab still open on the old database while offline).
If anything fails (offline, replication error, failed final sync) or the user postpones the reload, the flag stays unset,
the app keeps using the old database, and the migration is retried on the next app start, continuing from its replication checkpoint.
Failures are tracked as the analytics events `migration_replication-failed` and `migration_final-sync-failed`, a postponed reload as `migration_reload-postponed`.
A failed replication is also reported as a warning to remote logging (e.g. a storage quota exceeded on the device), unless the device was offline or the session expired; a failed final sync is reported by the sync itself.

The notifications database is not migrated: after the switch it is synced from the server into a new database.
The legacy databases are not deleted yet (`cleanupLegacyDatabases()` is not called), so until then the device stores the data twice.

Online-only mode (`session_type: "online"`) has no local database and is not affected.
In demo mode (`session_type: "mock"`) the database is in-memory whatever adapter the config resolves to,
so `DatabaseResolverService.isIndexedDbAdapterSupported()` checks the adapter the database actually runs on.

## Key files

- `database.ts` — the abstract `Database` service, including `query()` and `saveDatabaseIndex()`
- `database-resolver.service.ts` — opens the databases of the current session
- `indexeddb-migration.service.ts` — chooses the local database's adapter and names, and migrates from the legacy `idb` adapter
- `db-name-helpers.ts` — the new and the legacy names of the local databases
- `pouchdb/pouch-database.ts` — `PouchDatabase`, the PouchDB-backed implementation
- `query-data-source.ts` — data source that runs a query and exposes its results
- `../entity/schema/entity-schema.service.ts` — `loadDataIntoEntity()` used to turn raw query rows into entity instances
