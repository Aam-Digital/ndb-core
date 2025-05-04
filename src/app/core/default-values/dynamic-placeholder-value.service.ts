import { Injectable } from "@angular/core";
import { AbstractControl } from "@angular/forms";
import {
  EntitySchemaField,
  PLACEHOLDERS,
} from "../entity/schema/entity-schema-field";
import { CurrentUserSubject } from "../session/current-user-subject";
import { Logging } from "../logging/logging.service";
import { DefaultValueStrategy } from "./default-value-strategy.interface";
import { FilterConfig } from "../entity-list/EntityListConfig";

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
    switch (fieldConfig.defaultValue.value) {
      case PLACEHOLDERS.NOW:
        let now = new Date();
        if (fieldConfig.isArray) {
          targetFormControl.setValue([now]);
        } else {
          targetFormControl.setValue(now);
        }
        break;
      case PLACEHOLDERS.CURRENT_USER:
        let userId = this.currentUser.value?.getId();
        if (!userId) {
          break;
        }

        if (fieldConfig.isArray) {
          targetFormControl.setValue([userId]);
        } else {
          targetFormControl.setValue(userId);
        }
        break;
      default:
        Logging.warn(
          "Unknown PLACEHOLDERS value used in fieldValueConfig: " +
            fieldConfig.defaultValue,
        );
        break;
    }
  }

  getDefaultValueString(filterConfig: FilterConfig): string {
    if (filterConfig.default === PLACEHOLDERS.CURRENT_USER) {
      let userId = this.currentUser.value?.getId();
      if (userId) return userId;
    }
    return "";
  }
}
