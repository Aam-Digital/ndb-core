"Entities" are the objects around which our whole system is built. There may for example be User, Child or School classes representing the types of objects the users can view interact with. To extend the system with types, you can create a new module and extend the existing base of the Entity system.

The `EntityModule` specifies the base class and generic features, specific entity types can extend upon it.
For an example, have a look at the [UserModule](https://github.com/NGO-DB/ndb-core/tree/master/src/app/user) defining the `User` class that extends `Entity`.



## The `Entity` class
`Entity` and any class extending it are only plain TypeScript classes defining the attributes (and possibly some "business logic" methods). 

The classes should never contain code for saving/deleting or other database related code because we are keeping this separate in an EntityMapper class (see [Data Mapper Pattern](https://en.wikipedia.org/wiki/Data_mapper_pattern)).

To keep them easy to understand and extend the Entity (sub-)classes also shouldn't depend on other components or services - Entity classes are not by themselves part of the Angular system and do not have dependency injection!


## The EntitySchema
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
For more details see the docs about the [EntitySchema System](https://github.com/NGO-DB/ndb-core/wiki/EntitySchema-System).


## Other components to be implemented for a new sub-type
The following components are related to display an Entity sub-type and currently implemented for each new sub-type as Angular components:
* `EntityService`: (optional?) provides methods to get the Entity's objects from the database
* `EntityDetailsComponent`: displays all attributes of one of the Entity's objects to the user
* `EntityListComponent`: displays a list of all the Entity's objects
* `EntityBlockComponent`: displays a small, inline representation of one of the Entity's objects for use in other components



## Example: Creating a new Entity sub-type

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
