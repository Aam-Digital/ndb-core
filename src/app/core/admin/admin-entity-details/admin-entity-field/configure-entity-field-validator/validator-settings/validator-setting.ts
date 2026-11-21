import { FormControl } from "@angular/forms";
import { DynamicFormControlComponent } from "#src/app/core/admin/admin-widget-dialog/dynamic-form-control.interface";
import { EntitySchemaField } from "#src/app/core/entity/schema/entity-schema-field";
import { EntityConstructor } from "#src/app/core/entity/model/entity";

/**
 * An admin component that edits the setting of a validation rule in the field editor's "Validation" tab
 * (named in `FieldValidator.configComponent` and registered in the `ComponentRegistry`).
 *
 * It edits the value of the rule through the `formControl` (an unset setting is `null`).
 * The tab also passes the inputs of {@link ValidatorSettingInputs}; a component declares the ones it needs.
 */
export type ValidatorSettingComponent<T> = DynamicFormControlComponent<T>;

/** The inputs that the "Validation" tab gives to the settings component of a rule. */
export interface ValidatorSettingInputs<T = unknown> {
  /** the value of the rule in the field's `validators` (`null` if the rule is not set) */
  formControl: FormControl<T | null>;
  /** the name of the rule, for the field's own type */
  label: string;
  /** explains the rule to admins */
  description?: string;
  /** the field that is edited, as currently selected in the dialog (e.g. its type) */
  field: EntitySchemaField;
  /** the record type the field belongs to */
  entityType?: EntityConstructor;
  /** the record type that a link field links to, if it is exactly one */
  linkedEntityType?: EntityConstructor;
}
