import { Injectable } from "@angular/core";
import { AbstractControl } from "@angular/forms";
import {
  EntitySchemaField,
  PLACEHOLDERS,
} from "../../entity/schema/entity-schema-field";
import { CurrentUserSubject } from "../../session/current-user-subject";
import { Logging } from "../../logging/logging.service";
import { DefaultValueStrategy } from "../default-value-strategy.interface";
import { DefaultValueConfigDynamic } from "./default-value-config-dynamic";

/**
 * A simple default-value strategy that replaces placeholder strings with dynamic values, like the current date or user.
 */
@Injectable({
  providedIn: "root",
})
export class DynamicPlaceholderValueService extends DefaultValueStrategy {
  constructor(private currentUser: CurrentUserSubject) {
    super();
  }

  setDefaultValue(
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
