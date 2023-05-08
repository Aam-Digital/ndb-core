import { Component, Input, OnInit } from "@angular/core";
import { Entity } from "../../../entity/model/entity";
import { FormFieldConfig } from "../../entity-form/entity-form/FormConfig";
import { getParentUrl } from "../../../../utils/utils";
import { Router } from "@angular/router";
import { Location, NgIf } from "@angular/common";
import { DynamicComponent } from "../../../view/dynamic-components/dynamic-component.decorator";
import { InvalidFormFieldError } from "../../entity-form/invalid-form-field.error";
import {
  EntityForm,
  EntityFormService,
} from "../../entity-form/entity-form.service";
import { AlertService } from "../../../alerts/alert.service";
import { toFormFieldConfig } from "../../entity-subrecord/entity-subrecord/entity-subrecord-config";
import { MatButtonModule } from "@angular/material/button";
import { EntityFormComponent } from "../../entity-form/entity-form/entity-form.component";
import { DisableEntityOperationDirective } from "../../../permissions/permission-directive/disable-entity-operation.directive";
import { UnsavedChangesService } from "./unsaved-changes.service";

/**
 * A simple wrapper function of the EntityFormComponent which can be used as a dynamic component
 * e.g. as a panel for the EntityDetailsComponent.
 */
@DynamicComponent("Form")
@Component({
  selector: "app-form",
  templateUrl: "./form.component.html",
  styleUrls: ["./form.component.scss"],
  imports: [
    MatButtonModule,
    NgIf,
    EntityFormComponent,
    DisableEntityOperationDirective,
  ],
  standalone: true,
})
export class FormComponent<E extends Entity> implements OnInit {
  @Input() entity: E;
  @Input() creatingNew = false;
  @Input() headers: string[] = [];

  @Input() set cols(value: FormFieldConfig[][]) {
    this._cols = value.map((row) => row.map(toFormFieldConfig));
  }

  _cols: FormFieldConfig[][] = [];
  form: EntityForm<E>;

  constructor(
    private router: Router,
    private location: Location,
    private entityFormService: EntityFormService,
    private alertService: AlertService,
    private unsavedChanges: UnsavedChangesService
  ) {}

  ngOnInit() {
    this.form = this.entityFormService.createFormGroup(
      [].concat(...this._cols),
      this.entity
    );
    if (!this.creatingNew) {
      this.form.disable();
    }
    this.form.valueChanges.subscribe(
      () => (this.unsavedChanges.pending = this.form.dirty)
    );
  }

  async saveClicked() {
    try {
      await this.entityFormService.saveChanges(this.form, this.entity);
      this.form.markAsPristine();
      this.form.disable();
      if (this.creatingNew) {
        this.unsavedChanges.pending = false;
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
    this.entityFormService.resetForm(this.form, this.entity);
    this.form.disable();
    // TODO this might overwrite active changes from another panel with a form
    this.unsavedChanges.pending = false;
  }
}
