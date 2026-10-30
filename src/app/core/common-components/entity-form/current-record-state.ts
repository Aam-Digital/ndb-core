import { FormGroup } from "@angular/forms";
import { Observable } from "rxjs";
import { Entity } from "../../entity/model/entity";

/**
 * Gives a field access to the current state of the record being edited,
 * for fields that depend on the values of other fields of that record
 * (like the `selectionCondition` of an entity field).
 *
 * Provided by the component rendering the field (`EntityFieldEditComponent`),
 * so every field component below it can ask for it with an optional `inject()`.
 */
export abstract class CurrentRecordContext {
  /**
   * The record including the current, possibly unsaved values of its form, updated with every change.
   * `undefined` if no single record is being edited.
   */
  abstract currentRecordState(): Observable<Entity | undefined>;
}

/**
 * Copy of the record with the current, possibly unsaved values of its form applied
 * (including disabled and hidden fields).
 */
export function createCurrentRecordState<T extends Entity>(
  entity: T,
  form: FormGroup,
): T {
  const state = entity.copy();
  Object.assign(state, form.getRawValue());
  return state;
}
