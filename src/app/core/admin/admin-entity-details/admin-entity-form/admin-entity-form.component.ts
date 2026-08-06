import { EntityForm } from "#src/app/core/common-components/entity-form/entity-form";
import {
  CdkDragDrop,
  DragDropModule,
  moveItemInArray,
} from "@angular/cdk/drag-drop";
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  effect,
  inject,
  input,
  linkedSignal,
  output,
  signal,
  untracked,
} from "@angular/core";
import { toSignal } from "@angular/core/rxjs-interop";
import { FormControl, ReactiveFormsModule } from "@angular/forms";
import { MatButtonModule } from "@angular/material/button";
import { MatCardModule } from "@angular/material/card";
import { MatDialog } from "@angular/material/dialog";
import { MatFormFieldModule } from "@angular/material/form-field";
import { MatIconModule } from "@angular/material/icon";
import { MatInputModule } from "@angular/material/input";
import { MatTooltipModule } from "@angular/material/tooltip";
import { FaIconComponent } from "@fortawesome/angular-fontawesome";
import { UntilDestroy, untilDestroyed } from "@ngneat/until-destroy";
import { FieldGroup } from "app/core/entity-details/form/field-group";
import { EntitySchemaField } from "app/core/entity/schema/entity-schema-field";
import { lastValueFrom } from "rxjs";
import { EntityFormService } from "../../../common-components/entity-form/entity-form.service";
import {
  ColumnConfig,
  FormFieldConfig,
  toFormFieldConfig,
} from "../../../common-components/entity-form/FormConfig";
import { FormConfig } from "../../../entity-details/form/form.component";
import { EntityFieldEditComponent } from "../../../entity/entity-field-edit/entity-field-edit.component";
import { EntityFieldLabelComponent } from "../../../entity/entity-field-label/entity-field-label.component";
import { Entity, EntityConstructor } from "../../../entity/model/entity";
import { AdminEntityService } from "../../admin-entity.service";
import { AdminSectionHeaderComponent } from "../../building-blocks/admin-section-header/admin-section-header.component";
import { AdminEditDescriptionOnlyFieldComponent } from "../admin-entity-field/admin-edit-description-only-field/admin-edit-description-only-field.component";
import {
  AdminEntityFieldComponent,
  AdminEntityFieldData,
} from "../admin-entity-field/admin-entity-field.component";

/**
 * Identifies one of the drop lists a field can be dragged between:
 * the index of a field group in the form, or the toolbar of fields not used in the form.
 */
export type FieldDropTarget = number | "available";

/** A field dragged between the form's field groups and the toolbar of unused fields. */
type FieldDragDropEvent = CdkDragDrop<
  FieldDropTarget,
  FieldDropTarget,
  ColumnConfig
>;

@UntilDestroy()
@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: "app-admin-entity-form",
  templateUrl: "./admin-entity-form.component.html",
  styleUrls: [
    "./admin-entity-form.component.scss",
    "../../building-blocks/admin-section-header/admin-section-header.component.scss",
    "../../../common-components/entity-form/entity-form/entity-form.component.scss",
  ],
  imports: [
    DragDropModule,
    FaIconComponent,
    MatButtonModule,
    MatTooltipModule,
    MatCardModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    ReactiveFormsModule,
    EntityFieldLabelComponent,
    EntityFieldEditComponent,
    AdminSectionHeaderComponent,
  ],
})
export class AdminEntityFormComponent {
  private entityFormService = inject(EntityFormService);
  private matDialog = inject(MatDialog);
  private adminEntityService = inject(AdminEntityService);
  private readonly destroyRef = inject(DestroyRef);

  // migrate inputs to Angular `input()` signals
  readonly entityType = input<EntityConstructor>();
  readonly uniqueAreaId = input<string>();

  // `config` as an Input signal. Call `this.config()` to access the value.
  readonly config = input<FormConfig>();

  readonly configChange = output<FormConfig>();

