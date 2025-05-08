import { Injectable } from "@angular/core";
import { AbstractControl } from "@angular/forms";
import {
  AdminDefaultValueContext,
  DefaultValueStrategy,
} from "../../core/default-values/default-value-strategy.interface";
import { EntitySchemaField } from "../../core/entity/schema/entity-schema-field";

/**
 * A simple default-value strategy that replaces placeholder strings with dynamic values, like the current date or user.
 */
@Injectable({
  providedIn: "root",
})
export class UpdatedFromReferencingEntityDefaultValueService extends DefaultValueStrategy {
  override readonly mode = "updated-from-referencing-entity";

  override async getAdminUI(): Promise<AdminDefaultValueContext> {
    const component = await import(
      "./admin-default-value-updated/admin-default-value-updated.component"
    ).then((c) => c.AdminDefaultValueUpdatedComponent);

    return {
      mode: this.mode,
      component,
      icon: "refresh",
      description: $localize`Auto-update with changes from another record`,
    };
  }

  override setDefaultValue(
    targetFormControl: AbstractControl<any, any>,
    fieldConfig: EntitySchemaField,
  ) {
    // this default value strategy works differently, interacting when a different referencing entity changes
    // no direct action here
  }
}
