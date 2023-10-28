import { Component, Input, OnChanges, SimpleChanges } from "@angular/core";
import { EntityFormConfig } from "../../common-components/entity-form/entity-form/entity-form.component";
import { Entity, EntityConstructor } from "../../entity/model/entity";
import { FormConfig } from "../../entity-details/form/form.component";
import { EntityFormService } from "../../common-components/entity-form/entity-form.service";
import { FormGroup } from "@angular/forms";
import { FormFieldConfig } from "../../common-components/entity-form/entity-form/FormConfig";
import { MatDialog } from "@angular/material/dialog";
import { ConfigFieldComponent } from "../config-field/config-field.component";

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
  fullConfig: EntityFormConfig;

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
    this.fullConfig = {
      columns: config.cols.map((fields) =>
        this.entityFormService.extendFormFieldConfig(fields, this.entityType),
      ),
      columnHeaders: config.headers,
    };

    this.dummyEntity = new this.entityType();
    this.dummyForm = this.entityFormService.createFormGroup(
      [].concat(...this.fullConfig.columns),
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
}
