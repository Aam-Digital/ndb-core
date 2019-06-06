# Working with the Database Services

Normally there should be no need to use `Database` (or even `DatabaseManagerService`) anywhere to load/save/remove data from other modules! This is done using the `EntityMapperService` (or a custom MapperService extending `EntityMapperService` for special entity types), which is one layer above the specific database code.

## Example: load and save data in the database

    export class ExampleService {
    
        // get EntityMapperService through Dependency Injection
        constructor(private _entityMapper: EntityMapperService) {  }
    
        getExampleUser() {
            // load requires an instance of the Entity (sub)type as second argument
            this._entityMapper.load<User>("x-user", new User())
                .then(function(userEntity) {
                    // userEntity is an instance of class User containing the information from the database
                    console.info(userEntity);
                })
                .catch(function(error) {
                    if(error.status == 404) {
                        console.info("no record with this _id in database");
                    }
                });
        }
    }
