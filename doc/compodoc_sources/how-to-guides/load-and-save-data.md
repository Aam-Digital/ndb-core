# How to load and save data

One of the core actions you may need when developing new features is to interact with the database
to load data, create new entities or update existing ones.
We have a few generic services and concepts that help you do this without much overhead.

## Understanding Database and Entities

Depending on the database the app is set up with, the lowest level of persisting data is the [Database](../../classes/Database.html)
that interacts with the browser's storage systems and may also be synced with a remote database.

In our code we have an abstraction layer above the database interactions implemented in the [EntityModule](../../modules/EntityModule.html).
You interact with a database record as an instance of the [Entity](../../classes/Entity.html) class (or one of its sub types).
This way, you can use methods on these entities and benefit from the [EntitySchema System](../concepts/entity-schema.html) for transformations as a kind of ORM.

In you code you simply treat database records as simple TypeScript objects
(instances of an Entity subclass)
and use the [EntityMapperService](../../injectables/EntityMapperService.html) to load and save them.

> Normally you should not use the `Database` class anywhere directly.
> Use the `EntityMapperService` instead, which is one abstraction layer above the specific database code.

## Loading an entity

Use Angular's dependency injection to get the `EntityMapperService` in your code:

```
constructor(private entityMapper: EntityMapperService) {  }
```

You can load an individual entity by its id.
Due to restrictions of TypeScript you have to explicitly pass the Entity (sub)class as the first parameter
so that the EntityMapperService can use it to properly cast the record to the correct Entity type:

```
let user: User;
const userId = '1';
user = await this.entityMapper.load<User>(User, userId);
```

Note that `load()` is asynchronous, so you will need the `await` keyword and deal with the result as a Promise.

This will throw an error (reject the Promise) if no entity with the given id exists in the database.

You can also load all entities of an Entity type at once (e.g. if you want to display a list):

```
let allUsers: User[];
allUsers = await this.entityMapper.loadType<User>(User);
```

## Saving an entity

Similar to the loading of data you can use the EntityMapperService to save a new or updated entity:

```
const userId = '2';
const newUser = new User(userId);
newUser.name = 'Max';
await this.entityMapper.save<User>(newUser);
```

IDs have to be unique for the Entity type,
i.e. if you have a `Child` entity with ID "2" that is not be a problem
but if there already is another `User` entity with this ID in the database `save` will fail.

To update an existing entity you can simply change the object and `save` it again:

```
const user = await this.entityMapper.load<User>(User, '1');
user.name = 'Max';
await this.entityMapper.save<User>(user);
```

In this case the loaded user contains an internal `_rev` property that allows the system to match it with the existing database record
and avoid a conflict, so the updated entity is saved to the database.

You can also force the system to overwrite an existing conflicting database record
(although you probably should only use that if you know what you are doing)
by setting the optional second parameter of `save` to true (`forceUpdate`):

```
await this.entityMapper.save<User>(conflictingUser, true);
```

## Deleting an entity

Deleting an entity is similar to saving
(and the same rules about conflicts apply, so you should delete only entity instances that you actually loaded previously):

```
const user = await this.entityMapper.load<User>(User, '1');
await this.entityMapper.remove<User>(user);
```
