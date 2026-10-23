import {
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  inject,
  input,
  linkedSignal,
} from "@angular/core";
import { Entity } from "../../entity/model/entity";
import {
  ColumnConfig,
  FormFieldConfig,
} from "../../common-components/entity-form/FormConfig";
import { DynamicComponent } from "../../config/dynamic-components/dynamic-component.decorator";
import { EntitySchemaService } from "../../entity/schema/entity-schema.service";
import { EntityAbility } from "../../permissions/ability/entity-ability";
import { EntityFormService } from "../../common-components/entity-form/entity-form.service";
import { getSchemaEmbedArrayColumns } from "../../basic-datatypes/schema-embed/schema-embed-array-columns";
import { SchemaEmbedArrayTableComponent } from "../../basic-datatypes/schema-embed/schema-embed-array-table/schema-embed-array-table.component";
import { SchemaEmbedArrayApplyChange } from "../../basic-datatypes/schema-embed/schema-embed-array-entry-dialog/schema-embed-array-entry-dialog.component";

/**
 * Config format that the EmbeddedArrayDataComponent handles.
 */
export interface EmbeddedArrayDataConfig {
  /** Property of the entity holding the embedded entries (a field of dataType "schema-embed-array"). */
  property: string;

  /**
   * Columns to be displayed in the table, referencing the inner fields of the embedded entries.
   * If not set, all inner fields are displayed.
   */
  columns?: ColumnConfig[];

  /** Whether users can add and edit entries (default: true). */
  editable?: boolean;
}

/**
 * Display the entries of an entity's `schema-embed-array` property as a table,
 * looking like the {@link RelatedEntitiesComponent} list of related records.
 *
 * Clicking an entry opens a popup to view, edit or delete that single entry
 * (see {@link SchemaEmbedArrayTableComponent}), saving the entity directly from there.
 */
@DynamicComponent("EmbeddedArrayData")
@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: "app-embedded-array-data",
  templateUrl: "./embedded-array-data.component.html",
  imports: [SchemaEmbedArrayTableComponent],
})
export class EmbeddedArrayDataComponent {
  private readonly entitySchemaService = inject(EntitySchemaService);
  private readonly entityFormService = inject(EntityFormService);
  private readonly ability = inject(EntityAbility);
  private readonly destroyRef = inject(DestroyRef);

  /** currently viewed/main entity holding the embedded entries */
  entity = input<Entity>();

  /** @see EmbeddedArrayDataConfig.property */
  property = input.required<string>();

  /** @see EmbeddedArrayDataConfig.columns */
  columns = input<ColumnConfig[]>([]);

  /** @see EmbeddedArrayDataConfig.editable */
  editable = input<boolean>(true);

  private readonly fieldConfig = computed<FormFieldConfig | undefined>(() => {
    const field = this.entity()?.getSchema().get(this.property());
    return field ? { ...field, id: this.property() } : undefined;
  });

  /** All inner fields of the embedded entries, which can be edited in the popup. */
  readonly allColumns = computed(() =>
    getSchemaEmbedArrayColumns(this.fieldConfig(), this.entitySchemaService),
  );

  /** The configured columns, extended with the inner field details (falling back to all inner fields). */
  readonly _columns = computed<FormFieldConfig[]>(() =>
    getSchemaEmbedArrayColumns(
      this.fieldConfig(),
      this.entitySchemaService,
      this.columns(),
    ),
  );

  /** The embedded entries, updated locally after a save, until a new entity is given. */
  readonly rows = linkedSignal<Record<string, any>[]>(
    () => this.entity()?.[this.property()] ?? [],
  );

  /** Entries can only be viewed if this component is not editable or the user lacks permissions. */
  readonly readonly = computed(() => {
    const entity = this.entity();
    return (
      !this.editable() ||
      !entity ||
      this.ability.cannot("update", entity, this.property())
    );
  });

  /**
   * Save the entity with the given entries through the standard entity form logic
   * (including validation and permission checks), displaying the saved entries.
   */
  readonly applyChange: SchemaEmbedArrayApplyChange = async (entries) => {
    const entity = this.entity();
    const property = this.property();
    const entityForm = await this.entityFormService.createEntityForm(
      [property],
      entity,
      this.destroyRef,
      false,
      true,
      false,
    );
    entityForm.formGroup.get(property).setValue(entries);

    const saved = await this.entityFormService.saveChanges(entityForm, entity);
    this.rows.set(saved[property] ?? []);
  };
}
