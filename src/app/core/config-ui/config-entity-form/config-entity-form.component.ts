import { Component, Input, OnChanges, SimpleChanges } from "@angular/core";
import { Entity, EntityConstructor } from "../../entity/model/entity";
import { EntityFormService } from "../../common-components/entity-form/entity-form.service";
import { FormControl, FormGroup } from "@angular/forms";
import { MatDialog } from "@angular/material/dialog";
import { ConfigFieldComponent } from "../config-field/config-field.component";
import {
  CdkDragDrop,
  moveItemInArray,
  transferArrayItem,
} from "@angular/cdk/drag-drop";
import {
  ColumnConfig,
  toFormFieldConfig,
} from "../../common-components/entity-subrecord/entity-subrecord/entity-subrecord-config";
import { FieldGroup } from "../../entity-details/form/field-group";
import { FormFieldConfig } from "../../common-components/entity-form/entity-form/FormConfig";
import { AdminEntityService } from "../admin-entity.service";
import { lastValueFrom } from "rxjs";

// TODO: we wanted to remove the interfaces implemented by components - do we reintroduce them again for the Admin UI?
export interface FormConfig {
  fieldGroups: FieldGroup[];
}

@Component({
  selector: "app-config-entity-form",
  templateUrl: "./config-entity-form.component.html",
  styleUrls: [
    "./config-entity-form.component.scss",
    "../config-section-header/config-section-header.component.scss",
    "../../common-components/entity-form/entity-form/entity-form.component.scss",
  ],
})
export class ConfigEntityFormComponent implements OnChanges {
  @Input() entityType: EntityConstructor;

  @Input() config: FormConfig;

  dummyEntity: Entity;
  dummyForm: FormGroup;

  availableFields: ColumnConfig[] = [];
  readonly createNewFieldPlaceholder: FormFieldConfig = {
    id: null,
    label: "Create New Field",
  };

  constructor(
    private entityFormService: EntityFormService,
    private matDialog: MatDialog,
    adminEntityService: AdminEntityService,
  ) {
    adminEntityService.entitySchemaUpdated.subscribe(() =>
      this.initDummyForm(),
    );
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes.config) {
      this.initAvailableFields();
      this.initDummyForm();
    }
  }

  private initDummyForm() {
    this.dummyEntity = new this.entityType();
    this.dummyForm = this.entityFormService.createFormGroup(
      [...this.getUsedFields(this.config), ...this.availableFields],
      this.dummyEntity,
    );
    this.dummyForm.disable();
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
      .map(([key]) => key);

    this.availableFields = [this.createNewFieldPlaceholder, ...unusedFields];
  }

  /**
   * Open the form to edit details of a single field's schema.
   *
   * @param field field to edit or { id: null } to create a new field
   * @returns the id of the field that was edited or created (which is newly defined in the dialog for new fields)
   */
  async openFieldConfig(field: ColumnConfig): Promise<string> {
    let fieldIdToEdit = toFormFieldConfig(field).id;
    const dialogRef = this.matDialog.open(ConfigFieldComponent, {
      width: "99%",
      maxHeight: "90vh",
      data: {
        entitySchemaField: this.entityType.schema.get(fieldIdToEdit),
        fieldId: fieldIdToEdit,
        entityType: this.entityType,
      },
    });
    return lastValueFrom(dialogRef.afterClosed());
  }

  drop(event: CdkDragDrop<ColumnConfig[], ColumnConfig[]>) {
    if (
      event.previousContainer.data[event.previousIndex] ===
      this.createNewFieldPlaceholder
    ) {
      this.dropNewField(event);
      return;
    }

    if (event.previousContainer === event.container) {
      moveItemInArray(
        event.container.data,
        event.previousIndex,
        event.currentIndex,
      );
    } else {
      transferArrayItem(
        event.previousContainer.data,
        event.container.data,
        event.previousIndex,
        event.currentIndex,
      );
    }

    if (
      event.container.data === this.availableFields &&
      event.currentIndex === 0
    ) {
      // ensure "create new field" is always first
      moveItemInArray(event.container.data, event.currentIndex, 1);
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
      // don't add new field to the disabled fields
      return;
    }

    const newFieldId = await this.openFieldConfig({ id: null });
    if (!newFieldId) {
      return;
    }

    this.dummyForm.addControl(newFieldId, new FormControl());
    this.dummyForm.disable();
    event.container.data.splice(event.currentIndex, 0, newFieldId);
  }

  dropNewGroup(event: CdkDragDrop<any, any>) {
    const newCol = { fields: [] };
    this.config.fieldGroups.push(newCol);
    event.container.data = newCol.fields;
    this.drop(event);
  }

  removeGroup(i: number) {
    const [removedFieldGroup] = this.config.fieldGroups.splice(i, 1);
    this.availableFields.push(...removedFieldGroup.fields);
  }
}
