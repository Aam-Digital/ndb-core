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
import { ConfirmationDialogService } from "../../common-components/confirmation-dialog/confirmation-dialog.service";

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
  private readonly confirmationDialog = inject(ConfirmationDialogService);

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
        const canProceed = await this.checkPublicFormPermissions();
        if (!canProceed) return; // User cancelled or there was an error
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

  /**
   * Check PublicFormConfig permissions and handle missing permissions
   */
  private async checkPublicFormPermissions(): Promise<boolean> {
    const entityType = this.form.formGroup.getRawValue()["entity"] as string;
    if (!entityType) return true; // No entity type selected yet

    const hasPermission =
      await this.permissionService.hasPublicCreatePermission(entityType);

    if (hasPermission) return true;

    const canAddPermissions = this.permissionService.hasAdminPermission();

    if (canAddPermissions) {
      return await this.handleMissingPermissionAdmin(entityType);
    } else {
      return await this.handleMissingPermissionNonAdmin(entityType);
    }
  }

  /**
   * Handle missing permission with user confirmation (Admin version)
   */
  private async handleMissingPermissionAdmin(
    entityType: string,
  ): Promise<boolean> {
    const customButtons = [
      {
        text: $localize`Update Permission & Save Form`,
        dialogResult: "add-permission",
        click() {},
      },
      {
        text: $localize`Save Form Only`,
        dialogResult: "save-only",
        click() {},
      },
    ];

    const result = await this.confirmationDialog.getConfirmation(
      $localize`Missing Public Permission`,
      $localize`This public form won't work because public users don't have permission to create "${entityType}" records.

Would you like to add the required permission automatically?`,
      customButtons,
      true,
    );

    if (result === "add-permission") {
      try {
        await this.permissionService.addPublicCreatePermission(entityType);
        this.alertService.addInfo(
          $localize`Permission added successfully! Public users can now create ${entityType} records.`,
        );
        return true;
      } catch (error) {
        this.alertService.addDanger(
          $localize`Failed to add permission: ${error.message}`,
        );
        return false;
      }
    }

    if (result === "save-only") {
      // Allow saving the form even without permissions
      this.alertService.addWarning(
        $localize`This form will not work until an administrator adds create permissions for ${entityType} records.`,
      );
      return true;
    }

    // User cancelled the dialog
    return false;
  }

  /**
   * Handle missing permission for non-admin users
   */
  private async handleMissingPermissionNonAdmin(
    entityType: string,
  ): Promise<boolean> {
    const customButtons = [
      {
        text: $localize`Save Form Anyway`,
        dialogResult: "save-anyway",
        click() {},
      },
      {
        text: $localize`Cancel`,
        dialogResult: "cancel",
        click() {},
      },
    ];

    const result = await this.confirmationDialog.getConfirmation(
      $localize`Missing Public Permission`,
      $localize`This public form won't work because public users don't have permission to create "${entityType}" records.

You need an administrator to add the required permissions. Do you still want to save this form?`,
      customButtons,
      true,
    );

    if (result === "save-anyway") {
      // Allow saving the form even without permissions
      this.alertService.addWarning(
        $localize`This form will not work until an administrator adds create permissions for ${entityType} records.`,
      );
      return true;
    }

    // User cancelled
    return false;
  }
}

/**
 * Config format that the FormComponent handles.
 */
export interface FormConfig {
  fieldGroups: FieldGroup[];
}
