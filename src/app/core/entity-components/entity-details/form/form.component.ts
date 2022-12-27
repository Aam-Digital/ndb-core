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
import { filter } from "rxjs/operators";
import { EntityMapperService } from "../../../entity/entity-mapper.service";
import { ConfirmationDialogService } from "../../../confirmation-dialog/confirmation-dialog.service";
import { toFormFieldConfig } from "../../entity-subrecord/entity-subrecord/entity-subrecord-config";

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
export class FormComponent implements OnInitDynamicComponent, OnInit {
  entity: Entity;
  columns: FormFieldConfig[][] = [];
  headers?: string[] = [];
  creatingNew = false;
  saveInProgress = false;
  form: EntityForm<Entity>;

  constructor(
    private router: Router,
    private location: Location,
    private entityFormService: EntityFormService,
    private alertService: AlertService,
    private entityMapper: EntityMapperService,
    private confirmationDialog: ConfirmationDialogService
  ) {}

  onInitFromDynamicConfig(config: PanelConfig) {
    this.entity = config.entity;
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
    this.saveInProgress = true;
    console.log("save is true");
    try {
      await this.entityFormService.saveChanges(this.form, this.entity);
      this.form.markAsPristine();
      this.form.disable();
      if (this.creatingNew) {
        this.router.navigate([getParentUrl(this.router), this.entity.getId()]);
      }
    } catch (err) {
      if (!(err instanceof InvalidFormFieldError)) {
        this.alertService.addDanger(err.message);
      }
    }
    // Reset state after a short delay
    setTimeout(() => {
      this.saveInProgress = false;
      console.log("save is false");
    }, 1000);
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
    this.form.markAsPristine();
  }
}
