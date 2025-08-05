import { AbstractControl } from "@angular/forms";
import { EntitySchemaField } from "../entity/schema/entity-schema-field";
import { EntityForm } from "#src/app/core/common-components/entity-form/entity-form";
import { Entity } from "../entity/model/entity";
import { Type } from "@angular/core";
import { DefaultValueHint } from "./default-value-service/default-value.service";
import { FormFieldConfig } from "../common-components/entity-form/FormConfig";

/**
 * A special strategy to define and set default values, which can be used by the DefaultValueService,
 * e.g. dynamic placeholders or inherited values.
 */
export abstract class DefaultValueStrategy {
  /**
   * The mode identifying this strategy in the config and admin UI.
   */
  abstract mode: string;

  /**
   * The Admin UI component and details.
   */
  abstract getAdminUI(): Promise<AdminDefaultValueContext>;

  /**
   * Calculate and set the default value for a form control, according to the custom strategy.
   * This is the central function to set a default value to the given targetFormControl while a form is initialized.
   * @param targetFormControl The form control to set the default value for.
   * @param fieldConfig The field configuration of this entity field.
   * @param form The overall entity form, including all related fields to support complex, interrelated value calculations.
   */
  abstract setDefaultValue(
    targetFormControl: AbstractControl<any, any>,
    fieldConfig: EntitySchemaField,
    form: EntityForm<any>,
  ): void;

  async onFormValueChanges<T extends Entity>(
    form: EntityForm<T>,
  ): Promise<void> {}

  async initEntityForm<T extends Entity>(form: EntityForm<T>): Promise<void> {}

  /**
   * Get details about the status and context of a default value field to display to the user.
   * @param form
   * @param field
   */
  getDefaultValueUiHint<T extends Entity>(
    form: EntityForm<T>,
    field: FormFieldConfig,
  ): DefaultValueHint | undefined {
    return undefined;
  }
}

/**
 * Details required to display the admin UI for a default value strategy.
 */
export interface AdminDefaultValueContext {
  mode: string;
  component: Type<any>;
  icon: string;
  description: string;
}
