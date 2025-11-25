import { AlertService } from "app/core/alerts/alert.service";
import { ConfirmationDialogService } from "app/core/common-components/confirmation-dialog/confirmation-dialog.service";
import { Injectable, inject } from "@angular/core";
import { Config } from "../../core/config/config";
import { DatabaseRules } from "../../core/permissions/permission-types";
import { SessionSubject } from "../../core/session/auth/session-info";
import { EntityMapperService } from "../../core/entity/entity-mapper/entity-mapper.service";

/**
 * Service to check and manage public form permissions.
 * Provides functionality to verify if public users can create entities of specific types
 * and assists with adding missing permissions.
 */
@Injectable({
  providedIn: "root",
})
export class PublicFormPermissionService {
  private readonly alertService = inject(AlertService);
  private readonly confirmationDialog = inject(ConfirmationDialogService);
  private readonly sessionInfo = inject(SessionSubject);
  private readonly entityMapper = inject(EntityMapperService);

  /**
   * Checks if public users (not logged in) have create permissions for a specific entity type.
   * @param entityType The entity type to check (e.g., "Child", "School")
   * @returns Promise<boolean> true if public users can create entities of this type
   */
  async hasPublicCreatePermission(entityType: string): Promise<boolean> {
    try {
      const permissionsConfig = await this.loadPermissionsConfig();
      if (!permissionsConfig?.data) {
        return true; // No permissions config means everything is allowed
      }
      const publicRules = permissionsConfig.data.public || [];
      return publicRules.some(
        (rule) =>
          rule.subject === entityType &&
          (rule.action === "create" || rule.action === "manage"),
      );
    } catch {
      return false; // If we can't load permissions, assume no access
    }
  }

  /**
   * Centralized permission check and dialog logic for public form save.
   * Returns true if save should proceed, false if cancelled or error.
   */
  async checkOnSave(entityType: string): Promise<boolean> {
    let result = false;
    if (!entityType) {
      result = true; // No entity type selected yet
    } else {
      const hasPermission = await this.hasPublicCreatePermission(entityType);
      if (hasPermission) {
        result = true;
      } else {
        const isAdmin = this.hasAdminPermission();
        const buttons = isAdmin
          ? [
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
            ]
          : [
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

        const dialogText = isAdmin
          ? $localize`This public form will currently not work for external users without an account because the "public" role does not have permission to create new "${entityType}" records.\n\nWould you like to add the required permission automatically?`
          : $localize`This public form will currently not work for external users without an account because the "public" role does not have permission to create new "${entityType}" records.\n\nYou need an administrator to add the required permissions. Do you still want to save this form?`;

        const dialogResult = await this.confirmationDialog.getConfirmation(
          $localize`Missing Public Permission`,
          dialogText,
          buttons,
          true,
        );

        if (isAdmin && dialogResult === "add-permission") {
          try {
            await this.addPublicCreatePermission(entityType);
            this.alertService.addInfo(
              $localize`Permission added successfully! Public users can now create ${entityType} records.`,
            );
            result = true;
          } catch (error) {
            this.alertService.addDanger(
              $localize`Failed to add permission: ${error.message}`,
            );
            result = false;
          }
        } else if (
          (isAdmin && dialogResult === "save-only") ||
          (!isAdmin && dialogResult === "save-anyway")
        ) {
          this.alertService.addWarning(
            $localize`This form will not work until an administrator adds create permissions for ${entityType} records.`,
          );
          result = true;
        } else {
          result = false; // User cancelled
        }
      }
    }
    return result;
  }

  /**
   * Checks if the current user has admin permissions to modify the permissions config.
   * @returns boolean true if user can manage permissions
   */
  hasAdminPermission(): boolean {
    const userRoles = this.sessionInfo.value?.roles || [];
    return userRoles.includes("admin_app");
  }

  /**
   * Adds create permission for public users for a specific entity type.
   * @param entityType The entity type to add permission for
   * @returns Promise<void>
   */
  async addPublicCreatePermission(entityType: string): Promise<void> {
    let permissionsConfig = await this.loadPermissionsConfig();

    if (!permissionsConfig) {
      permissionsConfig = new Config(Config.PERMISSION_KEY, {});
    }

    if (!permissionsConfig.data) {
      permissionsConfig.data = {};
    }

    if (!permissionsConfig.data.public) {
      permissionsConfig.data.public = [];
    }

    if (!permissionsConfig.data.default) {
      permissionsConfig.data.default = [];
    }

    // Always ensure default manage rule for authenticated users
    const defaultExists = permissionsConfig.data.default.some(
      (rule) => rule.subject === "all" && rule.action === "manage",
    );
    if (!defaultExists) {
      permissionsConfig.data.default.push({
        subject: "all",
        action: "manage",
      });
    }

    // Check if public create permission already exists to avoid duplicates
    const alreadyExists = permissionsConfig.data.public.some(
      (rule) =>
        rule.subject === entityType &&
        (rule.action === "create" || rule.action === "manage"),
    );

    if (!alreadyExists) {
      permissionsConfig.data.public.push({
        subject: entityType,
        action: "create",
      });
      await this.entityMapper.save(permissionsConfig, true);
    }
  }

  /**
   * Loads the permissions configuration from the database.
   */
  private async loadPermissionsConfig(): Promise<Config<DatabaseRules> | null> {
    try {
      return await this.entityMapper.load<Config<DatabaseRules>>(
        Config,
        Config.PERMISSION_KEY,
      );
    } catch {
      return null; // Config doesn't exist yet
    }
  }
}
