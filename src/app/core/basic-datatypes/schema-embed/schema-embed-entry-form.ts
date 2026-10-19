import { FormControl, FormGroup } from "@angular/forms";
import { DynamicValidatorsService } from "#src/app/core/common-components/entity-form/dynamic-form-validators/dynamic-validators.service";
import { FormFieldConfig } from "#src/app/core/common-components/entity-form/FormConfig";
import { Entity } from "#src/app/core/entity/model/entity";

/**
 * Build the form for a single embedded entry (e.g. one row of a `schema-embed-array` field),
 * with one control per inner field, including the field's configured validators.
 *
 * @param columns the inner fields of the embedded entry
 * @param value the entry's current values
 * @param dynamicValidators to build the inner fields' configured validators
 * @param entity the entity holding the embedded entries (context for some validators)
 */
export function buildSchemaEmbedEntryForm(
  columns: FormFieldConfig[],
  value: Record<string, any> | undefined,
  dynamicValidators: DynamicValidatorsService,
  entity: Entity,
): FormGroup {
  const controls: Record<string, FormControl> = {};
  for (const column of columns) {
    const options = column.validators
      ? dynamicValidators.buildValidators(column.validators, entity, column.id)
      : {};
    controls[column.id] = new FormControl(value?.[column.id], options);
  }
  return new FormGroup(controls);
}
