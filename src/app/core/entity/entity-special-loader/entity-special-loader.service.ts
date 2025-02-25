import { Injectable } from "@angular/core";
import { Entity } from "../model/entity";
import { ChildrenService } from "../../../child-dev-project/children/children.service";
import { HistoricalDataService } from "./historical-data/historical-data.service";
import { UpdatedEntity } from "../model/entity-update";

export enum LoaderMethod {
  ChildrenService = "ChildrenService",
  HistoricalDataService = "HistoricalDataService",
}

/**
 * Load data in a specially combined or indexed way as an alternative to the simple EntityMapperService.
 *
 * This service might be refactored or removed when generic configurable indexes are implemented (#581, #262)
 */
@Injectable({
  providedIn: "root",
})
export class EntitySpecialLoaderService {
  constructor(
    private childrenService: ChildrenService,
    private historicalDataService: HistoricalDataService,
  ) {}

  loadData<E extends Entity = Entity>(
    loaderMethod: LoaderMethod,
  ): Promise<E[]> {
    if (loaderMethod === LoaderMethod.ChildrenService) {
      return this.childrenService.getChildren() as Promise<E[]>;
    }
  }

  async extendUpdatedEntity<T extends Entity = Entity>(
    loaderMethod: LoaderMethod,
    updatedEntity: UpdatedEntity<T>,
  ): Promise<UpdatedEntity<T>> {
    if (loaderMethod === LoaderMethod.ChildrenService) {
      updatedEntity.entity = (await this.childrenService.getChild(
        updatedEntity.entity.getId(),
      )) as T;
    }
    return updatedEntity;
  }

  async loadDataFor<E extends Entity = Entity>(
    loaderMethod: LoaderMethod,
    entity: Entity,
  ): Promise<E[]> {
    if (loaderMethod === LoaderMethod.HistoricalDataService) {
      return this.historicalDataService.getHistoricalDataFor(
        entity.getId(),
      ) as Promise<E[]>;
    }
  }
}