  /**
   * Whether the UI is readonly, not allowing the user to drag or edit things.
   */
  readonly isDisabled = input<boolean>();

  /**
   * Also update any changes to fields to the global entity type schema.
   */
  readonly updateEntitySchema = input<boolean>(true);

  /** Whether to only show fields in a compact layout.
   * If false, the full admin layout with section headers and drag&drop areas is shown.
   */
  readonly fieldsOnlyMode = input<boolean>();

  /**
   * Dummy entity and form backing the form preview.
   * These are signals so that rebuilding them updates the rendered field components,
   * which extend their config (e.g. the label) from the entity type's schema.
   */
  readonly dummyEntity = signal<Entity | undefined>(undefined);
  readonly dummyForm = signal<EntityForm<any> | undefined>(undefined);

  availableFields = linkedSignal<ColumnConfig[]>(() =>
    this.computeAvailableFieldsList(),
  );

  /**
   * Writable working copy of the config's fieldGroups.
   * Derives from the `config` input and can be mutated locally.
   * `availableFields` and `connectedGroups` derive from this signal,
   * so all structural changes automatically propagate.
   */
  fieldGroups = linkedSignal<FormConfig | undefined, FieldGroup[]>({
    source: this.config,
    computation: (config, previous) => {
      const incoming = config?.fieldGroups ?? [];
      if (
        previous &&
        JSON.stringify(previous.value) === JSON.stringify(incoming)
      ) {
        // the config input only re-states what this component emitted itself,
        // so keep the existing objects instead of replacing them with clones
        return previous.value;
      }
      return structuredClone(incoming);
    },
  });
  readonly createNewFieldPlaceholder: FormFieldConfig = {
    id: null,
    label: $localize`:Label drag and drop item:Create New Field`,
  };

  readonly createNewTextPlaceholder: FormFieldConfig = {
    id: null,
    label: $localize`:Label drag and drop item:Create Text Block`,
  };

  /** `cdkDropListData` marking the toolbar as the drop target for fields removed from the form */
  readonly availableFieldsTarget: FieldDropTarget = "available";

  searchFilter = new FormControl("");

  private readonly searchFieldSignal = toSignal(
    this.searchFilter.valueChanges,
    {
      initialValue: "",
    },
  );

  /**
   * Configurations of the fields currently used in the form (null while not initialized yet).
   * The dummy form only has to be rebuilt when these change,
   * not when other details like a field group header are edited.
   */
  private readonly usedFieldConfigurations = computed(() => {
    if (!this.config() || !this.entityType()) {
      return null;
    }
    return JSON.stringify(this.getUsedFields(this.fieldGroups()));
  });

  constructor() {
    effect(() => {
      if (this.usedFieldConfigurations() === null) {
        return;
      }

      // initForm reads several signals that must not re-trigger this effect
      untracked(() => void this.initForm());
    });

    this.adminEntityService.entitySchemaUpdated
      .pipe(untilDestroyed(this))
      .subscribe(() => {
        this.availableFields.set([]); // force re-init of the label components that otherwise do not detect the change
        setTimeout(() => this.initForm());
      });

    // Emit configChange whenever fieldGroups diverges from the input-derived value,
    // i.e. after user-driven mutations but NOT when the config input resets the signal.
    effect(() => {
      const current = this.fieldGroups();
      const config = this.config();
      if (
        config &&
        JSON.stringify(current) !== JSON.stringify(config.fieldGroups)
      ) {
        this.configChange.emit({ ...config, fieldGroups: current });
      }
    });
  }

  /** counter to discard the results of outdated, concurrent initForm calls */
  private initFormVersion = 0;

