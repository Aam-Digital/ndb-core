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

    // Check if permission already exists to avoid duplicates
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
