import { NoCommonValueReason } from "#src/app/core/default-values/default-value-service/default-value.service";
import { FormFieldConfig } from "#src/app/core/common-components/entity-form/FormConfig";
import { Entity, EntityConstructor } from "#src/app/core/entity/model/entity";

/**
 * Represents an entity that will be affected by a status update.
 * This interface is used to define the structure of the data
 * that will be passed to the
 * AutomatedFieldUpdateComponent for processing.
 */
export interface AffectedEntity {
  /** entityId of the affected entity */
  id: string;

  /** New value to be applied to the target field (database format; entity format in the result of the dialog) */
  newValue: unknown;

  /** The value that the target field has when it is saved (database format) */
  savedValue: unknown;

  /** Field Id that will receive the status update */
  targetFieldId: string;

  /** Entity type constructor for the target entity */
  targetEntityType: EntityConstructor;

  /** Actual entity which is being modified through automatedconfig rule */
  affectedEntity?: Entity;

  /** Reference field name that triggered the status update */
  relatedReferenceField: string;

  /** Entity type where the related reference field is defined */
  relatedReferenceFieldEntityType?: EntityConstructor;

  selectedField?: FormFieldConfig;

  /** Whether the new value is merged into the existing values instead of replacing them completely */
  addToExisting?: boolean;

  /** Why the entities linked to the affected entity provide no value in common, so the current value is kept */
  noCommonValue?: NoCommonValueReason;

  /** Whether the affected entity is no longer linked to the changed entity */
  unlinked?: boolean;

  /** The field of the changed entity that this update is based on, also for the entities of the levels above */
  sourceFieldId: string;

  /** How many levels above the changed entity the affected entity is (1 = directly linked) */
  level: number;

  /** Ids of the records this one is reached from (the changed entity, or affected entities of the level below) */
  via?: string[];
}

/** An affected entity as shown in the dialog, with the value shown in its form */
export interface DialogRow extends AffectedEntity {
  /** The value the user entered, otherwise the suggested value (database format) */
  value: unknown;

  /** Whether the user changed the suggested value */
  edited: boolean;

  /** Whether the suggestion changed after the user had changed the value (the value of the user is kept) */
  suggestionChanged: boolean;

  /**
   * A copy of the affected entity that only has the values of the field that the shown value removes
   * (for fields that add to the existing values), to display them.
   */
  removedEntity?: Entity;
}

/** The change that opened the update dialog */
export interface UpdateTrigger {
  /** The changed entity */
  entity: Entity;

  /** The changed entity before the change (the same as entity if there is no change) */
  before: Entity;

  /** The field of the entity to pass on to the entities it links to, regardless of a change (from the button next to the field) */
  fieldId?: string;
}

/** A value that the user entered for an affected entity, instead of the suggested one */
export interface EnteredValue {
  id: string;
  targetFieldId: string;

  /** in database format */
  value: unknown;
}