  private async initForm() {
    const version = ++this.initFormVersion;
    const dummyEntity = new (this.entityType() as any)();

    const dummyForm = await this.entityFormService.createEntityForm(
      [...this.getUsedFields(this.fieldGroups()), ...this.availableFields()],
      dummyEntity,
      this.destroyRef,
    );
    if (version !== this.initFormVersion) {
      // a newer initForm has been started in the meantime, its result takes precedence
      return;
    }

    dummyForm.formGroup.disable();
    // set both together so that entity and form always match
    this.dummyEntity.set(dummyEntity);
    this.dummyForm.set(dummyForm);
  }

  private getUsedFields(fieldGroups: FieldGroup[]): ColumnConfig[] {
    return (fieldGroups ?? []).reduce((p, c) => p.concat(c.fields ?? []), []);
  }

  /**
   * List of group IDs that are connected to the drag&drop area.
   */
  readonly connectedGroups = computed(() => {
    const config = this.config();
    const areaId = this.uniqueAreaId();

    if (!config) {
      return [`newGroupDropArea-${areaId}`];
    }

    return [
      ...this.fieldGroups().map(
        (_, groupIndex) => `${areaId}-group${groupIndex}`,
      ),
      `newGroupDropArea-${areaId}`,
    ];
  });

  /**
   * Load any fields from schema that are not already in the form, so that the user can drag them into the form.
   * @private
   */
  private computeAvailableFieldsList(): ColumnConfig[] {
    const entityType = this.entityType();
    if (!entityType) return [];

    const usedFields = this.getUsedFields(this.fieldGroups()).map((x) =>
      toFormFieldConfig(x),
    );
    const unusedFields = Array.from(entityType.schema.entries())
      .filter(([key]) => !usedFields.some((x) => x.id === key))
      .filter(([key, value]) => !value.isInternalField && value.label) // no technical, internal fields and must have label
      .sort(([aId, a], [bId, b]) => a.label.localeCompare(b.label))
      .map(([key]) => key);

    return [
      this.createNewFieldPlaceholder,
      this.createNewTextPlaceholder,
      ...unusedFields,
    ];
  }

  /**
   * Open the form to edit details of a single field's schema.
   *
   * @param field field to edit or { id: null } to create a new field
   * @returns the id of the field that was edited or created (which is newly defined in the dialog for new fields)
   */
  async openFieldConfig(field: ColumnConfig): Promise<EntitySchemaField> {
    const entitySchemaField = {
      ...this.entityType().schema.get(toFormFieldConfig(field).id),
    } as EntitySchemaField;
    if (field instanceof Object) {
      Object.assign(entitySchemaField, field);
    }

    // prefill with search filter text when creating new field
    if (
      (field === this.createNewFieldPlaceholder ||
        (typeof field === "object" && field.id === null)) &&
      this.searchFilter.value?.trim()
    ) {
      entitySchemaField.label = this.searchFilter.value.trim();
    }

    const dialogRef = this.matDialog.open(AdminEntityFieldComponent, {
      width: "99%",
      maxHeight: "90vh",
      data: {
        entitySchemaField: entitySchemaField,
        entityType: this.entityType(),
        overwriteLocally: this.updateEntitySchema() === false,
      } as AdminEntityFieldData,
    });

    const result = lastValueFrom(dialogRef.afterClosed());

    return result;
  }

  /**
   * Open the form to edit details of a single text's schema.
   *
   * @param textField text to edit or { id: null } to create a new text
   * @returns the id of the text that was edited or created (which is newly defined in the dialog for new fields)
   */
  async openTextConfig(textField: FormFieldConfig): Promise<FormFieldConfig> {
    const dialogRef = this.matDialog.open(
      AdminEditDescriptionOnlyFieldComponent,
      {
        data: textField,
      },
    );

    const result = await lastValueFrom(dialogRef.afterClosed());

    return result;
  }

