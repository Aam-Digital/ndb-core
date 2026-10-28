import { FormGroup, ɵElement } from "@angular/forms";
import { Observable, Subscription } from "rxjs";
import { Entity } from "../../entity/model/entity";
import { FormFieldConfig } from "#src/app/core/common-components/entity-form/FormConfig";
import { EventEmitter } from "@angular/core";

/**
 * These are utility types that allow to define the type of `FormGroup` the way it is returned by `EntityFormService.create`
 */
export type TypedFormGroup<T> = FormGroup<{
  [K in keyof T]: ɵElement<T[K], null>;
}>;

export type EntityFormGroup<T extends Entity> = TypedFormGroup<Partial<T>>;

export interface EntityForm<T extends Entity> {
  formGroup: EntityFormGroup<T>;
  entity: T;

  /**
   * (possible overridden) field configurations for that form
   */
  fieldConfigs: FormFieldConfig[];

  onFormStateChange: EventEmitter<
    EntityFormSavedEvent | EntityFormCancelledEvent
  >;

  watcher: Map<string, Subscription>;

  /**
   * The record with the current, possibly unsaved values of this form, updated with every change,
   * for fields that depend on the values of other fields of the record
   * (like the `selectionCondition` of an entity field).
   *
   * `undefined` if the form does not edit one single record (e.g. in bulk edit).
   * If not set, the field components use the saved `entity` of the form.
   */
  currentRecord?: Observable<T | undefined>;
}

export class EntityFormSavedEvent {
  constructor(
    public newEntity: Entity,
    public previousEntity: Entity,
  ) {}
}

export class EntityFormCancelledEvent {}
