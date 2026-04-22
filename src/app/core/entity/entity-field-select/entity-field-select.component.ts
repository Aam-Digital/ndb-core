import {
  Component,
  computed,
  effect,
  inject,
  input,
  Input,
  ChangeDetectionStrategy,
} from "@angular/core";
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
  changeDetection: ChangeDetectionStrategy.OnPush,
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

  /**
   * Whether to show the internal _id field in the dropdown.
   * Useful for import contexts where matching by UUID is needed.
   */
  showInternalIdField = input(false);

  /** The entity type whose fields to display. */
  entityType = input<string | EntityConstructor>();

  private entityRegistry = inject(EntityRegistry);

  private readonly resolvedEntityType = computed(() => {
    const entity = this.entityType();
    if (!entity) {
      return undefined;
    }
    return typeof entity === "string"
      ? this.entityRegistry.get(entity)
      : entity;
  });

  private readonly fieldOptions = computed(() => {
    const entityType = this.resolvedEntityType();
    if (!entityType) {
      return [];
    }
    return this.getAllFieldProps(entityType.schema);
  });

  constructor() {
    super();
    effect(() => {
      this.options = this.fieldOptions();
    });
  }

  private getAllFieldProps(schema: EntitySchema): FormFieldConfig[] {
    return [...schema.entries()]
      .filter(
        ([prop, fieldSchema]) =>
          (!fieldSchema.isInternalField && !!fieldSchema.label) ||
          (this.showInternalIdField() && prop === "_id"),
      )
      .map(([name, fieldSchema]) => ({ ...fieldSchema, id: name }));
  }
}
