import { Component, Input, OnInit } from "@angular/core";
import { Entity } from "../../entity/model/entity";
import { getParentUrl } from "../../../utils/utils";
import { Router } from "@angular/router";
import { Location, NgIf } from "@angular/common";
import { DynamicComponent } from "../../config/dynamic-components/dynamic-component.decorator";
import { InvalidFormFieldError } from "../../common-components/entity-form/invalid-form-field.error";
import {
  EntityForm,
  EntityFormService,
} from "../../common-components/entity-form/entity-form.service";
import { AlertService } from "../../alerts/alert.service";
import { ColumnConfig } from "../../common-components/entity-subrecord/entity-subrecord/entity-subrecord-config";
import { MatButtonModule } from "@angular/material/button";
import { EntityFormComponent } from "../../common-components/entity-form/entity-form/entity-form.component";
import { DisableEntityOperationDirective } from "../../permissions/permission-directive/disable-entity-operation.directive";
import { FormFieldConfig } from "../../common-components/entity-form/entity-form/FormConfig";

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
export class FormComponent<E extends Entity> implements FormConfig, OnInit {
  @Input() entity: E;
  @Input() creatingNew = false;
  @Input() headers: string[] = [];

  @Input() cols: ColumnConfig[][];
  columns: FormFieldConfig[][] = [];

  form: EntityForm<E>;

  constructor(
    private router: Router,
    private location: Location,
    private entityFormService: EntityFormService,
    private alertService: AlertService,
  ) {}

  ngOnInit() {
    this.columns = this.cols.map((fields) =>
      this.entityFormService.extendFormFieldConfig(
        fields,
        this.entity.getConstructor(),
      ),
    );
    this.form = this.entityFormService.createFormGroup(
      [].concat(...this.columns),
      this.entity,
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
    this.entityFormService.resetForm(this.form, this.entity);
    this.form.disable();
  }
}

/**
 * The (possibly abbreviated) configuration for a "FormComponent", as it is stored in the config file.
 */
export interface FormConfig {
  cols: ColumnConfig[][];
  headers: string[];
}
