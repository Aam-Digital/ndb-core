import { Injectable, inject } from "@angular/core";
import { Config } from "../../core/config/config";
import {
  DatabaseRules,
  DatabaseRule,
} from "../../core/permissions/permission-types";
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
        // No permissions config means everything is allowed by default
        return true;
      }

      const publicRules = permissionsConfig.data.public || [];

      // Check if there's a matching rule for this entity type
      const hasMatchingRule = publicRules.some(
        (rule) =>
          rule.subject === entityType &&
          (rule.action === "create" || rule.action === "manage"),
      );

      return hasMatchingRule;
    } catch (error) {
      // If we can't load permissions, assume no access for safety
      return false;
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

    // Create new config if it doesn't exist
    if (!permissionsConfig) {
      permissionsConfig = new Config(Config.PERMISSION_KEY, {});
    }

    // Initialize the data structure if it doesn't exist
    if (!permissionsConfig.data) {
      permissionsConfig.data = {};
    }

    if (!permissionsConfig.data.public) {
      permissionsConfig.data.public = [];
    }

    // Check if permission already exists
    const alreadyHasPermission =
      await this.hasPublicCreatePermission(entityType);

    if (!alreadyHasPermission) {
      // Add the new permission rule
      const newRule: DatabaseRule = {
        subject: entityType,
        action: "create",
      };

      permissionsConfig.data.public.push(newRule);

      // Save the updated config
      await this.entityMapper.save(permissionsConfig, true);
    }
  }

  /**
   * Loads the permissions configuration from the database.
   * @returns Promise<Config<DatabaseRules> | null>
   */
  private async loadPermissionsConfig(): Promise<Config<DatabaseRules> | null> {
    try {
      return await this.entityMapper.load<Config<DatabaseRules>>(
        Config,
        Config.PERMISSION_KEY,
      );
    } catch (error) {
      // Config doesn't exist yet
      return null;
    }
  }
}
