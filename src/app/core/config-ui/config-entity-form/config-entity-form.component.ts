import { Component, Input, OnChanges, SimpleChanges } from "@angular/core";
import { Entity, EntityConstructor } from "../../entity/model/entity";
import { FormConfig } from "../../entity-details/form/form.component";
import { EntityFormService } from "../../common-components/entity-form/entity-form.service";
import { FormGroup } from "@angular/forms";
import { FormFieldConfig } from "../../common-components/entity-form/entity-form/FormConfig";
import { MatDialog } from "@angular/material/dialog";
import { ConfigFieldComponent } from "../config-field/config-field.component";
import {
  CdkDragDrop,
  moveItemInArray,
  transferArrayItem,
} from "@angular/cdk/drag-drop";
import { EntitySchema } from "../../entity/schema/entity-schema";
import { EntitySchemaField } from "../../entity/schema/entity-schema-field";

// TODO: adapt EntitySchemaField interface?
export type EntitySchemaField_withId = EntitySchemaField & { id: string };

@Component({
  selector: "app-config-entity-form",
  templateUrl: "./config-entity-form.component.html",
  styleUrls: [
    "./config-entity-form.component.scss",
    "../../common-components/entity-form/entity-form/entity-form.component.scss",
  ],
})
export class ConfigEntityFormComponent implements OnChanges {
  @Input() entityType: EntityConstructor;
  entitySchema: EntitySchema;

  @Input() config: FormConfig;
  fieldGroups: FieldGroup[]; // TODO: maybe change the config itself to reflect this structure?

  dummyEntity: Entity;
  dummyForm: FormGroup;
  availableFields: any[] = [{ id: null, label: "Create New Field" }];

  constructor(
    private entityFormService: EntityFormService,
    private matDialog: MatDialog,
  ) {}

  ngOnChanges(changes: SimpleChanges): void {
    if (changes.config) {
      this.prepareConfig(this.config);
    }
    if (changes.entityType) {
      this.entitySchema = this.entityType?.schema;
    }
  }

  private prepareConfig(config: FormConfig) {
    this.fieldGroups = [];
    for (let i = 0; i < config.cols.length; i++) {
      this.fieldGroups.push({
        header: config.headers?.[i],
        fields: this.entityFormService.extendFormFieldConfig(
          config.cols[i],
          this.entityType,
        ),
      });
    }

    this.dummyEntity = new this.entityType();
    this.dummyForm = this.entityFormService.createFormGroup(
      this.fieldGroups.reduce((p, c) => p.concat(c.fields), []),
      this.dummyEntity,
    );
    this.dummyForm.disable();
  }

  openFieldConfig(field: FormFieldConfig, fieldsArray: any[]) {
    const schemaField = {
      ...this.entitySchema.get(field.id),
      id: field.id, // TODO: include id in EntitySchemaField and align FormFieldConfig completely for direct override?
    };

    this.matDialog
      .open(ConfigFieldComponent, {
        width: "99%",
        maxHeight: "90vh",
        data: {
          entitySchemaField: schemaField,
          entitySchema: this.entitySchema,
        },
      })
      .afterClosed()
      .subscribe((updatedFieldSchema: EntitySchemaField_withId) => {
        if (!updatedFieldSchema) {
          // canceled
          if (!field.id) {
            // remove newly created field that was canceled
            fieldsArray.splice(fieldsArray.indexOf(field), 1);
          }
          return;
        }

        const updatedFormField = this.saveSchemaField(updatedFieldSchema);
        fieldsArray.splice(fieldsArray.indexOf(field), 1, updatedFormField);
      });
  }

  private saveSchemaField(
    schemaField: EntitySchemaField_withId,
  ): FormFieldConfig {
    this.entitySchema.set(schemaField.id, schemaField);

    const updatedFormField = this.entityFormService.addSchemaToFormField(
      { id: schemaField.id },
      schemaField,
      false,
    );
    if (!this.dummyForm.get(schemaField.id)) {
      const newFormGroup = this.entityFormService.createFormGroup(
        [updatedFormField],
        this.dummyEntity,
      );
      this.dummyForm.addControl(
        schemaField.id,
        newFormGroup.get(schemaField.id),
      );
      this.dummyForm.disable();
    }

    return updatedFormField;
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
    this.fieldGroups.push(newCol);
    event.container.data = newCol.fields;
    this.drop(event);
  }

  removeGroup(i: number) {
    const [removedFieldGroup] = this.fieldGroups.splice(i, 1);
    this.availableFields.push(...removedFieldGroup.fields);
  }
}

export interface FieldGroup {
  header?: string;
  fields: FormFieldConfig[];
}
