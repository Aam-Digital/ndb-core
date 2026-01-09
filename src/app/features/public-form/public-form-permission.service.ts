import { AlertService } from "app/core/alerts/alert.service";
import { ConfirmationDialogService } from "app/core/common-components/confirmation-dialog/confirmation-dialog.service";
import { inject, Injectable } from "@angular/core";
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
   * Helper method to check if a permission rule subject matches an entity type.
   * Handles both single subject strings and grouped/array subjects.
   * @param ruleSubject The subject field from a permission rule (string or string[])
   * @param entityType The entity type to check
   * @returns boolean true if the subject matches the entity type
   */
  private subjectMatches(
    ruleSubject: string | string[] | undefined,
    entityType: string,
  ): boolean {
    if (!ruleSubject) {
      return false;
    }
    if (Array.isArray(ruleSubject)) {
      return ruleSubject.includes(entityType);
    }
    return ruleSubject === entityType;
  }

  /**
   * Checks if public users (not logged in) have create permissions for a specific entity type.
   * @param entityType The entity type to check (e.g., "Child", "School")
   * @returns Promise<boolean> true if public users can create entities of this type
   */
  async hasPublicCreatePermission(entityType: string): Promise<boolean> {
    try {
      const permissionsConfig = await this.loadPermissionsConfig();
      if (!permissionsConfig?.data) {
        return false; // No permissions config means "public" users have no access
      }
      const publicRules = permissionsConfig.data.public || [];
      return publicRules.some(
        (rule) =>
          this.subjectMatches(rule.subject, entityType) &&
          (rule.action === "create" || rule.action === "manage"),
      );
    } catch {
      return false; // If we can't load permissions, assume no access
    }
  }

  /**
   * Handles the dialog logic for missing public create permission.
   * Returns true if save should proceed, false if cancelled or error.
   */
  private async handleMissingPermissionDialog(
    entityType: string,
    isAdmin: boolean,
  ): Promise<boolean> {
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

    let dialogText =
      $localize`This public form will currently not work for external users without an account because the "public" role does not have permission to create new "${entityType}" records.\n\n` +
      (isAdmin
        ? $localize`Would you like to add the required permission automatically?`
        : $localize`You need an administrator to add the required permissions. Do you still want to save this form?`);

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
        return true;
      } catch (error) {
        this.alertService.addDanger(
          $localize`Failed to add permission: ${error.message}`,
        );
        return false;
      }
    }
    if (
      (isAdmin && dialogResult === "save-only") ||
      (!isAdmin && dialogResult === "save-anyway")
    ) {
      this.alertService.addWarning(
        $localize`This form will not work until an administrator adds create permissions for ${entityType} records.`,
      );
      return true;
    }
    return false; // User cancelled
  }

  /**
   * Centralized permission check and dialog logic for public form save.
   * Returns true if save should proceed, false if cancelled or error.
   */
  async checkOnSave(entityType: string): Promise<boolean> {
    if (!entityType) {
      return true; // No entity type selected yet
    }
    const hasPermission = await this.hasPublicCreatePermission(entityType);
    if (hasPermission) {
      return true;
    }
    const isAdmin = this.hasAdminPermission();
    return await this.handleMissingPermissionDialog(entityType, isAdmin);
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

    const isNewConfig = !permissionsConfig;
    if (!permissionsConfig) {
      permissionsConfig = new Config(Config.PERMISSION_KEY, {});
    }

    if (!permissionsConfig.data) {
      permissionsConfig.data = {};
    }

    if (!permissionsConfig.data.public) {
      permissionsConfig.data.public = [];
    }

    // Only add default rule if creating a new config
    if (isNewConfig) {
      // all logged-in users should continue to have full access (which is default without a permission doc):
      permissionsConfig.data.default = [{ subject: "all", action: "manage" }];
    }

    // basic read permissions on config elements is required for public forms to work:
    const hasPublicFormConfigRead = permissionsConfig.data.public.some(
      (rule) =>
        this.subjectMatches(rule.subject, "PublicFormConfig") &&
        (rule.action === "read" || rule.action === "manage"),
    );
    const hasConfigRead = permissionsConfig.data.public.some(
      (rule) =>
        this.subjectMatches(rule.subject, "Config") &&
        (rule.action === "read" || rule.action === "manage"),
    );
    const formReadExists = hasPublicFormConfigRead && hasConfigRead;

    if (!formReadExists) {
      permissionsConfig.data.public.push({
        subject: [
          "Config",
          "SiteSettings",
          "PublicFormConfig",
          "ConfigurableEnum",
        ],
        action: "read",
      });
    }

    // Check if public create permission already exists to avoid duplicates
    const createExists = permissionsConfig.data.public.some(
      (rule) =>
        this.subjectMatches(rule.subject, entityType) &&
        (rule.action === "create" || rule.action === "manage"),
    );
    if (!createExists) {
      permissionsConfig.data.public.push({
        subject: entityType,
        action: "create",
      });
    }

    if (!createExists || !formReadExists) {
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
