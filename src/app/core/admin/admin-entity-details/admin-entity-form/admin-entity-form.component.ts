import { Component, Input, OnChanges, SimpleChanges } from "@angular/core";
import { Entity, EntityConstructor } from "../../../entity/model/entity";
import {
  EntityFormService,
  ExtendedEntityForm,
} from "../../../common-components/entity-form/entity-form.service";
import { FormControl } from "@angular/forms";
import { MatDialog } from "@angular/material/dialog";
import { AdminEntityFieldComponent } from "../admin-entity-field/admin-entity-field.component";
import {
  CdkDragDrop,
  DragDropModule,
  moveItemInArray,
  transferArrayItem,
} from "@angular/cdk/drag-drop";
import {
  ColumnConfig,
  FormFieldConfig,
  toFormFieldConfig,
} from "../../../common-components/entity-form/FormConfig";
import { AdminEntityService } from "../../admin-entity.service";
import { lastValueFrom } from "rxjs";
import { NgForOf, NgIf } from "@angular/common";
import { FaIconComponent } from "@fortawesome/angular-fontawesome";
import { MatButtonModule } from "@angular/material/button";
import { MatTooltipModule } from "@angular/material/tooltip";
import { MatCardModule } from "@angular/material/card";
import { EntityFieldLabelComponent } from "../../../common-components/entity-field-label/entity-field-label.component";
import { EntityFieldEditComponent } from "../../../common-components/entity-field-edit/entity-field-edit.component";
import { AdminSectionHeaderComponent } from "../../building-blocks/admin-section-header/admin-section-header.component";
import { UntilDestroy, untilDestroyed } from "@ngneat/until-destroy";
import { FormConfig } from "../../../entity-details/form/form.component";
import { AdminEditDescriptionOnlyFieldComponent } from "../admin-entity-field/admin-edit-description-only-field/admin-edit-description-only-field.component";

@UntilDestroy()
@Component({
  selector: "app-admin-entity-form",
  templateUrl: "./admin-entity-form.component.html",
  styleUrls: [
    "./admin-entity-form.component.scss",
    "../../building-blocks/admin-section-header/admin-section-header.component.scss",
    "../../../common-components/entity-form/entity-form/entity-form.component.scss",
  ],
  standalone: true,
  imports: [
    DragDropModule,
    NgForOf,
    FaIconComponent,
    MatButtonModule,
    MatTooltipModule,
    MatCardModule,
    EntityFieldLabelComponent,
    EntityFieldEditComponent,
    AdminSectionHeaderComponent,
    NgIf,
  ],
})
export class AdminEntityFormComponent implements OnChanges {
  @Input() entityType: EntityConstructor;

  @Input() config: FormConfig;

  dummyEntity: Entity;
  dummyForm: ExtendedEntityForm<any>;

  availableFields: ColumnConfig[] = [];
  readonly createNewFieldPlaceholder: FormFieldConfig = {
    id: null,
    label: $localize`:Label drag and drop item:Create New Field`,
  };

  readonly createNewTextPlaceholder: FormFieldConfig = {
    id: null,
    label: $localize`:Label drag and drop item:Create Text Block`,
  };

  constructor(
    private entityFormService: EntityFormService,
    private matDialog: MatDialog,
    adminEntityService: AdminEntityService,
  ) {
    adminEntityService.entitySchemaUpdated
      .pipe(untilDestroyed(this))
      .subscribe(() => {
        this.availableFields = []; // force re-init of the label components that otherwise do not detect the change
        setTimeout(() => this.initForm());
      });
  }

  async ngOnChanges(changes: SimpleChanges): Promise<void> {
    if (changes.config) {
      await this.initForm();
    }
  }

  private async initForm() {
    this.initAvailableFields();

    this.dummyEntity = new this.entityType();
    this.dummyForm = await this.entityFormService.createExtendedEntityForm(
      [...this.getUsedFields(this.config), ...this.availableFields],
      this.dummyEntity,
    );
    this.dummyForm.formGroup.disable();
  }

  private getUsedFields(config: FormConfig): ColumnConfig[] {
    return config.fieldGroups.reduce((p, c) => p.concat(c.fields), []);
  }

  /**
   * Load any fields from schema that are not already in the form, so that the user can drag them into the form.
   * @param config
   * @private
   */
  private initAvailableFields() {
    const usedFields = this.getUsedFields(this.config);
    const unusedFields = Array.from(this.entityType.schema.entries())
      .filter(
        ([key]) =>
          !usedFields.some(
            (x) => x === key || (x as FormFieldConfig).id === key,
          ),
      )
      .filter(([key, value]) => value.label) // no technical, internal fields
      .sort(([aId, a], [bId, b]) => a.label.localeCompare(b.label))
      .map(([key]) => key);

    this.availableFields = [
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
  async openFieldConfig(field: ColumnConfig): Promise<string> {
    let fieldIdToEdit = toFormFieldConfig(field).id;
    const dialogRef = this.matDialog.open(AdminEntityFieldComponent, {
      width: "99%",
      maxHeight: "90vh",
      data: {
        fieldId: fieldIdToEdit,
        entityType: this.entityType,
      },
    });
    return lastValueFrom(dialogRef.afterClosed());
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

    if (newFieldsArray === this.availableFields) {
      // ensure available fields have consistent order
      this.initAvailableFields();
    }
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

    if (configDetails.editComponent == "EditDescriptionOnly") {
      const updatedField = await this.openTextConfig(configDetails);
      Object.assign(field, updatedField);
      this.initForm();
    } else {
      await this.openFieldConfig(field);
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

    const newFieldId = await this.openFieldConfig({ id: null });
    if (!newFieldId) {
      return;
    }

    this.dummyForm.formGroup.addControl(newFieldId, new FormControl());
    this.dummyForm.formGroup.disable();
    event.container.data.splice(event.currentIndex, 0, newFieldId);

    // the schema update has added the new field to the available fields already, remove it from there
    this.availableFields.splice(this.availableFields.indexOf(newFieldId), 1);
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
  }

  dropNewGroup(event: CdkDragDrop<any, any>) {
    const newCol = { fields: [] };
    this.config.fieldGroups.push(newCol);
    event.container.data = newCol.fields;
    this.drop(event);
  }

  removeGroup(i: number) {
    const [removedFieldGroup] = this.config.fieldGroups.splice(i, 1);
    this.initAvailableFields();
  }
}
