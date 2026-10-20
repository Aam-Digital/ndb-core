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
        // a config problem, not a bug: admins are warned when saving the config (see ConfigValidationService)
        Logging.debug("DefaultValue strategy not found", {
          field: fieldConfig.id,
          mode: fieldConfig.defaultValue?.mode,
        });
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
 * Why linked records provide no value to inherit:
 * - "conflict": they have different values
 * - "unavailable": some of them could not be loaded (e.g. no permission to read them)
 */
export type NoCommonValueReason = "conflict" | "unavailable";

/**
 * Details of the source for an "inherited" default value in a field,
 * used to display context to the user about this.
 */
export interface FullDefaultValueHint {
  isInSync: boolean;
  inheritedFromType: string;
  inheritedFromField: string;

  syncFromParentField: () => void;

  /**
   * The value is collected from all records of the inheritedFromType
   * that link to this record in their inheritedFromField
   * (rather than inherited from a single parent record selected in this record's inheritedFromField).
   */
  isCollectedFromLinkedRecords?: boolean;

  noCommonValue?: undefined;

  isEmpty?: false;
}

/**
 * Reduced "DefaultValueHint" if no referenced parent entity is selected but a rule to inherit values is configured.
 */
export interface EmptyDefaultValueHint {
  inheritedFromField: string;
  isEmpty: true;

  /**
   * Parent records are linked but they provide no value in common to inherit.
   */
  noCommonValue?: NoCommonValueReason;

  isInSync?: undefined;
  inheritedFromType?: undefined;
  syncFromParentField?: undefined;
  isCollectedFromLinkedRecords?: false;
}
