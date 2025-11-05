import { Component, Input, inject, OnInit, signal } from "@angular/core";
import { EntityConstructor } from "app/core/entity/model/entity";
import { ViewTitleComponent } from "../../common-components/view-title/view-title.component";
import { RelatedEntitiesComponent } from "../../entity-details/related-entities/related-entities.component";
import { HintBoxComponent } from "#src/app/core/common-components/hint-box/hint-box.component";
import { PublicFormPermissionService } from "../../../features/public-form/public-form-permission.service";
import { MatButtonModule } from "@angular/material/button";
import { AlertService } from "../../alerts/alert.service";

@Component({
  selector: "app-admin-entity-public-forms-component",
  templateUrl: "./admin-entity-public-forms-component.html",
  styleUrls: ["./admin-entity-public-forms-component.scss"],
  imports: [
    ViewTitleComponent,
    RelatedEntitiesComponent,
    HintBoxComponent,
    MatButtonModule,
  ],
})
export class AdminEntityPublicFormsComponent implements OnInit {
  private readonly permissionService = inject(PublicFormPermissionService);
  private readonly alertService = inject(AlertService);

  /**
   * The entity type for which to display public forms for.
   */
  @Input() entityConstructor: EntityConstructor;

  /**
   * Whether public users have create permission for this entity type
   */
  hasPublicCreatePermission = signal<boolean>(true);

  /**
   * Whether we're currently checking permissions
   */
  isCheckingPermissions = signal<boolean>(false);

  /**
   * Whether the current user can add permissions (has admin_app role)
   */
  canAddPermissions = signal<boolean>(false);

  /**
   * Fake entity instance to correctly filter/link related PublicFormConfigs
   * using the standard related-entities component.
   */
  protected dummyEntity: any = {
    getId: () => this.entityConstructor.ENTITY_TYPE,
  };

  async ngOnInit(): Promise<void> {
    this.canAddPermissions.set(this.permissionService.hasAdminPermission());
    await this.checkPermissions();
  }

  /**
   * Check if public users have create permission for this entity type
   */
  private async checkPermissions(): Promise<void> {
    if (!this.entityConstructor) return;

    this.isCheckingPermissions.set(true);
    try {
      const hasPermission =
        await this.permissionService.hasPublicCreatePermission(
          this.entityConstructor.ENTITY_TYPE,
        );
      this.hasPublicCreatePermission.set(hasPermission);
    } catch (error) {
      console.warn("Failed to check public permissions:", error);
      this.hasPublicCreatePermission.set(false);
    } finally {
      this.isCheckingPermissions.set(false);
    }
  }

  /**
   * Automatically add the missing public create permission
   */
  async addPermissionAutomatically(): Promise<void> {
    if (!this.entityConstructor) return;

    try {
      await this.permissionService.addPublicCreatePermission(
        this.entityConstructor.ENTITY_TYPE,
      );
      this.alertService.addInfo(
        $localize`Permission added successfully! Public users can now create ${this.entityConstructor.label || this.entityConstructor.ENTITY_TYPE} records.`,
      );
      this.hasPublicCreatePermission.set(true);
    } catch (error) {
      console.error("Failed to add permission:", error);
      this.alertService.addDanger(
        $localize`Failed to add permission automatically. Please contact an administrator or check the permissions configuration manually.`,
      );
    }
  }
}
