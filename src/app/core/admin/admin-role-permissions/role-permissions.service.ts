import { Injectable, inject } from "@angular/core";
import { MatSnackBar } from "@angular/material/snack-bar";
import moment from "moment";
import { firstValueFrom, of } from "rxjs";
import { catchError } from "rxjs/operators";

import { Config } from "../../config/config";
import { EntityMapperService } from "../../entity/entity-mapper/entity-mapper.service";
import { Logging } from "../../logging/logging.service";
import {
  DatabaseRule,
  DatabaseRules,
} from "../../permissions/permission-types";
import { Role } from "../../user/user-admin-service/user-account";
import { UserAdminService } from "../../user/user-admin-service/user-admin.service";

/**
 * A user role and its configured permission rules,
 * merged from the Config:Permissions document and the authentication server (Keycloak).
 */
export interface RoleWithPermissions {
  name: string;

  description?: string;

  /**
   * Virtual roles ("default", "public") only exist in the permissions config
   * and have no matching realm role in the authentication server.
   */
  isVirtual: boolean;

  keycloakRole?: Role;

  /**
   * The permission rules configured for this role.
   * undefined if the role has no entry in the permissions config yet
   * (in which case only the "default" rules apply to its users).
   */
  rules?: DatabaseRule[];
}

/**
 * Load and update the roles and their permission rules
 * stored in the Config:Permissions document and the authentication server.
 */
@Injectable({ providedIn: "root" })
export class RolePermissionsService {
  private readonly entityMapper = inject(EntityMapperService);
  private readonly userAdminService = inject(UserAdminService);
  private readonly snackBar = inject(MatSnackBar);

  loadPermissionsConfig(): Promise<Config<DatabaseRules>> {
    return this.entityMapper
      .load<Config<DatabaseRules>>(Config, Config.PERMISSION_KEY)
      .catch(() => new Config(Config.PERMISSION_KEY, {}));
  }

  /**
   * All roles, merged from permissions config keys and realm roles:
   * always starting with the virtual "default" and "public" roles,
   * followed by all other config keys and remaining realm roles.
   */
  async loadRoles(): Promise<RoleWithPermissions[]> {
    const rules: DatabaseRules =
      (await this.loadPermissionsConfig()).data ?? {};
    const keycloakRoles: Role[] = await firstValueFrom(
      this.userAdminService.getAllRoles().pipe(catchError(() => of([]))),
    );

    const roles: RoleWithPermissions[] = [
      {
        name: "default",
        isVirtual: true,
        description: $localize`Base permissions that apply to every logged-in user, combined with their other roles`,
        rules: rules.default,
      },
      {
        name: "public",
        isVirtual: true,
        description: $localize`Permissions that apply before login (e.g. public registration forms)`,
        rules: rules.public,
      },
    ];

    for (const key of Object.keys(rules)) {
      if (key === "default" || key === "public") continue;
      const keycloakRole = keycloakRoles.find((r) => r.name === key);
      roles.push({
        name: key,
        isVirtual: false,
        keycloakRole,
        description: keycloakRole?.description,
        rules: rules[key],
      });
    }

    for (const keycloakRole of keycloakRoles) {
      if (roles.some((r) => r.name === keycloakRole.name)) continue;
      roles.push({
        name: keycloakRole.name,
        isVirtual: false,
        keycloakRole,
        description: keycloakRole.description,
      });
    }

    return roles;
  }

  /**
   * Create a new role in the authentication server and save its rules to the config.
   * The config entry is written even if the authentication server sync fails,
   * which is reported back via the keycloakSynced flag.
   */
  async createRole(
    name: string,
    description: string,
    rules: DatabaseRule[],
  ): Promise<{ keycloakSynced: boolean }> {
    let keycloakSynced = true;
    try {
      await firstValueFrom(
        this.userAdminService.createRole({ name, description }),
      );
    } catch (err) {
      Logging.warn("Failed to create role in authentication server", err);
      keycloakSynced = false;
    }

    await this.saveRules(name, rules);
    return { keycloakSynced };
  }

  /**
   * Remove a role from the permissions config and the authentication server.
   */
  async deleteRole(name: string): Promise<{ keycloakSynced: boolean }> {
    const config = await this.loadPermissionsConfig();
    const data = { ...(config.data ?? {}) };
    delete data[name];
    await this.saveWithBackup(config, data);

    let keycloakSynced = true;
    try {
      await firstValueFrom(this.userAdminService.deleteRole(name));
    } catch (err) {
      Logging.warn("Failed to delete role in authentication server", err);
      keycloakSynced = false;
    }
    return { keycloakSynced };
  }

  /**
   * Update a role's description in the authentication server.
   * @returns whether the update succeeded
   */
  async updateRoleDescription(
    name: string,
    description: string,
  ): Promise<boolean> {
    try {
      await firstValueFrom(
        this.userAdminService.updateRole(name, { description }),
      );
      return true;
    } catch (err) {
      Logging.warn("Failed to update role in authentication server", err);
      return false;
    }
  }

  /**
   * Update the rules of a single role in the permissions config,
   * keeping a backup of the previous state with an "undo" option.
   */
  async saveRules(roleName: string, rules: DatabaseRule[]) {
    const config = await this.loadPermissionsConfig();
    await this.saveWithBackup(config, {
      ...(config.data ?? {}),
      [roleName]: rules,
    });
  }

  /**
   * Replace the complete permissions config (e.g. after raw JSON editing),
   * keeping a backup of the previous state with an "undo" option.
   */
  async savePermissionsConfig(data: DatabaseRules) {
    const config = await this.loadPermissionsConfig();
    await this.saveWithBackup(config, data);
  }

  private async saveWithBackup(
    config: Config<DatabaseRules>,
    newData: DatabaseRules,
  ) {
    const previousConfigBackup = new Config(
      Config.PERMISSION_KEY + ":" + moment().format("YYYY-MM-DD_HH-mm-ss"),
      config.data,
    );
    await this.entityMapper.save(previousConfigBackup);

    config.data = newData;
    await this.entityMapper.save(config);

    const snackBarRef = this.snackBar.open(
      $localize`Permissions updated`,
      $localize`Undo`,
      { duration: 8000 },
    );
    snackBarRef.onAction().subscribe(async () => {
      config.data = previousConfigBackup.data;
      await this.entityMapper.save(config);
      await this.entityMapper.remove(previousConfigBackup);
    });
  }
}
