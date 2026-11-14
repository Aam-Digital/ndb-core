import {
  Component,
  computed,
  createEnvironmentInjector,
  DestroyRef,
  EnvironmentInjector,
  inject,
  input,
  linkedSignal,
} from "@angular/core";
import { AbstractControl } from "@angular/forms";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { filter } from "rxjs";
import { Entity } from "../../entity/model/entity";
import {
  ColumnConfig,
  FormFieldConfig,
} from "../../common-components/entity-form/FormConfig";
import { DynamicComponent } from "../../config/dynamic-components/dynamic-component.decorator";
import { EntitySchemaService } from "../../entity/schema/entity-schema.service";
import { EntityAbility } from "../../permissions/ability/entity-ability";
import { EntityFormService } from "../../common-components/entity-form/entity-form.service";
import { EntityFormSavedEvent } from "../../common-components/entity-form/entity-form";
import { InvalidFormFieldError } from "../../common-components/entity-form/invalid-form-field.error";
import { getSchemaEmbedArrayColumns } from "../../basic-datatypes/schema-embed/schema-embed-array-columns";
import { SchemaEmbedArrayTableComponent } from "../../basic-datatypes/schema-embed/schema-embed-array-table/schema-embed-array-table.component";
import { SchemaEmbedArrayApplyChange } from "../../basic-datatypes/schema-embed/schema-embed-array-entry-dialog/schema-embed-array-entry-dialog.component";
import { applySchemaEmbedArrayEntryChange } from "../../basic-datatypes/schema-embed/schema-embed-array-entry-change";
import { AutomatedFieldUpdateConfigService } from "#src/app/features/inherited-field/automated-field-update/automated-field-update-config.service";

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
  selector: "app-embedded-array-data",
  templateUrl: "./embedded-array-data.component.html",
  imports: [SchemaEmbedArrayTableComponent],
})
export class EmbeddedArrayDataComponent {
  private readonly entitySchemaService = inject(EntitySchemaService);
  private readonly entityFormService = inject(EntityFormService);
  private readonly ability = inject(EntityAbility);
  private readonly environmentInjector = inject(EnvironmentInjector);
  private readonly automatedFieldUpdateConfigService = inject(
    AutomatedFieldUpdateConfigService,
  );

  /** currently viewed/main entity holding the embedded entries */
  entity = input<Entity>();

  /** @see EmbeddedArrayDataConfig.property */
  property = input.required<string>();

  /** @see EmbeddedArrayDataConfig.columns */
  columns = input<ColumnConfig[]>([]);

  /** @see EmbeddedArrayDataConfig.editable */
  editable = input<boolean>(true);

  readonly fieldConfig = computed<FormFieldConfig | undefined>(() => {
    const field = this.entity()?.getSchema().get(this.property());
    return field ? { ...field, id: this.property() } : undefined;
  });

  /** All inner fields of the embedded entries, which can be edited in the popup. */
  readonly allColumns = computed(() =>
    getSchemaEmbedArrayColumns(this.fieldConfig(), this.entitySchemaService),
  );

  /** The configured columns, extended with the inner field details (falling back to all inner fields). */
  readonly displayedColumns = computed<FormFieldConfig[]>(() =>
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

  /**
   * Entries can only be viewed if this component is not editable or the user lacks permissions.
   * A new record is saved through its main form first
   * (saving it from here would skip the validation of the other fields).
   */
  readonly readonly = computed(() => {
    const entity = this.entity();
    return (
      !this.editable() ||
      !entity ||
      entity.isNew ||
      this.ability.cannot("update", entity, this.property())
    );
  });

  /**
   * Save the entity with the given change applied to its latest entries
   * (which may have been updated since the popup opened, e.g. by a sync)
   * through the standard entity form logic (including validation and permission checks),
   * displaying the saved entries.
   */
  readonly applyChange: SchemaEmbedArrayApplyChange = async (change) => {
    const entity = this.entity();
    const property = this.property();
    const entries = applySchemaEmbedArrayEntryChange(entity[property], change);

    // the form is only needed for this save (the entity is replaced after each save anyway),
    // so its subscriptions are cleaned up right after instead of piling up until this panel is destroyed
    const saveScope = createEnvironmentInjector([], this.environmentInjector);
    try {
      const entityForm = await this.entityFormService.createEntityForm(
        [property],
        entity,
        saveScope.get(DestroyRef),
        /* withPermissionCheck */ true,
        /* withDefaultValues */ false,
      );
      const control = entityForm.formGroup.get(property);
      control.setValue(entries);
      // like a save of the main form (see EntityFormComponent), until all form saves run the rules (#4537)
      entityForm.onFormStateChange
        .pipe(
          filter(
            (event): event is EntityFormSavedEvent =>
              event instanceof EntityFormSavedEvent,
          ),
          takeUntilDestroyed(saveScope.get(DestroyRef)),
        )
        .subscribe(async (event) => {
          // reports and shows a failure itself
          await this.automatedFieldUpdateConfigService.applyRulesToDependentEntities(
            event.newEntity,
            event.previousEntity,
          );
        });

      const saved = await this.entityFormService
        .saveChanges(entityForm, entity)
        .catch((err) => {
          if (err instanceof InvalidFormFieldError) {
            // the popup only shows the fields of a single entry, not the errors of the whole property
            throw new Error(describeInvalidEntries(control));
          }
          throw err;
        });
      this.rows.set(saved[property] ?? []);
    } finally {
      saveScope.destroy();
    }
  };
}

/** The validation errors of the whole property (e.g. "required"), as a message for the user. */
function describeInvalidEntries(control: AbstractControl): string {
  const messages = Object.values<{ errorMessage?: string }>(
    control.errors ?? {},
  )
    .map((error) => error?.errorMessage)
    .filter(Boolean);
  return messages.length
    ? $localize`Could not save the entries: ${messages.join(" ")}`
    : $localize`Could not save the entries, because they are not valid.`;
}
