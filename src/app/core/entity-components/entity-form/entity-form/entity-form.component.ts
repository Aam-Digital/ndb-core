import { Component, OnInit } from "@angular/core";
import { OnInitDynamicComponent } from "../../../view/dynamic-components/on-init-dynamic-component.interface";
import { Entity } from "../../../entity/entity";
import { OperationType } from "../../../permissions/entity-permissions.service";
import { FormFieldConfig } from "./FormConfig";
import { FormGroup } from "@angular/forms";
import { EntityFormService } from "../entity-form.service";
import { EntityMapperService } from "../../../entity/entity-mapper.service";
import { AlertService } from "../../../alerts/alert.service";
import { Router } from "@angular/router";
import { PanelConfig } from "../../entity-details/EntityDetailsConfig";
import { getParentUrl } from "../../../../utils/utils";

@Component({
  selector: "app-entity-form",
  templateUrl: "./entity-form.component.html",
  styleUrls: ["./entity-form.component.scss"],
})
export class EntityFormComponent implements OnInitDynamicComponent, OnInit {
  entity: Entity;

  operationType = OperationType;

  creatingNew = false;

  columns: FormFieldConfig[][] = [];
  form: FormGroup;

  constructor(
    private entityFormService: EntityFormService,
    private entityMapperService: EntityMapperService,
    private alertService: AlertService,
    private router: Router
  ) {}

  ngOnInit() {
    this.buildFormConfig();
    if (this.creatingNew) {
      this.switchEdit();
    }
  }

  onInitFromDynamicConfig(config: PanelConfig) {
    this.entity = config.entity;
    this.columns = config.config?.cols;
    if (config.creatingNew) {
      this.creatingNew = true;
    }
    this.ngOnInit();
  }

  switchEdit() {
    if (this.form.disabled) {
      this.form.enable();
    } else {
      this.form.disable();
    }
  }

  async save(): Promise<void> {
    await this.entityFormService.saveChanges(this.form, this.entity);
    this.switchEdit();
    if (this.creatingNew) {
      this.router.navigate([getParentUrl(this.router), this.entity.getId()]);
    }
  }

  cancel() {
    this.buildFormConfig();
  }

  private buildFormConfig() {
    const flattenedFormFields = new Array<FormFieldConfig>().concat(
      ...this.columns
    );
    this.entityFormService.extendFormFieldConfig(
      flattenedFormFields,
      this.entity
    );
    this.form = this.entityFormService.createFormGroup(
      flattenedFormFields,
      this.entity
    );
    this.form.disable();
  }
}
