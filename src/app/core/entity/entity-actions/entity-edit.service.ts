import { Injectable } from "@angular/core";
import { EntityMapperService } from "../entity-mapper/entity-mapper.service";
import { Entity } from "../model/entity";
import { EntitySchemaService } from "../schema/entity-schema.service";
import {
  CascadingEntityAction,
} from "./cascading-entity-action";
import { UnsavedChangesService } from "app/core/entity-details/form/unsaved-changes.service";

/**
 * Safely delete an entity including handling references with related entities.
 * This service is usually used in combination with the `EntityActionsService`, which provides user confirmation processes around this.
 */
@Injectable({
  providedIn: "root",
})
export class EntityEditService extends CascadingEntityAction {
  constructor(
    protected override entityMapper: EntityMapperService,
    protected override schemaService: EntitySchemaService,
    private unsavedChanges: UnsavedChangesService,
  ) {
    super(entityMapper, schemaService);
  }

// Define the generic `E extends Entity` here
async editEntity<E extends Entity>(
  result: any,
  entityParam: E | E[]
): Promise<{success: boolean, originalEntities: E[], newEntities: E[]}> {
  if (result) {
    let originalEntities: E[] = Array.isArray(entityParam)
      ? entityParam
      : [entityParam];
    const newEntities: E[] = originalEntities.map((e) => e.copy());

    for (const e of newEntities) {
      e[result.selectedField] = result.label;
      await this.entityMapper.save(e);
    }

    this.unsavedChanges.pending = false;
    return {
      success: true,
      originalEntities,
      newEntities
    };
  }
}
}
