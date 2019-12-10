import { Injectable } from "@angular/core";
import { EntityCache } from "./entity-cache.service";
import { Entity, EntityConstructor } from "../entity";

@Injectable()
export class NonEntityCache extends EntityCache {
    public getEntity<T extends Entity>(entityType: EntityConstructor<T>, id: string): T {
        return new entityType(id);
    }
}
