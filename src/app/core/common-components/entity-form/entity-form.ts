import { FormGroup, ɵElement } from "@angular/forms";
import { Subscription } from "rxjs";
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

  /**
   * map of field ids to the current value to be inherited from the referenced parent entities' field
   */
  inheritedParentValues: Map<string, any>;

  watcher: Map<string, Subscription>;
}

export class EntityFormSavedEvent {
  constructor(
    public newEntity: Entity,
    public previousEntity: Entity,
  ) {}
}

export class EntityFormCancelledEvent {}
