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
  private initialFormValues: any;

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
    this.initialFormValues = this.form.getRawValue();
    if (!this.creatingNew) {
      this.form.disable();
    }
    this.entityMapper
      .receiveUpdates(this.entity.getConstructor())
      .pipe(filter(({ entity }) => entity.getId() === this.entity.getId()))
      .subscribe(({ entity }) => this.applyChanges(entity));
  }

  private async applyChanges(entity) {
    if (this.saveInProgress || this.formIsUpToDate(entity)) {
      // this is the component that currently saves the values -> no need to apply changes.
      return;
    }
    if (
      this.form.pristine ||
      (await this.confirmationDialog.getConfirmation(
        $localize`Load changes?`,
        $localize`Local changes are in conflict with updated values synced from the server. Do you want the local changes to be overwritten with the latest values?`
      ))
    ) {
      this.resetForm(entity);
    }
  }

  private formIsUpToDate(entity: Entity): boolean {
    return Object.entries(this.form.getRawValue()).every(
      ([key, value]) =>
        entity[key] === value || (entity[key] === undefined && value === null)
    );
  }

  async saveClicked() {
    this.saveInProgress = true;
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
    setTimeout(() => (this.saveInProgress = false), 1000);
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
    this.form.patchValue(Object.assign(this.initialFormValues, entity));
    this.form.markAsPristine();
  }
}
