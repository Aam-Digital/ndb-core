import { Component, OnInit } from "@angular/core";
import { FormBuilder, FormGroup, Validators } from "@angular/forms";
import { Router } from "@angular/router";
import { FormConfig, FormFieldConfig } from "./FormConfig";
import { PanelConfig } from "../EntityDetailsConfig";
import { Entity } from "../../../entity/entity";
import { EntityMapperService } from "../../../entity/entity-mapper.service";
import { SessionService } from "../../../session/session-service/session.service";
import { AlertService } from "../../../alerts/alert.service";
import { OnInitDynamicComponent } from "../../../view/dynamic-components/on-init-dynamic-component.interface";
import { getParentUrl } from "../../../../utils/utils";
import { OperationType } from "../../../permissions/entity-permissions.service";
import { EntitySchemaService } from "../../../entity/schema/entity-schema.service";
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
  isAdminUser: boolean;

  editing: boolean = false;
  config: FormConfig;

  columns: FormFieldConfig[][];
  validateForm: boolean = false;
  form: FormGroup;

  constructor(
    private entityFormService: EntityFormService,
    private entityMapperService: EntityMapperService,
    private alertService: AlertService,
    private router: Router,
    private sessionService: SessionService,
    private entitySchemaService: EntitySchemaService
  ) {
    this.isAdminUser = this.sessionService.getCurrentUser().admin;
  }

  ngOnInit() {
    this.initForm();
  }

  onInitFromDynamicConfig(config: PanelConfig) {
    this.entity = config.entity;
    this.config = config.config;
    this.initForm();
    if (config.creatingNew) {
      this.creatingNew = true;
      this.switchEdit();
    }
  }

  switchEdit() {
    this.editing = !this.editing;
    this.buildFormConfig();
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

  private initForm(): void {
    this.columns = this.config.cols.map((column) =>
      column.map((row) => {
        if (!row.input) {
          row.input = this.entitySchemaService.getComponent(
            this.entity.getSchema().get(row.id),
            "edit"
          );
        }
        return row;
      })
    );
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
  }
}
