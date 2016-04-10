import { Injectable } from "angular2/core";
import { Database } from "database";

/**
 * The default generic DataMapper for Entity and any subclass.
 * If necessary, write a specific Mapper for your special Entity subclass.
 */
@Injectable()
export class EntityMapperService {

    constructor(private _db: Database) { }


    find<T>(id: string): T {
        let data = this._db.get(id);
        //TODO: handle "id not found in db" exceptions?

        let result = new T();
        Object.assign(result, data);
        return result;
    }

    save<T>(entity: T): Promise {
        //TODO: how to save "references" of this Entity to other Entities?
        //      e.g. a "Child" may have "FamilyMember"s who are Entity instances of their own and should be saved separatedly in the database
        return this._db.put(entity);
    }

    remove<T>(entity: T): Promise {
        return this._db.remove(entity);
    }
}
