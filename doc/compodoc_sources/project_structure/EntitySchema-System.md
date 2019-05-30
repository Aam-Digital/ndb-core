> THIS DOCUMENT IS STILL WORK IN PROGRESS AND WILL BE CONTINUOUSLY UPDATED AS THE DESIGN OF THE SYSTEM EVOLVES

-----

An example of a schema definition:

```
class Note extends Entity {
  static schema = {
    children: "Entity[]", // instead of the whole objects, only their id will be written into the database for "Entity" type fields; "[]" indicates this is an array of values
    text: "string=to do", // "=to do" defines a default value in case the field is not defined
    date: "date*", // "*" indicates that there will be an index on this field
  }

  children: Child[];
  text: string;
  date: string;
}
```


-----

The logical flow looks something like this:

![entityschema_load](https://user-images.githubusercontent.com/1682541/54995579-4cf93f00-4fc7-11e9-8b75-ee3f7efea79f.png)

1. Entities are requested through the EntityMapper as before (`entityMapper.load(...)`)
2. Data from the database is "loaded" into an Entity instance to combine the raw data with the class (`resultEntity.load(data)`)
3. `Entity.load()` uses the schema defined statically for its Entity class to transform and filter the raw data while loading it into the attributes. (`Entity.schema.transformDatabaseToEntityFormat(...)`).

The process of saving an Entity to the database works similarly through `entity.rawData()` doing filtering and transformation of data with `EntitySchema.trasnformEntityToDatabaseFormat()`. This can for example replace a full object with it's reference id before writing it to the database.
![entityschema_save](https://user-images.githubusercontent.com/1682541/55015106-87c19e00-4fec-11e9-871d-fba1eec407a4.png)



-----



1. Each Entity type (e.g. `Child`, `School`, ...) needs to be registered initially at `EntityMapperService.registerEntityType(Entity)`. This can be done in the related Module's constructor, to be called when a Module is initially imported by Angular so that the EntityType is always registered automatically before it can be used.
2. EntityMapperService keeps a registry of Entity types. Therefore we don't need to pass the constructor of the type into the load method anymore (type can be inferred from the id prefix or passed in explicitly); i.e. `entityMapper.load<Child>(childId)` instead of the current `entityMapper.load<Child>(Child, childId)`

The explicit registering of types is necessary because somewhere down the line we need the Database from Angular's dependency injection on startup to be able to create indices.


TODO: Lazy loading of linked entities?