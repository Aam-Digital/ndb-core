import { inject, Injectable } from "@angular/core";
import { AbstractControl } from "@angular/forms";
import { EntitySchemaField } from "../../entity/schema/entity-schema-field";
import { DefaultValueStrategy } from "../default-value-strategy.interface";
import { DefaultValueConfigStatic } from "./default-value-config-static";
import { EntitySchemaService } from "../../entity/schema/entity-schema.service";

/**
 * A simple default-value strategy that replaces placeholder strings with dynamic values, like the current date or user.
 */
@Injectable({
  providedIn: "root",
})
export class StaticDefaultValueService extends DefaultValueStrategy {
  private entitySchemaService = inject(EntitySchemaService);

  setDefaultValue(
    targetFormControl: AbstractControl<any, any>,
    fieldConfig: EntitySchemaField,
  ) {
    const config: DefaultValueConfigStatic = fieldConfig.defaultValue.config;
    if (!config?.value) {
      return;
    }

    const transformedDefaultValue =
      this.entitySchemaService.valueToEntityFormat(config.value, fieldConfig);
    targetFormControl.setValue(transformedDefaultValue);
  }
}
