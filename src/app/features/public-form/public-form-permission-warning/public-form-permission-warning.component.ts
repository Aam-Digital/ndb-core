import {
  Component,
  Input,
  inject,
  OnInit,
  OnChanges,
  SimpleChanges,
  signal,
} from "@angular/core";
import { AlertService } from "app/core/alerts/alert.service";
import { Entity } from "app/core/entity/model/entity";
import { PublicFormPermissionService } from "../public-form-permission.service";
import { PublicFormConfig } from "../public-form-config";
import { HintBoxComponent } from "app/core/common-components/hint-box/hint-box.component";
import { MatButtonModule } from "@angular/material/button";
import { Logging } from "#src/app/core/logging/logging.service";

@Component({
  selector: "app-public-form-permission-warning",
  templateUrl: "./public-form-permission-warning.component.html",
  imports: [HintBoxComponent, MatButtonModule],
})
export class PublicFormPermissionWarningComponent implements OnInit, OnChanges {
  private readonly permissionService = inject(PublicFormPermissionService);
  private readonly alertService = inject(AlertService);

  /**
   * The entity being edited (PublicFormConfig)
   */
  @Input() entity?: Entity;

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
   * Store the entity type for template use (avoids method calls in template)
   */
  entityType: string = "";

  private updateEntityType() {
    const formConfig = this.entity as PublicFormConfig;
    this.entityType = formConfig?.entity || "";
  }

  async ngOnInit(): Promise<void> {
    this.canAddPermissions.set(this.permissionService.hasAdminPermission());
    this.updateEntityType();
    await this.checkPermissions();
  }

  async ngOnChanges(changes: SimpleChanges): Promise<void> {
    if (changes["entity"]) {
      this.updateEntityType();
      await this.checkPermissions();
    }
  }

  /**
   * Check if public users have create permission for this entity type
   */
  private async checkPermissions(): Promise<void> {
    const formConfig = this.entity as PublicFormConfig;

    if (!formConfig?.entity) {
      this.hasPublicCreatePermission.set(true);
      return;
    }

    this.isCheckingPermissions.set(true);

    try {
      const hasPermission =
        await this.permissionService.hasPublicCreatePermission(
          formConfig.entity,
        );
      this.hasPublicCreatePermission.set(hasPermission);
    } catch (error) {
      Logging.error("Failed to check public permissions:", error);
      this.hasPublicCreatePermission.set(false);
    } finally {
      this.isCheckingPermissions.set(false);
    }
  }

  /**
   * Automatically add the missing public create permission
   */
  async addPermissionAutomatically(): Promise<void> {
    const formConfig = this.entity as PublicFormConfig;
    if (!formConfig?.entity) return;

    try {
      await this.permissionService.addPublicCreatePermission(formConfig.entity);
      this.alertService.addInfo(
        $localize`Permission added successfully! The public form should now work correctly.`,
      );
      await this.checkPermissions();
    } catch (error) {
      Logging.error("Failed to add permission:", error);
      this.alertService.addDanger(
        $localize`Failed to add permission automatically. Please contact an administrator or check the permissions configuration manually.`,
      );
    }
  }
}
