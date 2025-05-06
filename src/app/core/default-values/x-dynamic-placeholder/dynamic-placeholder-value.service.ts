import { inject, Injectable } from "@angular/core";
import { AbstractControl } from "@angular/forms";
import {
  EntitySchemaField,
  PLACEHOLDERS,
} from "../../entity/schema/entity-schema-field";
import { CurrentUserSubject } from "../../session/current-user-subject";
import { Logging } from "../../logging/logging.service";
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

  override async getAdminUI(): Promise<AdminDefaultValueContext> {
    const component = await import(
      "./admin-default-value-dynamic/admin-default-value-dynamic.component"
    ).then((c) => c.AdminDefaultValueDynamicComponent);

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

    let value;
    switch (config.value) {
      case PLACEHOLDERS.NOW:
        value = new Date();
        break;

      case PLACEHOLDERS.CURRENT_USER:
        value = this.currentUser.value?.getId();
        break;

      default:
        Logging.warn(
          "Unknown PLACEHOLDERS value used in fieldValueConfig: " +
            fieldConfig.defaultValue,
        );
        break;
    }

    if (!value) {
      return;
    }

    if (fieldConfig.isArray && !Array.isArray(value)) {
      targetFormControl.setValue([value]);
    } else {
      targetFormControl.setValue(value);
    }
  }
}
