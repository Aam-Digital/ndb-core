import {
  Component,
  EventEmitter,
  Input,
  OnChanges,
  Output,
  SimpleChanges,
} from "@angular/core";
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
import { EntitySchemaField } from "../../entity/schema/entity-schema-field";
import { ColumnConfig } from "../../common-components/entity-subrecord/entity-subrecord/entity-subrecord-config";
import { FormConfig } from "../../entity-details/form/form-config";

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

  @Input() config: FormConfig;

  @Output() entitySchemaFieldChange = new EventEmitter<EntitySchemaField>();

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
  }

  private prepareConfig(config: FormConfig) {
    this.dummyEntity = new this.entityType();
    this.dummyForm = this.entityFormService.createFormGroup(
      config.fieldGroups.reduce((p, c) => p.concat(c.fields), []),
      this.dummyEntity,
    );
    this.dummyForm.disable();
  }

  openFieldConfig(field: ColumnConfig, fieldsArray: any[]) {
    const fieldId = typeof field === "string" ? field : field?.id;
    const schemaField = {
      ...this.entityType.schema.get(fieldId),
      id: fieldId,
    };

    this.matDialog
      .open(ConfigFieldComponent, {
        width: "99%",
        maxHeight: "90vh",
        data: {
          entitySchemaField: schemaField,
          entitySchema: this.entityType.schema,
        },
      })
      .afterClosed()
      .subscribe((updatedFieldSchema: EntitySchemaField) => {
        if (!updatedFieldSchema) {
          // canceled
          if (!fieldId) {
            // remove newly created field that was canceled
            fieldsArray.splice(fieldsArray.indexOf(field), 1);
          }
          return;
        }

        const updatedFormField = this.saveSchemaField(updatedFieldSchema);
        fieldsArray.splice(fieldsArray.indexOf(field), 1, updatedFormField);
      });
  }

  private saveSchemaField(schemaField: EntitySchemaField): ColumnConfig {
    this.entityType.schema.set(schemaField.id, schemaField);
    this.entitySchemaFieldChange.emit(schemaField);

    if (!this.dummyForm.get(schemaField.id)) {
      const newFormGroup = this.entityFormService.createFormGroup(
        [schemaField],
        this.dummyEntity,
      );
      this.dummyForm.addControl(
        schemaField.id,
        newFormGroup.get(schemaField.id),
      );
      this.dummyForm.disable();
    }

    return schemaField;
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
