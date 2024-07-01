import { Component, Input, OnInit, Optional } from "@angular/core";
import { Entity } from "../../entity/model/entity";
import { getParentUrl } from "../../../utils/utils";
import { Router } from "@angular/router";
import { Location, NgIf } from "@angular/common";
import { DynamicComponent } from "../../config/dynamic-components/dynamic-component.decorator";
import { InvalidFormFieldError } from "../../common-components/entity-form/invalid-form-field.error";
import {
  EntityFormService,
  ExtendedEntityForm,
} from "../../common-components/entity-form/entity-form.service";
import { AlertService } from "../../alerts/alert.service";
import { MatButtonModule } from "@angular/material/button";
import { EntityFormComponent } from "../../common-components/entity-form/entity-form/entity-form.component";
import { DisableEntityOperationDirective } from "../../permissions/permission-directive/disable-entity-operation.directive";
import { FieldGroup } from "./field-group";
import { ViewComponentContext } from "../../ui/abstract-view/abstract-view.component";

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

  @Input() fieldGroups: FieldGroup[];

  form: ExtendedEntityForm<E> | undefined;

  constructor(
    private router: Router,
    private location: Location,
    private entityFormService: EntityFormService,
    private alertService: AlertService,
    @Optional() private viewContext: ViewComponentContext,
  ) {}

  ngOnInit() {
    this.entityFormService
      .createExtendedEntityForm(
        [].concat(...this.fieldGroups.map((group) => group.fields)),
        this.entity,
      )
      .then((value) => {
        this.form = value;

        if (!this.creatingNew) {
          this.form.formGroup.disable();
        }
      });
  }

  async saveClicked() {
    try {
      await this.entityFormService.saveChanges(
        this.form.formGroup,
        this.entity,
      );
      if (this.creatingNew && !this.viewContext?.isDialog) {
        await this.router.navigate([
          getParentUrl(this.router),
          this.entity.getId(true),
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
    this.entityFormService.resetForm(this.form.formGroup, this.entity);
    this.form.formGroup.disable();
  }
}

/**
 * Config format that the FormComponent handles.
 */
export interface FormConfig {
  fieldGroups: FieldGroup[];
}
