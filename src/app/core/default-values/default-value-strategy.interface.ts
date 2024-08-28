import { AbstractControl } from "@angular/forms";
import { EntitySchemaField } from "../entity/schema/entity-schema-field";
import { EntityForm } from "../common-components/entity-form/entity-form.service";
import { DefaultValueConfig } from "../entity/schema/default-value-config";
import { Entity } from "../entity/model/entity";

/**
 * A special strategy to define and set default values, which can be used by the DefaultValueService,
 * e.g. dynamic placeholders or inherited values.
 */
export abstract class DefaultValueStrategy {
  /**
   * Calculate and set the default value for a form control, according to the custom strategy.
   * @param targetFormControl The form control to set the default value for.
   * @param fieldConfig The field configuration of this entity field.
   * @param form The overall entity form, including all related fields to support complex, interrelated value calculations.
   * @param entity The entity that is currently edited in the form, to be able to inherited values from fields not displayed in the form directly.
   */
  abstract setDefaultValue(
    targetFormControl: AbstractControl<any, any>,
    fieldConfig: EntitySchemaField,
    form: EntityForm<any>,
    entity?: Entity,
  ): void;

  async onFormValueChanges<T extends Entity>(
    form: EntityForm<T>,
  ): Promise<void> {}

  async initEntityForm<T extends Entity>(form: EntityForm<T>): Promise<void> {}
}

export function getConfigsByMode(
  defaultValueConfigs: Map<string, DefaultValueConfig>,
  mode: ("inherited" | "static" | "dynamic")[],
): Map<string, DefaultValueConfig> {
  let configs: Map<string, DefaultValueConfig> = new Map();

  for (const [key, defaultValueConfig] of defaultValueConfigs) {
    if (mode.indexOf(defaultValueConfig.mode) !== -1) {
      configs.set(key, defaultValueConfig);
    }
  }

  return configs;
}
