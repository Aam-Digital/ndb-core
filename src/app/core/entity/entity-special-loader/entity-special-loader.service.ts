import { Injectable } from "@angular/core";
import { Entity } from "../model/entity";
import { ChildrenService } from "../../../child-dev-project/children/children.service";

export enum LoaderMethod {
  ChildrenService = "ChildrenService",
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
  constructor(private childrenService: ChildrenService) {}

  async loadData(loaderMethod: LoaderMethod): Promise<Entity[]> {
    if (loaderMethod === LoaderMethod.ChildrenService) {
      return this.childrenService.getChildren();
    }
  }
}
