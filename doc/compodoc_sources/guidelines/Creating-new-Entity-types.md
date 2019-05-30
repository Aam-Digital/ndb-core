"Entities" are the objects around which our whole system is built. There may for example be User, Child or School classes representing the types of objects the users can view interact with. To extend the system with types, you can create a new module and extend the existing base of the Entity system.

The `EntityModule` specifies the base class and generic functionalities and specific entity types can extend upon it. For an example, have a look at the [UserModule](https://github.com/NGO-DB/ndb-core/tree/master/src/app/user) defining the `User` class that extends `Entity`.



## The `Entity` class
`Entity` and any class extending it are only plain TypeScript classes defining the attributes (and possibly some "business logic" methods). 

The classes should never contain code for saving/deleting or other database related code because we are keeping this separate in an EntityMapper class (see [Data Mapper Pattern](https://en.wikipedia.org/wiki/Data_mapper_pattern)).

To keep them easy to understand and extend the Entity (sub-)classes also shouldn't depend on other components or services - Entity classes are not by themselves part of the Angular system and do not have dependency injection!


## The EntitySchema
The EntitySchema object is defining which attributes of the class will be saved to the database. Attributes not explicitly defined in the Entity sub-type's schema are ignored when the an instance is saved.

As an example look at the User class' schema definition:

    class User extends Entity {
      static schema = Entity.schema.extend({
        'name': 'string',
        'password': 'any',
        'admin': 'boolean'
      });`

Only `user.name`, `user.password` and `user.admin` of an User class instance are save to the database. If you would define other attributes in the class for internal processing without adding them to this schema object, they would not be saved. Also, the data type of the fields are defined and the EntityModule ensures that they are saved and loaded into the correct format.

For more Details see the page about the [EntitySchema System](https://github.com/NGO-DB/ndb-core/wiki/EntitySchema-System).


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

export class Child extends Entity {
  ENTITY_TYPE = 'Child'; // required to preserve type names after minification of code
  static schema = Entity.schema.extend({ // required to define what and how fields are saved to the database
    'name': 'string',
    'gender': 'string',
    'dateOfBirth': 'date',
    'currentStatus': 'any' // the datatype 'any' will keep the field unchanged (e.g. to write a complete object to the db)
  });

  name: String;
  gender: Gender;
  dateOfBirth: Date;
  currentStatus: {
    projectStatus: String;
    socialworker: String;
  };

  age(): number {
     // calculate from this.dateOfBirth
  }

  // Override this to define a human-readable, textual summary of the instance
  toString(): string {
    return this.name + ' (' + this.age() + ')';
  }
}
```


## Overriding data transformation
Usually, the logic defined by the Entity base class should be sufficient to handle transformations (if any) between an entity's properties and the values saved in the database. If you have special requirements how things should be saved in the database, you can override the functions `load(dataObjectFromDatabase)` and `rawData()` however. Make sure to call the base class's implementation using `super.load(data)`/`super.rawData()`:

```
class AttendaneMonth extends Entity {
  // ...
  public load(data: any) {
    if (data.month !== undefined) {
      // make sure it is created as a Date object
      data.month = new Date(data.month);
    }
    return super.load(data);
  }

  public rawData(): any {
    const data = super.rawData();

    delete data.month;
    // save to the database it as a string "YYYY-mm"
    data.month = this.month.getFullYear().toString() + '-' + (this.month.getMonth() + 1).toString();

    return raw;
  }
}
```