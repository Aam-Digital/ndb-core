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

In synced mode, each user's data is stored in a local PouchDB.
By default it uses PouchDB's `indexeddb` adapter, with database names based on the user's Keycloak UUID (`<uuid>-app`).
Older installations used the legacy `idb` adapter with username-based names.
A deployment can keep the legacy adapter with `"use_indexeddb_adapter": false` in its `assets/config.json`.

Existing users are migrated automatically (`IndexeddbMigrationService`):
the data is downloaded from the server into the new database in the background, then the user is asked to reload.
The app only switches after a final sync of the old database has succeeded, so no unsynced changes are left behind;
otherwise it keeps the old database and retries on the next start.
The migration is tracked as usage analytics events (category `indexeddb_adapter_migration`).
The legacy databases are not deleted yet ([#4570](https://github.com/Aam-Digital/ndb-core/issues/4570)).

## Key files

- `database.ts` — the abstract `Database` service, including `query()` and `saveDatabaseIndex()`
- `database-resolver.service.ts` — opens the databases of the current session
- `indexeddb-migration.service.ts` — chooses the local database's adapter and names, and migrates from the legacy `idb` adapter
- `db-name-helpers.ts` — the new and the legacy names of the local databases
- `pouchdb/pouch-database.ts` — `PouchDatabase`, the PouchDB-backed implementation
- `query-data-source.ts` — data source that runs a query and exposes its results
- `../entity/schema/entity-schema.service.ts` — `loadDataIntoEntity()` used to turn raw query rows into entity instances
