# Entity Schema

The Entity Schema defines details of the properties of an entity type.
We define an entity type and its schema in code through a plain TypeScript class and some custom annotations.
See the _Create a New Entity Type_ how-to guide for background and practical considerations.

An example of a schema definition:

```ts
@DatabaseEntity("Child") // configures the database prefix to be used by the Schema system
class Note extends Entity {
  @DatabaseField() children: Child[];
  @DatabaseField() text: string = "default text";
  @DatabaseField() date: Date; // dataType is inferred from the TypeScript type
  @DatabaseField({ dataType: "month" }) reportingMonth: Date; // sets a specific dataType how this value will be written to the database
}
```

The logical flow looks something like this:

1. Entities are requested through the `EntityMapperService` (`entityMapper.load(...)`)
2. The `EntitySchemaService` functions as a helper to the `EntityMapperService`
   and takes care of data transformations based on the schema of that entity type.
3. Data from the database is "loaded" into an entity instance to combine the raw data
   with its entity class by the `EntityMapperService` together with the `EntitySchemaService`.
4. The entity classes themselves only define the schema through the `@DatabaseEntity` and `@DatabaseField` decorators
   and are otherwise simple TypeScript objects.

The process of saving an entity to the database works similarly with `EntitySchemaService`
supporting the `EntityMapperService` and transforming the entity object into the desired format to be persisted into the database.

`EntitySchemaService` manages a registry of "data types",
i.e. transformation functions that will be called for a specific schema field's dataType.

Basic data transformations for `string`, `number`, `date` and `month` are supported by default.
You can register your own types by implementing services extending `DefaultDatatype` and
providing these through Angular dependency injection using `multi: true`.
Also see [Create a New Datatype](../../basic-datatypes/README.md).

### Schema options

The schema definitions contain information regarding the schema transformation as well as how a property can be displayed.
The `EntitySchemaField` interface (`entity-schema-field.ts`) shows all configuration options.
If the `editComponent` and the `viewComponent` are not set, the default components of this property's datatype will be used.
The `description` field allows adding further explanation which will be displayed as a tooltip.

## Generic Entity functionalities

### Metadata (created, updated)

Each record automatically holds basic data of timestamp and user who created and last updated the record
(see the `Entity` base class in `../model/entity.ts`).

## Key files

- `entity-schema.service.ts` — `EntitySchemaService`, runs dataType transformations when loading/saving entities
- `entity-schema-field.ts` — `EntitySchemaField` interface, all per-field schema options (`dataType`, `label`, `editComponent`, `anonymize`, …)
- `entity-schema.ts` — `EntitySchema`, the map of field id → field config for an entity type
- `../database-field.decorator.ts` — `@DatabaseField()` registers a property in the schema
- `../database-entity.decorator.ts` — `@DatabaseEntity()` registers the entity type and its DB prefix
- `../default-datatype/default.datatype.ts` — `DefaultDatatype`, base class for dataType transformations
- `../entity-mapper/entity-mapper.service.ts` — `EntityMapperService`, public API to load/save entities
