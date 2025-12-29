import { Component, inject, Input, OnInit } from "@angular/core";
import { Entity } from "../../entity/model/entity";
import { getParentUrl } from "../../../utils/utils";
import { Router } from "@angular/router";
import { Location } from "@angular/common";
import { DynamicComponent } from "../../config/dynamic-components/dynamic-component.decorator";
import { InvalidFormFieldError } from "../../common-components/entity-form/invalid-form-field.error";
import { EntityFormService } from "../../common-components/entity-form/entity-form.service";
import { EntityForm } from "#src/app/core/common-components/entity-form/entity-form";
import { AlertService } from "../../alerts/alert.service";
import { MatButtonModule } from "@angular/material/button";
import { EntityFormComponent } from "../../common-components/entity-form/entity-form/entity-form.component";
import { DisableEntityOperationDirective } from "../../permissions/permission-directive/disable-entity-operation.directive";
import { FieldGroup } from "./field-group";
import { ViewComponentContext } from "../../ui/abstract-view/view-component-context";
import { PublicFormConfig } from "../../../features/public-form/public-form-config";
import { PublicFormPermissionService } from "../../../features/public-form/public-form-permission.service";

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
    EntityFormComponent,
    DisableEntityOperationDirective,
  ],
})
export class FormComponent<E extends Entity> implements FormConfig, OnInit {
  private router = inject(Router);
  private location = inject(Location);
  private entityFormService = inject(EntityFormService);
  private alertService = inject(AlertService);
  private viewContext = inject(ViewComponentContext, { optional: true });
  private readonly permissionService = inject(PublicFormPermissionService);

  @Input() entity: E;
  @Input() creatingNew = false;

  @Input() fieldGroups: FieldGroup[];
  form: EntityForm<E> | undefined;

  ngOnInit() {
    this.entityFormService
      .createEntityForm(
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
      // Check if this is a PublicFormConfig and needs permission checking
      if (this.entity.getType() === PublicFormConfig.ENTITY_TYPE) {
        const entityType = this.form.formGroup.getRawValue()[
          "entity"
        ] as string;
        if (!(await this.permissionService.checkOnSave(entityType))) return;
      }

      await this.entityFormService.saveChanges(this.form, this.entity);

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
    this.entityFormService.resetForm(this.form, this.entity);
    this.form.formGroup.disable();
  }
}

/**
 * Config format that the FormComponent handles.
 */
export interface FormConfig {
  fieldGroups: FieldGroup[];
}
