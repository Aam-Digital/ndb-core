import { EventEmitter, Injectable } from "@angular/core";
import { EntityConstructor } from "../entity/model/entity";

/**
 * Simply service to centralize updates between various admin components in the form builder.
 */
@Injectable({
  providedIn: "root",
})
export class AdminEntityService {
  public entitySchemaUpdated = new EventEmitter<void>();

  /**
   * Set a new schema field to the given entity and trigger update event for related admin components.
   * @param entityType
   * @param fieldId
   * @param updatedEntitySchema
   */
  updateSchemaField(
    entityType: EntityConstructor,
    fieldId: any,
    updatedEntitySchema: any,
  ) {
    entityType.schema.set(fieldId, updatedEntitySchema);
    this.entitySchemaUpdated.next();
  }
}
