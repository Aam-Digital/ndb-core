import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  input,
  Input,
} from "@angular/core";
import { MatFormFieldControl } from "@angular/material/form-field";
import {
  BASIC_AUTOCOMPLETE_COMPONENT_IMPORTS,
  BasicAutocompleteComponent,
} from "app/core/common-components/basic-autocomplete/basic-autocomplete.component";
import { FormFieldConfig } from "../../common-components/entity-form/FormConfig";
import { EntityRegistry } from "../database-entity.decorator";
import { EntityConstructor } from "../model/entity";
import { EntitySchema } from "../schema/entity-schema";

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

  @Input() override hideOption: (option: FormFieldConfig) => boolean = () =>
    false;

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
      // Manually trigger ngOnChanges so that any already-set value is re-applied
      // to mark the correct options as selected.
      // (Setting `this.options` directly doesn't go through Angular's @Input binding,
      // so ngOnChanges would not be called automatically.)
      this.ngOnChanges({ options: true } as any);
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
