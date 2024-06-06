import { Injectable } from "@angular/core";
import { EntityMapperService } from "../entity/entity-mapper/entity-mapper.service";
import { Entity } from "../entity/model/entity";

/**
 * Find (possibly) duplicate entities or otherwise similar records.
 *
 * This service can for example be used to support de-duplication actions
 * or give users options to link existing entities instead of creating a new one.
 */
@Injectable({
  providedIn: "root",
})
export class EntityDuplicatesService {
  constructor(private entityMapper: EntityMapperService) {}

  getSimilarEntities<E extends Entity>(
    entity: E,
    filterValues: any,
  ): Promise<E[]> {
    return this.entityMapper.loadType(entity.getType());
  }
}
