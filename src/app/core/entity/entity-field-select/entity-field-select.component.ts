import {
  ChangeDetectionStrategy,
  Component,
  computed,
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
  // `placeholder` is part of the `MatFormFieldControl` contract (Angular Material
  // reads it as a plain property), so it stays a decorator `@Input()` rather than a
  // signal input; here we only override the default value.
  @Input() override placeholder: string =
    $localize`:EntityFieldSelect placeholder:Select Record Field`;

  override optionToString = input<(option: FormFieldConfig) => string>(
    // fall back to the id so the internal `_id` field (which has no label) is not blank
    (option) => option.label ?? option.id,
  );
  override valueMapper = input<(option: FormFieldConfig) => string>(
    (option) => option.id,
  );

  /**
   * Whether to show the internal _id field in the dropdown.
   * Useful for import contexts where matching by UUID is needed.
   */
  showInternalIdField = input(false);

  /** The entity type whose fields to display. */
  entityType = input<string | EntityConstructor>();

  /**
   * ids of fields to leave out of the dropdown - applies to both explicitly passed `options`
   * and fields inferred from the entity's schema (e.g. because a more specific alternative is
   * offered instead, or because the field doesn't make sense to pick directly, see
   * `AdminEntityListComponent.filterExcludedFields`).
   */
  excludedFields = input<string[]>([]);

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

  /**
   * Explicitly given options are merged with the fields inferred from the entity's schema,
   * so that callers can offer additional, calculated columns (e.g. "distance")
   * that do not exist as a field in the schema.
   * An explicit config takes precedence over the inferred field of the same id.
   */
  protected override optionsSource = computed(() => {
    const excluded = new Set(this.excludedFields());
    const optionsById = new Map<string, FormFieldConfig>();
    for (const option of this.options() ?? []) {
      optionsById.set(option.id, option);
    }
    for (const inferredOption of this.fieldOptions()) {
      if (!optionsById.has(inferredOption.id)) {
        optionsById.set(inferredOption.id, inferredOption);
      }
    }
    return [...optionsById.values()].filter(
      (option) => !excluded.has(option.id),
    );
  });

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
