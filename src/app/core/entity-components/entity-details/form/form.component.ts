import { Component, OnInit } from "@angular/core";
import { FormGroup } from "@angular/forms";
import { Router } from "@angular/router";
import { FormConfig, FormFieldConfig } from "./FormConfig";
import { PanelConfig } from "../EntityDetailsConfig";
import { Entity } from "../../../entity/entity";
import { EntityMapperService } from "../../../entity/entity-mapper.service";
import { AlertService } from "../../../alerts/alert.service";
import { OnInitDynamicComponent } from "../../../view/dynamic-components/on-init-dynamic-component.interface";
import { getParentUrl } from "../../../../utils/utils";
import { OperationType } from "../../../permissions/entity-permissions.service";
import { EntityFormService } from "../../entity-form/entity-form.service";

/**
 * This component creates a form based on the passed config.
 * It creates a flexible layout and includes validation functionality.
 */
@Component({
  selector: "app-form",
  templateUrl: "./form.component.html",
  styleUrls: ["./form.component.scss"],
})
export class FormComponent implements OnInitDynamicComponent, OnInit {
  entity: Entity;

  operationType = OperationType;

  creatingNew = false;
  config: FormConfig;

  columns: FormFieldConfig[][];
  form: FormGroup;

  constructor(
    private entityFormService: EntityFormService,
    private entityMapperService: EntityMapperService,
    private alertService: AlertService,
    private router: Router,
  ) {}

  ngOnInit() {
    this.initForm();
    if (this.creatingNew) {
      this.switchEdit();
    }
  }

  onInitFromDynamicConfig(config: PanelConfig) {
    this.entity = config.entity;
    this.config = config.config;
    this.creatingNew = config.creatingNew;
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
    try {
      await this.entityFormService.saveChanges(this.form, this.entity);
      this.switchEdit();
      if (this.creatingNew) {
        this.router.navigate([getParentUrl(this.router), this.entity.getId()]);
      }
    } catch (err) {
      console.log("error", err);
    }
  }

  cancel() {
    this.buildFormConfig();
  }

  private initForm(): void {
    this.columns = this.config.cols;
    this.buildFormConfig();
  }

  private buildFormConfig() {
    const flattenedFormFields = new Array<FormFieldConfig>().concat(
      ...this.columns
    );
    this.form = this.entityFormService.createFormGroup(
      flattenedFormFields,
      this.entity
    );
    this.form.disable();
  }
}
