import { Injectable } from "@angular/core";

import { Database } from "./database";
import { Entity } from "../model/entity";

/**
 * The default generic DataMapper for Entity and any subclass.
 * If necessary, write a specific Mapper for your special Entity subclass.
 */
@Injectable()
export class EntityMapperService {

    constructor(private _db: Database) { }


    /**
     * Loads an Entity from the database into the given resultEntity instance.
     * @param id The _id of the object in the database. If id doesn't start with the Entity type's prefix it will be added.
     * @param resultEntity An (empty) instance of an Entity class. (This is necessary because TypeScript generic types are not available at runtime.)
     * @returns A Promise containing the resultEntity filled with its data.
     */
    public load<T extends Entity>(id: string, resultEntity: T): Promise<T> {
        if(!id.startsWith(resultEntity.getPrefix())) {
            id = resultEntity.getPrefix() + id;
        }

        return this._db.get(id).then(
            function(result) {
                Object.assign(resultEntity, result);
                return resultEntity;
            },
            function(error) {
                throw error;
            }
        );
    }

    public save<T extends Entity>(entity:T):Promise<any> {
        //TODO: how to save "references" of this Entity to other Entities?
        //      e.g. a "Child" may have "FamilyMember"s who are Entity instances of their own and should be saved separatedly in the database
        return this._db.put(entity);
    }

    public remove<T extends Entity>(entity:T):Promise<any> {
        return this._db.remove(entity);
    }
}
