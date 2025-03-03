import { Entity } from "app/core/entity/model/entity";
import { EntityFormGroup } from "../entity-form/entity-form.service";

/**
 * Wrapper to keep additional form data for each row of an entity, required for inline editing.
 */
export interface TableRow<T extends Entity> {
  record: T;
  formGroup?: EntityFormGroup<T>;
}
