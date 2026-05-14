import {
  Component,
  computed,
  effect,
  input,
  inject,
  signal,
  ChangeDetectionStrategy,
} from "@angular/core";
import { AlertService } from "app/core/alerts/alert.service";
import { Entity } from "app/core/entity/model/entity";
import { PublicFormPermissionService } from "../public-form-permission.service";
import { PublicFormConfig } from "../public-form-config";
import { HintBoxComponent } from "app/core/common-components/hint-box/hint-box.component";
import { MatButtonModule } from "@angular/material/button";
import { Logging } from "#src/app/core/logging/logging.service";

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: "app-public-form-permission-warning",
  templateUrl: "./public-form-permission-warning.component.html",
  imports: [HintBoxComponent, MatButtonModule],
})
export class PublicFormPermissionWarningComponent {
  private readonly permissionService = inject(PublicFormPermissionService);
  private readonly alertService = inject(AlertService);

  /**
   * The entity being edited (PublicFormConfig)
   */
  entity = input<Entity>();

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

  readonly entityType = computed(() => {
    const formConfig = this.entity() as PublicFormConfig | undefined;
    if (!formConfig) {
      return "";
    }

    const multiFormEntityType = formConfig.forms?.[0]?.entity;
    if (multiFormEntityType) {
      return multiFormEntityType;
    }

    const legacyEntityType = (formConfig as { entity?: string }).entity;
    return legacyEntityType ?? "";
  });

  constructor() {
    this.canAddPermissions.set(this.permissionService.hasAdminPermission());
    effect((onCleanup) => {
      const entityType = this.entityType();
      let cancelled = false;
      onCleanup(() => {
        cancelled = true;
      });
      void this.checkPermissions(entityType, () => cancelled);
    });
  }

  /**
   * Check if public users have create permission for this entity type
   */
  private async checkPermissions(
    entityType: string,
    isCancelled: () => boolean = () => false,
  ): Promise<void> {
    if (!entityType) {
      this.hasPublicCreatePermission.set(true);
      return;
    }

    this.isCheckingPermissions.set(true);

    try {
      const hasPermission =
        await this.permissionService.hasPublicCreatePermission(entityType);
      if (isCancelled()) {
        return;
      }
      this.hasPublicCreatePermission.set(hasPermission);
    } catch (error) {
      if (isCancelled()) {
        return;
      }
      Logging.error("Failed to check public permissions:", error);
      this.hasPublicCreatePermission.set(false);
    } finally {
      if (!isCancelled()) {
        this.isCheckingPermissions.set(false);
      }
    }
  }

  /**
   * Automatically add the missing public create permission
   */
  async addPermissionAutomatically(): Promise<void> {
    const entityType = this.entityType();
    if (!entityType) return;

    try {
      await this.permissionService.addPublicCreatePermission(entityType);
      this.alertService.addInfo(
        $localize`Permission added successfully! The public form should now work correctly.`,
      );
      await this.checkPermissions(entityType);
    } catch (error) {
      Logging.error("Failed to add permission:", error);
      this.alertService.addDanger(
        $localize`Failed to add permission automatically. Please contact an administrator or check the permissions configuration manually.`,
      );
    }
  }
}
