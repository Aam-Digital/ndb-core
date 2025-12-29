import { inject, Injectable } from "@angular/core";
import { AbstractControl } from "@angular/forms";
import { EntitySchemaField } from "../../entity/schema/entity-schema-field";
import {
  AdminDefaultValueContext,
  DefaultValueStrategy,
} from "../default-value-strategy.interface";
import { DefaultValueConfigStatic } from "./default-value-config-static";
import { EntitySchemaService } from "../../entity/schema/entity-schema.service";

/**
 * A simple default-value strategy that replaces placeholder strings with dynamic values, like the current date or user.
 */
@Injectable({
  providedIn: "root",
})
export class StaticDefaultValueService extends DefaultValueStrategy {
  override readonly mode = "static";

  private entitySchemaService = inject(EntitySchemaService);

  override async getAdminUI(): Promise<AdminDefaultValueContext> {
    const component =
      await import("./admin-default-value-static/admin-default-value-static.component").then(
        (c) => c.AdminDefaultValueStaticComponent,
      );

    return {
      mode: this.mode,
      component,
      icon: "circle",
      description: $localize`simple, fixed default value`,
    };
  }

  override setDefaultValue(
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
