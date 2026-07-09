import { EntityForm } from "#src/app/core/common-components/entity-form/entity-form";
import {
  CdkDragDrop,
  DragDropModule,
  moveItemInArray,
  transferArrayItem,
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

  dummyEntity: Entity;
  dummyForm: EntityForm<any>;

  availableFields = linkedSignal<ColumnConfig[]>(() =>
    this.computeAvailableFieldsList(),
  );

  /**
   * Writable working copy of the config's fieldGroups.
   * Derives from the `config` input and can be mutated locally.
   * `availableFields` and `connectedGroups` derive from this signal,
   * so all structural changes automatically propagate.
   */
  fieldGroups = linkedSignal<FieldGroup[]>(() =>
    structuredClone(this.config()?.fieldGroups ?? []),
  );
  readonly createNewFieldPlaceholder: FormFieldConfig = {
    id: null,
    label: $localize`:Label drag and drop item:Create New Field`,
  };

  readonly createNewTextPlaceholder: FormFieldConfig = {
    id: null,
    label: $localize`:Label drag and drop item:Create Text Block`,
  };

  searchFilter = new FormControl("");

  private readonly searchFieldSignal = toSignal(
    this.searchFilter.valueChanges,
    {
      initialValue: "",
    },
  );

  constructor() {
    effect(() => {
      const config = this.config();
      const entityType = this.entityType();

      if (!config || !entityType) {
        return;
      }

      void this.initForm();
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

  private async initForm() {
    this.dummyEntity = new (this.entityType() as any)();
    this.dummyForm = await this.entityFormService.createEntityForm(
      [...this.getUsedFields(this.fieldGroups()), ...this.availableFields()],
      this.dummyEntity,
      this.destroyRef,
    );
    this.dummyForm.formGroup.disable();
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

  drop(event: CdkDragDrop<ColumnConfig[], ColumnConfig[]>) {
    const prevFieldsArray = event.previousContainer.data;
    const newFieldsArray = event.container.data;

    if (
      prevFieldsArray[event.previousIndex] === this.createNewFieldPlaceholder
    ) {
      this.dropNewField(event);
      return;
    }

    if (
      prevFieldsArray[event.previousIndex] === this.createNewTextPlaceholder
    ) {
      this.dropNewText(event);
      return;
    }

    if (event.previousContainer === event.container) {
      moveItemInArray(newFieldsArray, event.previousIndex, event.currentIndex);
    } else {
      transferArrayItem(
        prevFieldsArray,
        newFieldsArray,
        event.previousIndex,
        event.currentIndex,
      );
    }

    this.fieldGroups.update((g) => [...g]);
  }

  dropfieldGroups<E>(event: CdkDragDrop<E[], any>, fieldGroupsArray: E[]) {
    moveItemInArray(fieldGroupsArray, event.previousIndex, event.currentIndex);
    this.fieldGroups.update((g) => [...g]);
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

  /**
   * drop handler specifically for the "create new field" item
   * @param event
   * @private
   */
  private async dropNewField(
    event: CdkDragDrop<ColumnConfig[], ColumnConfig[]>,
  ) {
    if (event.container.data === this.availableFields()) {
      // don't add new field to the available fields that are not in the form yet
      return;
    }

    const newField = await this.openFieldConfig({ id: null });
    if (!newField) {
      return;
    }

    const newFieldId = newField.id;

    if (this.updateEntitySchema()) {
      this.adminEntityService.updateSchemaField(
        this.entityType(),
        newField.id,
        newField,
      );
      // the schema update has added the new field to the available fields already, remove it from there
      const updatedFields = [...this.availableFields()];
      updatedFields.splice(updatedFields.indexOf(newFieldId), 1);
      this.availableFields.set(updatedFields);
    } else {
      // For local-only updates (e.g., public forms), manually update schema
      this.entityType().schema.set(newField.id, newField);
      const updatedFields = [...this.availableFields()];
      const fieldIndex = updatedFields.indexOf(newFieldId);
      if (fieldIndex !== -1) {
        updatedFields.splice(fieldIndex, 1);
        this.availableFields.set(updatedFields);
      }
    }

    this.dummyForm.formGroup.addControl(newFieldId, new FormControl());
    this.dummyForm.formGroup.disable();
    event.container.data.splice(event.currentIndex, 0, newFieldId);
    this.fieldGroups.update((g) => [...g]); // notify signal of in-place mutation
  }

  /**
   * drop handler specifically for the "create new Text field" item
   * @param event
   * @private
   */
  private async dropNewText(
    event: CdkDragDrop<ColumnConfig[], ColumnConfig[]>,
  ) {
    if (event.container.data === this.availableFields()) {
      // don't add new Text field to the available fields that are not in the form yet
      return;
    }

    const newTextField = await this.openTextConfig({ id: null });
    if (!newTextField) {
      return;
    }

    this.dummyForm.formGroup.addControl(newTextField.id, new FormControl());
    this.dummyForm.formGroup.disable();
    event.container.data.splice(event.currentIndex, 0, newTextField);
    this.fieldGroups.update((g) => [...g]);

    // the schema update has added the new Text field to the available fields already, remove it from there
    this.availableFields.update((fields) =>
      fields.filter((f) =>
        typeof f === "string"
          ? f !== newTextField.id
          : f.id !== newTextField.id,
      ),
    );
  }

  dropNewGroup(event: CdkDragDrop<any, any>) {
    const newCol: FieldGroup = { fields: [] };
    this.fieldGroups.update((groups) => [...groups, newCol]);
    event.container.data = newCol.fields;
    this.drop(event);
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