  /**
   * Move a field that was dragged into a field group or back into the toolbar.
   *
   * Each drop list carries its identity (a field group's index or "available") as
   * `cdkDropListData` and each field carries itself as `cdkDragData`, so that the new
   * `fieldGroups` can be built immutably instead of splicing the arrays CDK hands over.
   */
  async drop(event: FieldDragDropEvent) {
    const target = event.container.data;
    if (target === "available" && this.isNewFieldPlaceholder(event.item.data)) {
      // the "create new" placeholders live in the toolbar already
      return;
    }

    const field = await this.resolveDroppedField(event.item.data);
    if (!field) {
      return;
    }

    this.fieldGroups.update((groups) =>
      moveFieldBetweenGroups(
        groups,
        field,
        event.previousContainer.data,
        event.previousIndex,
        target,
        event.currentIndex,
      ),
    );
  }

  /** Reorder the field groups (the form's columns). */
  dropFieldGroups(event: CdkDragDrop<unknown>) {
    this.fieldGroups.update((groups) => {
      const reordered = [...groups];
      moveItemInArray(reordered, event.previousIndex, event.currentIndex);
      return reordered;
    });
  }

  /**
   * Opens the configuration settings for a field.
   * If the field has an editComponent defined in the schema, it opens the text configuration.
   * Otherwise, it opens the field configuration.
   * @param field The field to open the configuration settings for.
   */
  async openConfigDetails(field: ColumnConfig) {
    let fieldIdToEdit = toFormFieldConfig(field).id;
    const configDetails = Object.assign(
      {},
      this.entityType().schema.get(fieldIdToEdit) ?? {},
      field,
    ) as FormFieldConfig;

    const updatedField =
      configDetails.viewComponent === "DisplayDescriptionOnly"
        ? await this.openTextConfig(configDetails)
        : await this.openFieldConfig(field);

    if (!updatedField) return;

    if (typeof updatedField === "string") {
      this.applySchemaOverride(updatedField, updatedField);
      await this.initForm();
      return;
    }

    if (
      this.updateEntitySchema() === false ||
      configDetails.viewComponent === "DisplayDescriptionOnly"
    ) {
      this.applySchemaOverride(
        updatedField.id,
        updatedField as FormFieldConfig,
      );
      await this.initForm();
    } else {
      // save to entity type's global schema
      this.adminEntityService.updateSchemaField(
        this.entityType(),
        updatedField.id,
        updatedField,
      );
      this.fieldGroups.update((g) => [...g]); // no structural change, but trigger configChange emit
    }
  }

  private applySchemaOverride(
    fieldId: string,
    updatedField: string | FormFieldConfig,
  ): void {
    this.fieldGroups.update((groups) =>
      groups.map((group) => {
        const index = group.fields.findIndex((f) =>
          f instanceof String
            ? f === fieldId
            : toFormFieldConfig(f).id === fieldId,
        );
        if (index === -1) return group;
        const newFields = [...group.fields];
        newFields[index] = updatedField;
        return { ...group, fields: newFields };
      }),
    );
  }

  private isNewFieldPlaceholder(field: ColumnConfig): boolean {
    return (
      field === this.createNewFieldPlaceholder ||
      field === this.createNewTextPlaceholder
    );
  }

  /**
   * The field a drop actually adds to the form: the "create new" placeholders open their config
   * dialog first (returning undefined if the user cancels), any other field is moved as it is.
   */
  private async resolveDroppedField(
    dragged: ColumnConfig,
  ): Promise<ColumnConfig | undefined> {
    if (dragged === this.createNewFieldPlaceholder) {
      return this.createNewField();
    }
    if (dragged === this.createNewTextPlaceholder) {
      return this.createNewTextBlock();
    }
    return dragged;
  }

  /**
   * Define a new field through its config dialog and add it to the entity type's schema.
   * @returns the new field's id, or undefined if the dialog was cancelled
   */
  private async createNewField(): Promise<string | undefined> {
    const newField = await this.openFieldConfig({ id: null });
    if (!newField) {
      return undefined;
    }

    if (this.updateEntitySchema()) {
      this.adminEntityService.updateSchemaField(
        this.entityType(),
        newField.id,
        newField,
      );
    } else {
      // For local-only updates (e.g., public forms), manually update schema
      this.entityType().schema.set(newField.id, newField);
    }
    this.addFieldToPreview(newField.id);

    return newField.id;
  }

