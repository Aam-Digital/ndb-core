import { Component, Input, OnChanges, SimpleChanges } from "@angular/core";
import { Entity, EntityConstructor } from "../../entity/model/entity";
import { EntityFormService } from "../../common-components/entity-form/entity-form.service";
import { FormGroup } from "@angular/forms";
import { MatDialog } from "@angular/material/dialog";
import {
  ConfigFieldChange,
  ConfigFieldComponent,
} from "../config-field/config-field.component";
import {
  CdkDragDrop,
  moveItemInArray,
  transferArrayItem,
} from "@angular/cdk/drag-drop";
import { ColumnConfig } from "../../common-components/entity-subrecord/entity-subrecord/entity-subrecord-config";
import { FieldGroup } from "../../entity-details/form/field-group";
import { FormFieldConfig } from "../../common-components/entity-form/entity-form/FormConfig";

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
  ) {}

  ngOnChanges(changes: SimpleChanges): void {
    if (changes.config) {
      this.initDummyForm(this.config);
      this.availableFields = this.initAvailableFields(this.config);
    }
  }

  private initDummyForm(config: FormConfig) {
    this.dummyEntity = new this.entityType();
    this.dummyForm = this.entityFormService.createFormGroup(
      this.getUsedFields(config),
      this.dummyEntity,
    );
    this.dummyForm.disable();
  }

  private getUsedFields(config: FormConfig): ColumnConfig[] {
    return config.fieldGroups.reduce((p, c) => p.concat(c.fields), []);
  }

  private initAvailableFields(config: FormConfig) {
    const usedFields = this.getUsedFields(config);
    const unusedFields = Array.from(this.entityType.schema.entries())
      .filter(
        ([key]) =>
          !usedFields.some(
            (x) => x === key || (x as FormFieldConfig).id === key,
          ),
      )
      .filter(([key, value]) => value.label) // no technical, internal fields
      .map(([key]) => key);

    return [this.createNewFieldPlaceholder, ...unusedFields];
  }

  openFieldConfig(field: ColumnConfig, fieldsArray: any[]) {
    const fieldId = typeof field === "string" ? field : field?.id;
    this.matDialog
      .open(ConfigFieldComponent, {
        width: "99%",
        maxHeight: "90vh",
        data: {
          entitySchemaField: this.entityType.schema.get(fieldId),
          fieldId: fieldId,
          entitySchema: this.entityType.schema,
        },
      })
      .afterClosed()
      .subscribe((updatedFieldSchema: ConfigFieldChange) => {
        if (!updatedFieldSchema) {
          // canceled
          if (!fieldId) {
            // remove newly created field that was canceled
            fieldsArray.splice(fieldsArray.indexOf(field), 1);
          }
          return;
        }

        this.entityType.schema.set(fieldId, updatedFieldSchema.schema);
        this.initDummyForm(this.config);
      });
  }

  drop(event: CdkDragDrop<any, any>) {
    const item = event.previousContainer.data[event.previousIndex];
    if (item.id === null) {
      if (event.container.data === this.availableFields) {
        // don't add new field to the disabled fields
        return;
      }

      const newField = { id: null };
      event.container.data.splice(event.currentIndex, 0, newField);
      this.openFieldConfig(newField, event.container.data);
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
