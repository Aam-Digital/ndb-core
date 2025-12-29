import { Component, inject, Input } from "@angular/core";
import { MatFormFieldControl } from "@angular/material/form-field";
import {
  BASIC_AUTOCOMPLETE_COMPONENT_IMPORTS,
  BasicAutocompleteComponent,
} from "app/core/common-components/basic-autocomplete/basic-autocomplete.component";
import { EntityConstructor } from "../model/entity";
import { EntityRegistry } from "../database-entity.decorator";
import { EntitySchema } from "../schema/entity-schema";
import { FormFieldConfig } from "../../common-components/entity-form/FormConfig";

/**
 * Dropdown field offering all fields of a given entity type
 * (for admin and action screens).
 */
@Component({
  selector: "app-entity-field-select",
  imports: BASIC_AUTOCOMPLETE_COMPONENT_IMPORTS,
  templateUrl:
    "../../common-components/basic-autocomplete/basic-autocomplete.component.html",
  providers: [
    { provide: MatFormFieldControl, useExisting: EntityFieldSelectComponent },
  ],
})
export class EntityFieldSelectComponent extends BasicAutocompleteComponent<
  FormFieldConfig,
  string
> {
  @Input() override placeholder: string =
    $localize`:EntityFieldSelect placeholder:Select Record Field`;

  override optionToString = (option: FormFieldConfig) => option.label;
  override valueMapper = (option: FormFieldConfig) => option.id;

  @Input() override multi?: boolean;

  @Input() override hideOption: (option: FormFieldConfig) => boolean;

  @Input() set entityType(entity: string | EntityConstructor) {
    if (!entity) {
      return;
    }
    if (typeof entity === "string") {
      this._entityType = this.entityRegistry.get(entity);
    } else {
      this._entityType = entity;
    }

    this.options = this.getAllFieldProps(this._entityType.schema);
  }

  private _entityType: EntityConstructor;

  private entityRegistry = inject(EntityRegistry);

  private getAllFieldProps(schema: EntitySchema): FormFieldConfig[] {
    return [...schema.entries()]
      .filter(
        ([_, fieldSchema]) =>
          !fieldSchema.isInternalField && !!fieldSchema.label,
      )
      .map(([name, fieldSchema]) => ({ ...fieldSchema, id: name }));
  }
}
