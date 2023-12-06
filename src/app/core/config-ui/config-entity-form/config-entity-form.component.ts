import { Component, Input, OnChanges, SimpleChanges } from "@angular/core";
import { Entity, EntityConstructor } from "../../entity/model/entity";
import { EntityFormService } from "../../common-components/entity-form/entity-form.service";
import { FormGroup } from "@angular/forms";
import { MatDialog } from "@angular/material/dialog";
import { ConfigFieldComponent } from "../config-field/config-field.component";
import {
  CdkDragDrop,
  moveItemInArray,
  transferArrayItem,
} from "@angular/cdk/drag-drop";
import { ColumnConfig } from "../../common-components/entity-subrecord/entity-subrecord/entity-subrecord-config";
import { FieldGroup } from "../../entity-details/form/field-group";
import { FormFieldConfig } from "../../common-components/entity-form/entity-form/FormConfig";
import { AdminEntityService } from "../admin-entity.service";

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

  availableFields: ColumnConfig[];
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
      this.initDummyForm();
      this.initAvailableFields();
    }
  }

  private initDummyForm() {
    this.dummyEntity = new this.entityType();
    this.dummyForm = this.entityFormService.createFormGroup(
      this.getUsedFields(this.config),
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

  openFieldConfig(field: ColumnConfig, fieldsArray: any[]) {
    const fieldIdToEdit = typeof field === "string" ? field : field?.id;
    this.matDialog
      .open(ConfigFieldComponent, {
        width: "99%",
        maxHeight: "90vh",
        data: {
          entitySchemaField: this.entityType.schema.get(fieldIdToEdit),
          fieldId: fieldIdToEdit,
          entityType: this.entityType,
        },
      })
      .afterClosed()
      .subscribe((newFieldId: string) => {
        if (fieldIdToEdit) {
          // edited existing field, no further action required
          return;
        }

        if (newFieldId) {
          fieldsArray.splice(fieldsArray.indexOf(field), 1, newFieldId);
        } else {
          // canceled, remove newly created field that was canceled
          fieldsArray.splice(fieldsArray.indexOf(field), 1);
        }
      });
  }

  drop(event: CdkDragDrop<ColumnConfig[], ColumnConfig[]>) {
    const item = event.previousContainer.data[event.previousIndex];
    if (typeof item === "object" && item.id === null) {
      if (event.container.data === this.availableFields) {
        // don't add new field to the disabled fields
        return;
      }

      this.addNewField(event);
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

  private addNewField(event: CdkDragDrop<ColumnConfig[], ColumnConfig[]>) {
    const newFieldPlaceholder = { id: null }; // will be replaced with the new field id after user saves field config
    event.container.data.splice(event.currentIndex, 0, newFieldPlaceholder);
    this.openFieldConfig(newFieldPlaceholder, event.container.data);
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
