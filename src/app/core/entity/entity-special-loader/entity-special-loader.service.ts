import { inject, Injectable } from "@angular/core";
import { Entity } from "../model/entity";
import { DataFilter } from "../../filter/filters/filters";
import { EntityPage } from "../entity-mapper/entity-mapper.service";
import { ChildrenService } from "../../../child-dev-project/children/children.service";
import { HistoricalDataService } from "./historical-data/historical-data.service";
import { UpdatedEntity } from "../model/entity-update";
import { Logging } from "../../logging/logging.service";
import { TodoService } from "#src/app/features/todos/todo.service";
import { AuditReferenceLoaderService } from "#src/app/features/change-history/audit-reference-loader.service";

export enum LoaderMethod {
  ChildrenService = "ChildrenService",
  /** audit records that involve one given record, served by a CouchDB view */
  AuditRecordsRelatedToEntity = "AuditRecordsRelatedToEntity",
  HistoricalDataService = "HistoricalDataService",
  ChildrenServiceQueryRelations = "ChildrenServiceQueryRelations",
  NotesRelatedToEntity = "NotesRelatedToEntity",
  TodosRelatedToEntity = "TodosRelatedToEntity",
}

/**
 * Whether this loader can serve one page at a time.
 *
 * The others load everything they have in a single call, so a list using them
 * has to page in memory. A plain function so the data-source resolver can ask
 * without injecting the service.
 */
export function supportsPagination(loaderMethod?: LoaderMethod): boolean {
  return loaderMethod === LoaderMethod.AuditRecordsRelatedToEntity;
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
  private readonly childrenService = inject(ChildrenService);
  private readonly historicalDataService = inject(HistoricalDataService);
  private readonly todoService = inject(TodoService);
  private readonly auditReferenceLoader = inject(AuditReferenceLoaderService);

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

  /**
   * Load one page of the records this loader serves for the given entity.
   *
   * Only for loaders {@link supportsPagination} reports: the rest have no notion
   * of a page and return everything through {@link loadDataFor}.
   */
  loadPageFor<E extends Entity = Entity>(
    loaderMethod: LoaderMethod,
    forEntity: Entity,
    filter: DataFilter<E>,
    page: { limit: number; bookmark?: string },
  ): Promise<EntityPage<E>> {
    switch (loaderMethod) {
      case LoaderMethod.AuditRecordsRelatedToEntity:
        return this.auditReferenceLoader.loadPageFor(
          forEntity,
          filter,
          page,
        ) as unknown as Promise<EntityPage<E>>;
      default:
        throw new Error(`${loaderMethod} does not serve pages`);
    }
  }

  /**
   * @param property the property of the loaded entity type that links to the given entity,
   *        or several candidates if it cannot be determined unambiguously.
   *        Each loader decides for itself whether and how it needs this.
   */
  loadDataFor<E extends Entity = Entity>(
    loaderMethod: LoaderMethod,
    entity: Entity,
    property?: string | string[],
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
      case LoaderMethod.NotesRelatedToEntity:
        return this.childrenService.getNotesRelatedTo(
          entity.getId(),
        ) as unknown as Promise<E[]>;
      case LoaderMethod.TodosRelatedToEntity:
        return this.todoService.getTodosFor(
          entity,
          property,
        ) as unknown as Promise<E[]>;
    }
  }
}
