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
  fieldGroups: { header?: string; fields: FormFieldConfig[] }[]; // TODO: maybe change the config itself to reflect this structure?

  dummyEntity: Entity;
  dummyForm: FormGroup;

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

  openFieldConfig(field: FormFieldConfig) {
    this.matDialog.open(ConfigFieldComponent, {
      width: "99%",
      maxHeight: "90vh",
      data: { formFieldConfig: field, entityType: this.entityType },
    });
  }

  drop(event: CdkDragDrop<any, any>) {
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

    console.log(this.fieldGroups);
  }

  dropNewGroup(event: CdkDragDrop<any, any>) {
    const newCol = { fields: [] };
    this.fieldGroups.push(newCol);
    event.container.data = newCol.fields;
    this.drop(event);
  }

  removeGroup(i: number) {
    this.fieldGroups.splice(i, 1);
  }
}
