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
      let targetFormControl = form.formGroup.get(key);
      if (
        !this.preConditionsFulfilled(
          entity.isNew,
          targetFormControl,
          entitySchemaField,
        )
      ) {
        continue;
      }

      switch (entitySchemaField.defaultValue?.mode) {
        case "static":
          this.handleStaticMode(targetFormControl, entitySchemaField);
          break;
        case "dynamic":
          this.dynamicPlaceholderValueService.setDefaultValue(
            targetFormControl,
            entitySchemaField,
          );
          break;
        case "inherited":
          this.inheritedValueService.setDefaultValue(
            targetFormControl,
            entitySchemaField,
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
