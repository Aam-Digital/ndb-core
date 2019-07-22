> THIS DOCUMENT IS STILL WORK IN PROGRESS AND WILL BE CONTINUOUSLY UPDATED AS THE DESIGN OF THE SYSTEM EVOLVES

-----

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


-----

The logical flow looks something like this:
1. Entities are requested through the `EntityMapperService` (`entityMapper.load(...)`)
2. The `EntitySchemaService` functions as a helper to the `EntityMapperService` 
and takes care of data transformations based on the schema of that Entity type.
3. Data from the database is "loaded" into an Entity instance to combine the raw data
with its Entity class by the `EntityMapperService` together with the `EntitySchemaService`.
4. The Entity classes themselves only define the schema through the `@DatabaseEntity` and `@DatabaseField` decorators
and are otherwise simple Typescript objects.

The process of saving an Entity to the database works similarly with `EntitySchemaService`
supporting the `EntityMapperService` and transforming the entity object into the desired format to be persisted into the database.


-----



`EntitySchemaService` keeps a registry of "data types",
i.e. transformation functions that will be called for a specific schema field's dataType.

Basic data transformations for `string`, `number`, `date` and `month` are supported by default.
You can register your own transformations by injecting the `EntitySchemaService` and using its `registerSchemaDatatype()` method.
