# Entity Schema

---

The Entity Schema defines details of the properties of an entity type.
We define an entity type and its schema in code through a plain TypeScript class and some custom annotations.
Read more on the background and practical considerations in [How to create a new Entity Type](../how-to-guides/create-a-new-entity-type.html).

An example of a schema definition:

```
@DatabaseEntity('Child') // configures the database prefix to be used by the Schema system
class Note extends Entity {
  @DatabaseField() children: Child[];
  @DatabaseField() text: string = 'default text';
  @DatabaseField() date: Date; // dataType is inferred from the Typescript type
  @DatabaseField({dataType: 'month'}) reportingMonth: Date; // sets a specific dataType how this value will be written to the database
}
```

---

The logical flow looks something like this:

1. Entities are requested through the `EntityMapperService` (`entityMapper.load(...)`)
2. The `EntitySchemaService` functions as a helper to the `EntityMapperService`
   and takes care of data transformations based on the schema of that entity type.
3. Data from the database is "loaded" into an entity instance to combine the raw data
   with its entity class by the `EntityMapperService` together with the `EntitySchemaService`.
4. The entity classes themselves only define the schema through the `@DatabaseEntity` and `@DatabaseField` decorators
   and are otherwise simple Typescript objects.

The process of saving an entity to the database works similarly with `EntitySchemaService`
supporting the `EntityMapperService` and transforming the entity object into the desired format to be persisted into the database.

---

`EntitySchemaService` manages a registry of "data types",
i.e. transformation functions that will be called for a specific schema field's dataType.

Basic data transformations for `string`, `number`, `date` and `month` are supported by default.
You can register your own types by implementing services extending `DefaultDatatype` and
providing these through Angular dependency injection using `multi: true`.

Also see: [How to create a new Datatype](../how-to-guides/create-a-new-datatype.html).

### Schema options

The schema definitions contains information regarding the schema transformation as well as how a property can be displayed.
The [EntitySchemaField](../../interfaces/EntitySchemaField.html) interface shows all configuration options.
If the `editComponent` and the `viewComponent` are not set, the default components of this property's datatype will be used.
The `description` field allows adding further explanation which will be displayed as a tooltip.

## Generic Entity functionalities

### Metadata (created, updated)

Each record automatically holds basic data of timestamp and user who created and last updated the record.
(see `Entity` class)
