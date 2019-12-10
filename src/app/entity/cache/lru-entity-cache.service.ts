import { Injectable } from "@angular/core";
import { EntityCache } from "./entity-cache.service";
import { Entity, EntityConstructor } from "../entity";
import LRUCache from "lru-cache";

@Injectable()
export class LRUEntityCache extends EntityCache {
    private cache: LRUCache<String, Entity>;
    constructor() {
        super();
        this.cache = new LRUCache({
            max: 1000,
            maxAge: 60 * 1000,
            dispose: (key: string, entity: Entity) => entity.cacheExpire()
        });
    }

    public getEntity<T extends Entity>(entityType: EntityConstructor<T>, id: string): T {
        const cached = this.cache.get(id);
        if (cached) {
            console.log("cache hit");
            return cached as T;
        }
        const result = new entityType(id);
        this.cache.set(id, result);
        return result;
    }
}
