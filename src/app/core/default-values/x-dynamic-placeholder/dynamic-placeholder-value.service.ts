import { inject, Injectable } from "@angular/core";
import { AbstractControl } from "@angular/forms";
import {
  EntitySchemaField,
  PLACEHOLDERS,
} from "../../entity/schema/entity-schema-field";
import { CurrentUserSubject } from "../../session/current-user-subject";
import { Logging } from "../../logging/logging.service";
import { Entity } from "../../entity/model/entity";
import { EntitySchemaService } from "../../entity/schema/entity-schema.service";
import {
  DataFilter,
  resolveCurrentRecordPlaceholders,
} from "../../filter/filters/filters";
import {
  AdminDefaultValueContext,
  DefaultValueStrategy,
} from "../default-value-strategy.interface";
import { DefaultValueConfigDynamic } from "./default-value-config-dynamic";

/**
 * A simple default-value strategy that replaces placeholder strings with dynamic values, like the current date or user.
 */
@Injectable({
  providedIn: "root",
})
export class DynamicPlaceholderValueService extends DefaultValueStrategy {
  override readonly mode = "dynamic";

  private currentUser = inject(CurrentUserSubject);
  private entitySchemaService = inject(EntitySchemaService);

  override async getAdminUI(): Promise<AdminDefaultValueContext> {
    const component =
      await import("./admin-default-value-dynamic/admin-default-value-dynamic.component").then(
        (c) => c.AdminDefaultValueDynamicComponent,
      );

    return {
      mode: this.mode,
      component: component,
      icon: "circle-left",
      description: $localize`dynamic placeholder (e.g. current date or user)`,
    };
  }

  override setDefaultValue(
    targetFormControl: AbstractControl<any, any>,
    fieldConfig: EntitySchemaField,
  ) {
    const config: DefaultValueConfigDynamic = fieldConfig.defaultValue.config;

    let value = this.getPlaceholderValue(config.value);

    if (!value) {
      return;
    }

    if (fieldConfig.isArray && !Array.isArray(value)) {
      targetFormControl.setValue([value]);
    } else {
      targetFormControl.setValue(value);
    }
  }

  /**
   * Get the current value for a given placeholder.
   * @param placeholder The placeholder string to resolve.
   * @returns The value for the given placeholder or `undefined` if not found.
   */
  getPlaceholderValue(placeholder: string): string | Date | undefined {
    switch (placeholder) {
      case PLACEHOLDERS.CURRENT_USER:
        let userId = this.currentUser.value?.getId();
        return userId;
      case PLACEHOLDERS.NOW:
        let date = new Date();
        return date;
      default:
        Logging.debug(
          "Unknown PLACEHOLDERS value used in fieldValueConfig: " + placeholder,
        );
        return;
    }
  }

  /**
   * Replace the `$current_record.<fieldId>` placeholders in a condition
   * (e.g. the `selectionCondition` of a field) with the values of the given record.
   *
   * The values are used in database format, like the values of the records the condition is applied to.
   * See {@link resolveCurrentRecordPlaceholders} for which parts of the condition are left out.
   *
   * @param condition The condition to resolve. It is not changed, a resolved copy is returned.
   * @param record The record being edited. Without a record (e.g. in bulk edit) no placeholder can be resolved.
   */
  resolveRecordPlaceholders<T>(
    condition: DataFilter<T>,
    record: Entity | undefined,
  ): DataFilter<T> {
    return resolveCurrentRecordPlaceholders(condition, (fieldId) => {
      const value = record?.[fieldId];
      const schemaField = record?.getSchema().get(fieldId);
      if (value === undefined || value === null || !schemaField) {
        return value;
      }
      return this.entitySchemaService.valueToDatabaseFormat(value, schemaField);
    });
  }
}
