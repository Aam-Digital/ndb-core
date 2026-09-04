import { AlertService } from "app/core/alerts/alert.service";
import { ConfirmationDialogService } from "app/core/common-components/confirmation-dialog/confirmation-dialog.service";
import { inject, Injectable } from "@angular/core";
import { Config } from "../../core/config/config";
import {
  DatabaseRules,
  DEFAULT_SECTION_KEY,
  LEGACY_PUBLIC_KEY,
  PUBLIC_SECTION_KEY,
  ruleCoversAction,
} from "../../core/permissions/permission-types";
import { migrateLegacySectionKeys } from "../../core/permissions/permissions-config-migration";
import { PermissionsConfigService } from "../../core/permissions/permissions-config.service";
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
  private readonly permissionsConfigService = inject(PermissionsConfigService);
  private readonly entityMapper = inject(EntityMapperService);

  /**
   * The warning explaining that the "public" role cannot create records of the given type.
   * Single source of truth, shared by the inline warning box and the save confirmation dialog.
   */
  missingPublicPermissionWarning(entityType: string): string {
    return $localize`This public form will currently not work for external users without an account because the "public" role does not have permission to create new "${entityType}" records.`;
  }

  /**
   * Checks if public users (not logged in) have create permissions for a specific entity type.
   * @param entityType The entity type to check (e.g., "Child", "School")
   * @returns Promise<boolean> true if public users can create entities of this type
   */
  async hasPublicCreatePermission(entityType: string): Promise<boolean> {
    // a load failure is not caught here: treating it as "no permission" would
    // claim the form is broken while we simply do not know
    const permissionsConfig = await this.permissionsConfigService.load();
    if (!permissionsConfig?.data) {
      return false; // No permissions config means "public" users have no access
    }
    const publicRules =
      migrateLegacySectionKeys(permissionsConfig.data)[PUBLIC_SECTION_KEY] ??
      [];
    return publicRules.some((rule) =>
      ruleCoversAction(rule, entityType, "create"),
    );
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
      this.missingPublicPermissionWarning(entityType) +
      "\n\n" +
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
    return this.permissionsConfigService.canManagePermissions();
  }

  /**
   * Adds create permission for public users for a specific entity type.
   * @param entityType The entity type to add permission for
   * @returns Promise<void>
   */
  async addPublicCreatePermission(entityType: string): Promise<void> {
    const storedConfig = await this.permissionsConfigService.load();
    const permissionsConfig =
      storedConfig ?? new Config<DatabaseRules>(Config.PERMISSION_KEY, {});
    const isNewConfig = !storedConfig;

    // edit a copy so that the backup written on save still holds the previous state
    const updatedData: DatabaseRules = structuredClone(
      permissionsConfig.data ?? {},
    );

    // migrate any legacy section key to the underscore-prefixed name so we
    // never write both spellings (the read path prefers the new key).
    // Kept inline instead of using migrateLegacySectionKeys(): this is a write
    // path, so it also removes the legacy key and must not touch any section
    // other than the one this form needs.
    const migratedLegacyPublic = LEGACY_PUBLIC_KEY in updatedData;
    if (updatedData[LEGACY_PUBLIC_KEY] && !updatedData[PUBLIC_SECTION_KEY]) {
      updatedData[PUBLIC_SECTION_KEY] = updatedData[LEGACY_PUBLIC_KEY];
    }
    delete updatedData[LEGACY_PUBLIC_KEY];

    if (!updatedData[PUBLIC_SECTION_KEY]) {
      updatedData[PUBLIC_SECTION_KEY] = [];
    }

    // Only add default rule if creating a new config
    if (isNewConfig) {
      // all logged-in users should continue to have full access (which is default without a permission doc):
      updatedData[DEFAULT_SECTION_KEY] = [{ subject: "all", action: "manage" }];
    }

    const publicRules = updatedData[PUBLIC_SECTION_KEY];

    // basic read permissions on config elements is required for public forms to work:
    const hasPublicFormConfigRead = publicRules.some((rule) =>
      ruleCoversAction(rule, "PublicFormConfig", "read"),
    );
    const hasConfigRead = publicRules.some((rule) =>
      ruleCoversAction(rule, "Config", "read"),
    );
    const formReadExists = hasPublicFormConfigRead && hasConfigRead;

    if (!formReadExists) {
      publicRules.push({
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
    const createExists = publicRules.some((rule) =>
      ruleCoversAction(rule, entityType, "create"),
    );
    if (!createExists) {
      publicRules.push({
        subject: entityType,
        action: "create",
      });
    }

    if (!migratedLegacyPublic && createExists && formReadExists) {
      return;
    }

    if (isNewConfig) {
      // nothing stored yet that a backup could preserve
      permissionsConfig.data = updatedData;
      await this.entityMapper.save(permissionsConfig, true);
    } else {
      await this.permissionsConfigService.saveWithBackup(
        permissionsConfig,
        updatedData,
      );
    }
  }
}
