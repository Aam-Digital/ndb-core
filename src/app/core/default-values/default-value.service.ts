import { Injectable } from "@angular/core";
import { Entity } from "../entity/model/entity";
import { EntityForm } from "../common-components/entity-form/entity-form.service";
import { EntitySchema } from "../entity/schema/entity-schema";
import { DefaultValueConfig } from "../entity/schema/default-value-config";
import { AbstractControl } from "@angular/forms";
import { EntitySchemaField } from "../entity/schema/entity-schema-field";
import { DynamicPlaceholderValueService } from "./dynamic-placeholder-value.service";
import { InheritedValueService } from "./inherited-value.service";

/**
 * Handle default values like the current date or user for forms when editing an Entity.
 */
@Injectable({
  providedIn: "root",
})
export class DefaultValueService {
  constructor(
    private dynamicPlaceholderValueService: DynamicPlaceholderValueService,
    private inheritedValueService: InheritedValueService,
  ) {}

  async handleEntityForm<T extends Entity>(
    form: EntityForm<T>,
    entity: Entity,
  ): Promise<void> {
    if (!(form.defaultValueConfigs?.size > 0)) {
      return;
    }

    const entitySchema: EntitySchema = entity.getSchema();
    await this.inheritedValueService.initEntityForm(form);
    this.enableChangeListener(form);

    for (const [key, entitySchemaField] of entitySchema) {
      let fieldConfig = JSON.parse(JSON.stringify(entitySchemaField));

      let targetFormControl = form.formGroup.get(key);
      if (
        !this.preConditionsFulfilled(
          entity.isNew,
          targetFormControl,
          fieldConfig,
        )
      ) {
        continue;
      }
      const defaultValueConfig = form.defaultValueConfigs.get(key);
      if (defaultValueConfig) {
        // Override entitySchemaField's defaultValue with the value from defaultValueConfigs
        fieldConfig.defaultValue = {
          mode: defaultValueConfig.mode,
          value: defaultValueConfig.value,
        };
      }
      switch (fieldConfig.defaultValue?.mode) {
        case "static":
          this.handleStaticMode(targetFormControl, fieldConfig);
          break;
        case "dynamic":
          this.dynamicPlaceholderValueService.setDefaultValue(
            targetFormControl,
            fieldConfig,
          );
          break;
        case "inherited":
          this.inheritedValueService.setDefaultValue(
            targetFormControl,
            fieldConfig,
            form,
          );
          break;
      }
    }
  }

  private preConditionsFulfilled(
    isNew: boolean,
    formControl: AbstractControl,
    fieldConfig: EntitySchemaField,
  ): boolean {
    if (!isNew) {
      return false;
    }

    if (!formControl) {
      return false;
    }

    if (!fieldConfig.isArray && !!formControl.value) {
      return false;
    }

    if (
      fieldConfig.isArray &&
      formControl.value &&
      formControl.value.length > 0
    ) {
      return false;
    }

    return true;
  }

  private enableChangeListener<T extends Entity>(form: EntityForm<T>) {
    form.watcher.set(
      "formGroupValueChanges",
      form.formGroup.valueChanges.subscribe(async (change) =>
        this.inheritedValueService.onFormValueChanges(form),
      ),
    );
  }

  private handleStaticMode(
    targetFormControl: AbstractControl<any, any>,
    fieldConfig: EntitySchemaField,
  ) {
    if (fieldConfig.isArray) {
      targetFormControl.setValue([fieldConfig.defaultValue.value]);
    } else {
      targetFormControl.setValue(fieldConfig.defaultValue.value);
    }
  }

  getDefaultValueUiHint<T extends Entity>(
    form: EntityForm<T>,
    fieldId: string,
  ): DefaultValueHint | EmptyDefaultValueHint | undefined {
    if (!form) {
      return;
    }

    const mode = form?.defaultValueConfigs?.get(fieldId)?.mode;
    if (mode === "inherited") {
      return this.inheritedValueService.getDefaultValueUiHint(form, fieldId);
    }
  }

  static getDefaultValueConfigs<T extends Entity>(
    entity: T,
  ): Map<string, DefaultValueConfig> {
    let schema: EntitySchema = entity.getSchema();

    const defaultValueConfigs: Map<string, DefaultValueConfig> = new Map();

    for (const [key, entitySchemaField] of schema) {
      if (entitySchemaField.defaultValue) {
        defaultValueConfigs.set(key, entitySchemaField.defaultValue);
      }
    }

    return defaultValueConfigs;
  }
}

export type DefaultValueHint = FullDefaultValueHint | EmptyDefaultValueHint;

/**
 * Details of the source for an "inherited" default value in a field,
 * used to display context to the user about this.
 */
export interface FullDefaultValueHint {
  isInSync: boolean;
  inheritedFromType: string;
  inheritedFromField: string;

  syncFromParentField: () => void;

  isEmpty?: undefined | false;
}

/**
 * Reduced "DefaultValueHint" if no referenced parent entity is selected but a rule to inherit values is configured.
 */
export interface EmptyDefaultValueHint {
  inheritedFromField: string;
  isEmpty: true;

  isInSync?: undefined;
  inheritedFromType?: undefined;
  syncFromParentField?: undefined;
}
