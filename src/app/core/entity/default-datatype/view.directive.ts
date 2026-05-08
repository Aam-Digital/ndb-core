import { computed, Directive, input } from "@angular/core";
import { FormFieldConfig } from "../../common-components/entity-form/FormConfig";
import { Entity } from "../model/entity";

@Directive()
export abstract class ViewDirective<T, C = any> {
  entity = input<Entity>();
  id = input<string>();
  tooltip = input<string>();
  value = input<T>();

  formFieldConfig = input<FormFieldConfig>();
  // eslint-disable-next-line @angular-eslint/no-input-rename -- alias required: "config" is already the name of the computed that merges formFieldConfig.additional with the direct input
  protected readonly _directConfig = input<C>(undefined, { alias: "config" });

  readonly config = computed<C>(() => {
    const ffc = this.formFieldConfig();
    return ffc !== undefined ? (ffc.additional as C) : this._directConfig();
  });

  readonly isPartiallyAnonymized = computed<boolean>(() => {
    const entity = this.entity();
    const id = this.id();
    return (
      (entity?.anonymized &&
        entity?.getSchema()?.get(id)?.anonymize === "retain-anonymized") ??
      false
    );
  });
}
