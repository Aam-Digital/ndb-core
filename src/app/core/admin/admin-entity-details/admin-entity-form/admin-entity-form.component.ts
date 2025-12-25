import { EntityForm } from "#src/app/core/common-components/entity-form/entity-form";
import {
  CdkDragDrop,
  DragDropModule,
  moveItemInArray,
  transferArrayItem,
} from "@angular/cdk/drag-drop";
import {
  Component,
  computed,
  EventEmitter,
  inject,
  Input,
  OnChanges,
  Output,
  signal,
  SimpleChanges,
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
export class AdminEntityFormComponent implements OnChanges {
  private entityFormService = inject(EntityFormService);
  private matDialog = inject(MatDialog);
  private adminEntityService = inject(AdminEntityService);

  @Input() entityType: EntityConstructor;

  /**
   * Unique identifier for the drag-and-drop area to ensure correct drag&drop behavior.
   * (e.g. a combination of tabindex and section index)
   */
  @Input() uniqueAreaId: string;

  @Input() set config(value: FormConfig) {
    if (value === this._config) {
      // may be caused by two-way binding re-inputting the recently emitted change
      // skip in this case
      return;
    }

    // assign default value and make a deep copy to avoid side effects
    if (!value) {
      value = { fieldGroups: [] };
    }
    value = JSON.parse(JSON.stringify(value));
    if (!value.fieldGroups) {
      value.fieldGroups = [];
    }

    this._config = value;
  }

  get config(): FormConfig {
    return this._config;
  }

  private _config: FormConfig;

  @Output() configChange = new EventEmitter<FormConfig>();

  /**
   * Whether the UI is readonly, not allowing the user to drag or edit things.
   */
  @Input() isDisabled: boolean = false;

  /**
   * Also update any changes to fields to the global entity type schema.
   */
  @Input() updateEntitySchema?: boolean = true;

  /** Whether to only show fields in a compact layout.
   * If false, the full admin layout with section headers and drag&drop areas is shown.
   */
  @Input() fieldsOnlyMode?: boolean = false;

  dummyEntity: Entity;
  dummyForm: EntityForm<any>;

  availableFields: ColumnConfig[] = [];
  readonly createNewFieldPlaceholder: FormFieldConfig = {
    id: null,
    label: $localize`:Label drag and drop item:Create New Field`,
  };

  readonly createNewTextPlaceholder: FormFieldConfig = {
    id: null,
    label: $localize`:Label drag and drop item:Create Text Block`,
  };

  searchFilter = new FormControl("");
  private searchTermSignal = toSignal(this.searchFilter.valueChanges, {
    initialValue: "",
  });
  private availableFieldsSignal = signal<ColumnConfig[]>([]);
  filteredFields = computed(() => {
    const searchTerm = this.searchTermSignal()?.toLowerCase().trim() || "";
    const fields = this.availableFieldsSignal();

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

      // Get field config to access both id and label
      const fieldConfig =
        this.entityFormService?.extendFormFieldConfig(field, this.entityType) ||
        toFormFieldConfig(field);

      const fieldId = fieldConfig.id?.toLowerCase() || "";
      const fieldLabel = fieldConfig.label?.toLowerCase() || "";

      return fieldId.includes(searchTerm) || fieldLabel.includes(searchTerm);
    });
  });

  constructor() {
    const adminEntityService = inject(AdminEntityService);

    adminEntityService.entitySchemaUpdated
      .pipe(untilDestroyed(this))
      .subscribe(() => {
        this.availableFields = []; // force re-init of the label components that otherwise do not detect the change
        setTimeout(() => this.initForm());
      });
  }

  async ngOnChanges(changes: SimpleChanges): Promise<void> {
    if (Object.hasOwn(changes, "config")) {
      await this.initForm();
    }
  }

  private async initForm() {
    this.initAvailableFields();

    this.dummyEntity = new this.entityType();
    this.dummyForm = await this.entityFormService.createEntityForm(
      [...this.getUsedFields(this.config), ...this.availableFields],
      this.dummyEntity,
    );
    this.dummyForm.formGroup.disable();
  }

  private getUsedFields(config: FormConfig): ColumnConfig[] {
    return config.fieldGroups.reduce((p, c) => p.concat(c.fields), []);
  }

  /**
   * Returns a list of group IDs that are connected to the drag&drop area.
   * This is used to determine which groups are connected to the drag&drop area.
   */
  getConnectedGroups(): string[] {
    return [
      ...this.config.fieldGroups.map(
        (_, groupIndex) => `${this.uniqueAreaId}-group${groupIndex}`,
      ),
      `newGroupDropArea-${this.uniqueAreaId}`,
    ];
  }

  /**
   * Load any fields from schema that are not already in the form, so that the user can drag them into the form.
   * @param config
   * @private
   */
  private initAvailableFields() {
    const usedFields = this.getUsedFields(this.config).map((x) =>
      toFormFieldConfig(x),
    );
    const unusedFields = Array.from(this.entityType.schema.entries())
      .filter(([key]) => !usedFields.some((x) => x.id === key))
      .filter(([key, value]) => !value.isInternalField) // no technical, internal fields
      .sort(([aId, a], [bId, b]) => a.label.localeCompare(b.label))
      .map(([key]) => key);

    this.availableFields = [
      this.createNewFieldPlaceholder,
      this.createNewTextPlaceholder,
      ...unusedFields,
    ];

    this.availableFieldsSignal.set(this.availableFields);
  }

  protected emitUpdatedConfig() {
    this.configChange.emit(this.config);
  }

  /**
   * Open the form to edit details of a single field's schema.
   *
   * @param field field to edit or { id: null } to create a new field
   * @returns the id of the field that was edited or created (which is newly defined in the dialog for new fields)
   */
  async openFieldConfig(field: ColumnConfig): Promise<EntitySchemaField> {
    const entitySchemaField = {
      ...this.entityType.schema.get(toFormFieldConfig(field).id),
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
        entityType: this.entityType,
        overwriteLocally: !this.updateEntitySchema,
        prefillIdFromLabel: true,
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
    this.emitUpdatedConfig();

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

    if (newFieldsArray === this.availableFields) {
      // ensure available fields have consistent order
      this.initAvailableFields();
    }

    this.emitUpdatedConfig();
  }

  dropfieldGroups<E>(event: CdkDragDrop<E[], any>, fieldGroupsArray: E[]) {
    moveItemInArray(fieldGroupsArray, event.previousIndex, event.currentIndex);

    this.emitUpdatedConfig();
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
      this.entityType.schema.get(fieldIdToEdit) ?? {},
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
      this.emitUpdatedConfig();
      return;
    }

    if (
      !this.updateEntitySchema ||
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
        this.entityType,
        updatedField.id,
        updatedField,
      );
    }
    this.emitUpdatedConfig();
  }

  private applySchemaOverride(
    fieldId: string,
    updatedField: string | FormFieldConfig,
  ): void {
    for (const group of this.config.fieldGroups) {
      const index = group.fields.findIndex((f) =>
        f instanceof String
          ? f === fieldId
          : toFormFieldConfig(f).id === fieldId,
      );
      if (index !== -1) {
        group.fields[index] = updatedField;
      }
    }
  }

  /**
   * drop handler specifically for the "create new field" item
   * @param event
   * @private
   */
  private async dropNewField(
    event: CdkDragDrop<ColumnConfig[], ColumnConfig[]>,
  ) {
    if (event.container.data === this.availableFields) {
      // don't add new field to the available fields that are not in the form yet
      return;
    }

    const newField = await this.openFieldConfig({ id: null });
    if (!newField) {
      return;
    }

    const newFieldId = newField.id;

    if (this.updateEntitySchema) {
      this.adminEntityService.updateSchemaField(
        this.entityType,
        newField.id,
        newField,
      );
      // the schema update has added the new field to the available fields already, remove it from there
      this.availableFields.splice(this.availableFields.indexOf(newFieldId), 1);
    } else {
      // For local-only updates (e.g., public forms), manually update schema
      this.entityType.schema.set(newField.id, newField);
      const fieldIndex = this.availableFields.indexOf(newFieldId);
      if (fieldIndex !== -1) {
        this.availableFields.splice(fieldIndex, 1);
      }
    }

    this.dummyForm.formGroup.addControl(newFieldId, new FormControl());
    this.dummyForm.formGroup.disable();
    event.container.data.splice(event.currentIndex, 0, newFieldId);

    this.emitUpdatedConfig();
  }

  /**
   * drop handler specifically for the "create new Text field" item
   * @param event
   * @private
   */
  private async dropNewText(
    event: CdkDragDrop<ColumnConfig[], ColumnConfig[]>,
  ) {
    if (event.container.data === this.availableFields) {
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

    // the schema update has added the new Text field to the available fields already, remove it from there
    this.availableFields.splice(this.availableFields.indexOf(newTextField), 1);

    this.emitUpdatedConfig();
  }

  dropNewGroup(event: CdkDragDrop<any, any>) {
    const newCol = { fields: [] };
    this.config.fieldGroups.push(newCol);
    event.container.data = newCol.fields;
    this.drop(event);
  }

  removeGroup(i: number) {
    this.config.fieldGroups.splice(i, 1);
    this.initAvailableFields();

    this.emitUpdatedConfig();
  }

  hideField(field: ColumnConfig, group: FieldGroup) {
    const fieldIndex = group.fields.indexOf(field);
    group.fields.splice(fieldIndex, 1);
    this.initAvailableFields();

    this.emitUpdatedConfig();
  }
}
