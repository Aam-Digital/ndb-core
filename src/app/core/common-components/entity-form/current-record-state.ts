import { computed, inject, Signal } from "@angular/core";
import { toObservable, toSignal } from "@angular/core/rxjs-interop";
import { AbstractControl, FormGroup } from "@angular/forms";
import { Observable, of, switchMap } from "rxjs";
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

/**
 * The record with the current values of the form the given control belongs to
 * (for validators, which only get their control),
 * or the record itself if the control is not part of a form.
 */
export function getCurrentRecordOfControl<T extends Entity>(
  control: AbstractControl,
  record: T | undefined,
): T | undefined {
  return record && control.parent instanceof FormGroup
    ? createCurrentRecordState(record, control.parent)
    : record;
}

/**
 * The current state of the record a field belongs to (see {@link CurrentRecordContext}),
 * followed only while `follow()` is true, otherwise `undefined`.
 * Must be called in an injection context (e.g. as a field initializer of a component).
 */
export function currentRecordSignal<T extends Entity = Entity>(
  follow: () => boolean,
): Signal<T | undefined> {
  const context = inject(CurrentRecordContext, { optional: true });
  return toSignal(
    toObservable(computed(follow)).pipe(
      switchMap((active) =>
        active && context ? context.currentRecordState() : of(undefined),
      ),
    ),
    { initialValue: undefined },
  ) as Signal<T | undefined>;
}
