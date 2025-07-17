import { Injectable, inject } from "@angular/core";
import { Entity } from "../model/entity";
import { ChildrenService } from "../../../child-dev-project/children/children.service";
import { HistoricalDataService } from "./historical-data/historical-data.service";
import { UpdatedEntity } from "../model/entity-update";
import { Logging } from "../../logging/logging.service";

export enum LoaderMethod {
  ChildrenService = "ChildrenService",
  HistoricalDataService = "HistoricalDataService",
  ChildrenServiceQueryRelations = "ChildrenServiceQueryRelations",
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
  private childrenService = inject(ChildrenService);
  private historicalDataService = inject(HistoricalDataService);

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
    if (updatedEntity.type === "remove") {
      // deleted entities cannot be loaded and enhanced, the stub in updatedEntity is enough
      return updatedEntity;
    }

    if (loaderMethod === LoaderMethod.ChildrenService) {
      updatedEntity.entity = (await this.childrenService
        .getChild(updatedEntity.entity.getId())
        .catch((error) => {
          Logging.debug(
            "Failed to load special entity for extendUpdatedEntity",
            error,
            updatedEntity.entity,
          );
          return updatedEntity.entity;
        })) as T;
    }
    return updatedEntity;
  }

  async loadDataFor<E extends Entity = Entity>(
    loaderMethod: LoaderMethod,
    entity: Entity,
  ): Promise<E[]> {
    switch (loaderMethod) {
      case LoaderMethod.HistoricalDataService:
        return this.historicalDataService.getHistoricalDataFor(
          entity.getId(),
        ) as Promise<E[]>;
      case LoaderMethod.ChildrenServiceQueryRelations:
        return this.childrenService.queryRelations(
          entity.getId(false),
        ) as unknown as Promise<E[]>;
    }
  }
}