  /**
   * Define a new text block through its config dialog.
   * @returns the new text block, or undefined if the dialog was cancelled
   */
  private async createNewTextBlock(): Promise<FormFieldConfig | undefined> {
    const newTextField = await this.openTextConfig({ id: null });
    if (!newTextField) {
      return undefined;
    }
    this.addFieldToPreview(newTextField.id);

    return newTextField;
  }

  /** register a newly created field with the preview form, so that it can be rendered */
  private addFieldToPreview(fieldId: string) {
    const previewForm = this.dummyForm();
    if (!previewForm) {
      return;
    }
    previewForm.formGroup.addControl(fieldId, new FormControl());
    previewForm.formGroup.disable();
  }

  /** Move the dragged field into a new field group appended to the form. */
  async dropNewGroup(event: FieldDragDropEvent) {
    const field = await this.resolveDroppedField(event.item.data);
    if (!field) {
      return;
    }

    this.fieldGroups.update((groups) => {
      const withNewGroup: FieldGroup[] = [...groups, { fields: [] }];
      return moveFieldBetweenGroups(
        withNewGroup,
        field,
        event.previousContainer.data,
        event.previousIndex,
        withNewGroup.length - 1,
        0,
      );
    });
  }

  removeGroup(i: number) {
    this.fieldGroups.update((groups) => groups.filter((_, idx) => idx !== i));
  }

  hideField(field: ColumnConfig, group: FieldGroup) {
    this.fieldGroups.update((groups) =>
      groups.map((g) =>
        g === group ? { ...g, fields: g.fields.filter((f) => f !== field) } : g,
      ),
    );
  }

  updateGroupHeader(i: number, header: string) {
    this.fieldGroups.update((groups) =>
      groups.map((g, idx) => (idx === i ? { ...g, header } : g)),
    );
  }

  filteredFields = computed(() => {
    const searchTerm = this.searchFieldSignal()?.toLowerCase().trim() || "";
    const fields = this.availableFields();

    if (!searchTerm) {
      return fields;
    }

    return fields.filter((field) => {
      // always show the create new field and create new text placeholders
      if (
        field === this.createNewFieldPlaceholder ||
        field === this.createNewTextPlaceholder
      ) {
        return true;
      }

      const fieldConfig =
        this.entityFormService?.extendFormFieldConfig(
          field,
          this.entityType(),
        ) || toFormFieldConfig(field);

      const fieldId = fieldConfig.id?.toLowerCase() || "";
      const fieldLabel = fieldConfig.label?.toLowerCase() || "";

      return fieldId.includes(searchTerm) || fieldLabel.includes(searchTerm);
    });
  });

  clearSearch() {
    this.searchFilter.setValue("");
  }
}

/**
 * Move `field` from one drop target to another, returning new group objects for the groups that
 * changed (all others are kept as they are).
 *
 * A target of "available" is the toolbar of fields not used in the form: it holds no state of its
 * own (it is derived from the form's groups), so a field moved there is simply removed from the
 * form and a field moved from there is simply added.
 */
function moveFieldBetweenGroups(
  groups: FieldGroup[],
  field: ColumnConfig,
  from: FieldDropTarget,
  fromIndex: number,
  to: FieldDropTarget,
  toIndex: number,
): FieldGroup[] {
  return groups.map((group, index) => {
    if (index !== from && index !== to) {
      return group;
    }

    let fields = group.fields ?? [];
    if (index === from) {
      fields = [...fields.slice(0, fromIndex), ...fields.slice(fromIndex + 1)];
    }
    if (index === to) {
      // within the same group, `toIndex` refers to the list without the dragged field
      fields = [...fields.slice(0, toIndex), field, ...fields.slice(toIndex)];
    }
    return { ...group, fields };
  });
}
