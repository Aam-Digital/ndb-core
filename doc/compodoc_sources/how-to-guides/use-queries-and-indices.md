# How to use queries and indices to get data

The [EntityMapperService](../../injectables/EntityMapperService.html) gives you an easy way to access
all entities of an Entity type or an individual entity by its ID (see [Load and Save Data](load-and-save-data.html) for these basics).
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
https://pouchdb.com/guides/queries.html

## Creating a persistent query / database index

Before you can use `query` to load specific data you have to create the related "design document" for it in the PouchDB.

To do this, create a design document object according to the PouchDB documentation
and then use `saveDatabaseIndex` on the [Database](../../classes/Database.html) service:

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
