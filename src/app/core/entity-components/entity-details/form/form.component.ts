import { Component, OnInit } from "@angular/core";
import { OnInitDynamicComponent } from "../../../view/dynamic-components/on-init-dynamic-component.interface";
import { PanelConfig } from "../EntityDetailsConfig";
import { Entity } from "../../../entity/model/entity";
import { FormFieldConfig } from "../../entity-form/entity-form/FormConfig";
import { getParentUrl } from "../../../../utils/utils";
import { Router } from "@angular/router";
import { Location } from "@angular/common";
import { DynamicComponent } from "../../../view/dynamic-components/dynamic-component.decorator";
import { InvalidFormFieldError } from "../../entity-form/invalid-form-field.error";
import {
  EntityForm,
  EntityFormService,
} from "../../entity-form/entity-form.service";
import { AlertService } from "../../../alerts/alert.service";
import { toFormFieldConfig } from "../../entity-subrecord/entity-subrecord/entity-subrecord-config";
import * as _ from "lodash-es";

/**
 * A simple wrapper function of the EntityFormComponent which can be used as a dynamic component
 * e.g. as a panel for the EntityDetailsComponent.
 */
@DynamicComponent("Form")
@Component({
  selector: "app-form",
  templateUrl: "./form.component.html",
  styleUrls: ["./form.component.scss"],
})
export class FormComponent<E extends Entity>
  implements OnInitDynamicComponent, OnInit
{
  entity: E;
  columns: FormFieldConfig[][] = [];
  headers?: string[] = [];
  creatingNew = false;
  form: EntityForm<E>;

  constructor(
    private router: Router,
    private location: Location,
    private entityFormService: EntityFormService,
    private alertService: AlertService
  ) {}

  onInitFromDynamicConfig(config: PanelConfig) {
    this.entity = config.entity as E;
    this.columns = config.config?.cols.map((row) => row.map(toFormFieldConfig));
    this.headers = config.config?.headers;
    if (config.creatingNew) {
      this.creatingNew = true;
    }
  }

  ngOnInit() {
    this.form = this.entityFormService.createFormGroup(
      [].concat(...this.columns),
      this.entity
    );
    if (!this.creatingNew) {
      this.form.disable();
    }
  }

  async saveClicked() {
    try {
      await this.entityFormService.saveChanges(this.form, this.entity);
      this.form.markAsPristine();
      this.form.disable();
      if (this.creatingNew) {
        await this.router.navigate([
          getParentUrl(this.router),
          this.entity.getId(),
        ]);
      }
    } catch (err) {
      if (!(err instanceof InvalidFormFieldError)) {
        this.alertService.addDanger(err.message);
      }
    }
  }

  cancelClicked() {
    if (this.creatingNew) {
      this.location.back();
    }
    this.resetForm();
    this.form.disable();
  }

  private resetForm(entity = this.entity) {
    // Patch form with values from the entity
    this.form.patchValue(entity as any);
    const newKeys = Object.keys(
      _.omit(this.form.controls, Object.keys(this.entity))
    );
    newKeys.forEach((key) => this.form.get(key).setValue(null));
    this.form.markAsPristine();
  }
}
