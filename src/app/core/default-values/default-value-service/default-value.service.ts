import { inject, Injectable } from "@angular/core";
import { Entity } from "../../entity/model/entity";
import { EntityForm } from "#src/app/core/common-components/entity-form/entity-form";
import { AbstractControl } from "@angular/forms";
import { EntitySchemaField } from "../../entity/schema/entity-schema-field";
import { DefaultValueStrategy } from "../default-value-strategy.interface";
import { Logging } from "../../logging/logging.service";

/**
 * Handle default values like the current date or user for forms when editing an Entity.
 */
@Injectable({
  providedIn: "root",
})
export class DefaultValueService {
  private defaultValueStrategies: DefaultValueStrategy[] = inject(
    DefaultValueStrategy,
  ) as unknown as DefaultValueStrategy[];

  async handleEntityForm<T extends Entity>(
    form: EntityForm<T>,
    entity: Entity,
  ): Promise<void> {
    if (!(form.fieldConfigs?.length > 0)) {
      return;
    }

    for (const strategy of this.defaultValueStrategies) {
      await strategy.initEntityForm(form);
    }
    this.enableChangeListener(form);

    for (const fieldConfig of form.fieldConfigs) {
      if (!fieldConfig.defaultValue) {
        continue;
      }

      let targetFormControl = form.formGroup.get(fieldConfig.id);
      if (
        !this.preConditionsFulfilled(
          entity.isNew,
          targetFormControl,
          fieldConfig,
        )
      ) {
        continue;
      }

      const strategy = this.defaultValueStrategies.find(
        (s) => s.mode === fieldConfig.defaultValue?.mode,
      );
      if (strategy) {
        strategy.setDefaultValue(targetFormControl, fieldConfig, form);
      } else {
        Logging.warn(
          `DefaultValue strategy "${fieldConfig.defaultValue?.mode}" not found`,
        );
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
        this.defaultValueStrategies.forEach((s) => s.onFormValueChanges(form)),
      ),
    );
  }

  getDefaultValueUiHint<T extends Entity>(
    form: EntityForm<T>,
    fieldId: string,
  ): DefaultValueHint | EmptyDefaultValueHint | undefined {
    if (!form) {
      return;
    }

    const fieldConfig = form?.fieldConfigs?.find((x) => x.id === fieldId);
    const strategy = this.defaultValueStrategies.find(
      (s) => s.mode === fieldConfig?.defaultValue?.mode,
    );

    return strategy?.getDefaultValueUiHint(form, fieldConfig);
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
