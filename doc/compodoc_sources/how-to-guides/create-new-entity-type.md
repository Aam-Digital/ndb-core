# How to create a new Entity Type
"Entities" are the objects around which our whole system is built.
Entity types specify a data structure for records in the case management system,
defining both the data object as well as some details how the records are displayed in the UI to users.
There may for example be User, Child or School classes representing the types of objects the users can view in lists and detail forms and interact with.

To adapt the platform to a certain use case, you usually want to adapt entity types or create new ones.
This defines what fields users can see and edit in forms, among other things.

There are two approaches to define entity types:
- at runtime in the config file
- at build time in the code

Unless you have special requirements and write further code specifically for your entity type, 
you usually should rely on the more flexible and easy approach defining them in the config. 


## Defining a custom Entity type only through config
For general details about the configuration system, have a look at [Concepts / Configuration](../concepts/configuration.html).
The configuration allows you to customize an Aam Digital instance at runtime without changes to the code base.
A key part of that is extending existing entity types and defining additional ones.

To configure an entity type, edit the config document in your database (`_id: "Config:CONFIG_ENTITY"`)
and add a section with id `"entity:MyEntityType"`.
"entity:" serves as a prefix for any config section that updates or creates an entity type, follow by the name of the type.

Within that section, you can define attributes (i.e. properties = form fields)
as well as some general ("static") details of the entity type.
All options are described here: [Concepts / Configuration -> Entity](../concepts/configuration.html).

For example, an entry in the config file for a new entity type could look like this:
```
"entity:MyEntity": {
    "label": "My Entity", // used for titles in the UI
    "labelPlural": "My Entities",
    "toStringAttributes": ["firstname", "lastname"], // used when an entity is displayed as a reference/link
    "attributes": [
        {"name": "name", "schema": { "dataType": "string", "label": "name" } },
        {"name": "remarks", "schema": { "dataType": "string", "label": "Further remarks", "editComponent": "EditLongText" } },
    ]
}
```

The [config-fix.ts](https://github.com/Aam-Digital/ndb-core/blob/master/src/app/core/config/config-fix.ts) in the repository is an example and demo configuration from which you can copy parts of configuration definitions also.


---
## Creating a custom Entity type in code 
To extend the system with types, you can create a new module and extend the existing base class of the Entity system.
This is something you would only do if you are also implementing special components or services in the code base to handle this entity type.
Otherwise, it is easier and more flexible to define an entity type through the config system only, as shown above.

The [EntityModule](../../modules/EntityModule.html) specifies the base class and generic features, specific entity types can extend upon it.
For an example, have a look at the [User](../../classes/User.html#source) class that extends `Entity`.

### The `Entity` class
`Entity` and any class extending it are only plain TypeScript classes defining the attributes (and possibly some "business logic" methods).

The classes should never contain code for saving/deleting or other database related code because we are keeping this separate in an EntityMapper class (see [Data Mapper Pattern](https://en.wikipedia.org/wiki/Data_mapper_pattern)).

To keep them easy to understand and extend the Entity (sub-)classes also shouldn't depend on other components or services - Entity classes are not by themselves part of the Angular system and do not have dependency injection!


### The EntitySchema
The EntitySchema object is defining which attributes of the class will be saved to the database.
Attributes not explicitly defined in the Entity sub-type's schema are ignored when an instance is saved.

You must annotate your Entity class with the `@DatabaseEntity('ENTITY_TYPE')` decorator
thereby defining a database prefix for your Entity type.

Any properties that you want to be persisted in the database when saving entities of this type
must have the `@DatabaseField()` decorator.
Any other properties are ignored and will be lost after saving and loading an entity of this type.
As an example look at this class' schema definition:

    @DatabaseEntity('Dummy')
    class Dummy extends Entity {
      @DatabaseField() name: string;
      @DatabaseField() size: number = 1;
      @DatabaseField({dataType: 'month'}) month: Date;
      temp: string = 'foo';
    }

Only `dummy.name`, `dummy.size` and `dummy.month` of a Dummy class instance are saved to the database.
The `dummy.temp` property is available for internal processing but will be ignored when saving the entity to the database.

You can also set additional options for DatabaseFields and implement your own data transformations.
For more details see the concept of the [EntitySchema System](../concepts/entity-schema.html).


### Other components to be implemented for a new sub-type
The following components are related to display an Entity sub-type and currently implemented for each new sub-type as Angular components:
* `EntityDetailsComponent`: displays all attributes of one of the Entity's objects to the user
* `EntityListComponent`: displays a list of all the Entity's objects
* `EntityBlockComponent`: displays a small, inline representation of one of the Entity's objects for use in other components



### Example: Creating a new Entity sub-type

```
import { Entity } from '../entity/entity';
import { Gender} from './Gender';

@DatabaseEntity('Child')
export class Child extends Entity {
  @DatabaseField() name: string;
  @DatabaseField({dataType: 'string'}) gender: Gender;
  @DatabaseField() dateOfBirth: Date;
  @DatabaseField() marks: [];

  age(): number {
     // calculate from this.dateOfBirth
  }

  // Override this to define a human-readable, textual summary of the instance
  toString(): string {
    return this.name + ' (' + this.age() + ')';
  }
}
```
