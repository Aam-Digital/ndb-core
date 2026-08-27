import { Injectable, Signal, computed, inject } from "@angular/core";
import { toSignal } from "@angular/core/rxjs-interop";
import { MatSnackBar } from "@angular/material/snack-bar";
import moment from "moment";
import { firstValueFrom, of } from "rxjs";
import { catchError } from "rxjs/operators";

import { Config } from "../../config/config";
import { EntityMapperService } from "../../entity/entity-mapper/entity-mapper.service";
import { SessionSubject } from "../../session/auth/session-info";
import {
  DatabaseRule,
  DatabaseRules,
  RESERVED_ROLE_PREFIX,
  RESERVED_RULE_CONFIG_KEYS,
} from "../../permissions/permission-types";
import { migrateLegacySectionKeys } from "../../permissions/permissions-config-migration";
import { RESERVED_ROLES } from "../../permissions/reserved-roles";
import { Role } from "../../user/user-admin-service/user-account";
import { UserAdminService } from "../../user/user-admin-service/user-admin.service";

/**
 * Whether a key of the permissions config carries special semantics instead of
 * naming a user role, so it must never be listed as an ordinary, deletable role.
 */
function isReservedRuleConfigKey(key: string): boolean {
  return (
    key.startsWith(RESERVED_ROLE_PREFIX) ||
    RESERVED_RULE_CONFIG_KEYS.includes(key)
  );
}

/**
 * Base route of the role management admin UI, to link to a role's details
 * from elsewhere. Mirrors the "user-roles" paths registered in admin.routing.ts.
 */
export const ROLES_ADMIN_ROUTE = "/admin/user-roles";

/**
 * Technical roles that serve a special function in the authentication server
 * (e.g. granting account-management API access, or opting a user out of
 * email 2FA). They must not be deleted from this admin UI, and their
 * description is managed elsewhere, so it stays read-only here.
 * They may still carry additional permission rules like any other role.
 */
export const INTERNAL_ROLES: string[] = [
  UserAdminService.ACCOUNT_MANAGER_ROLE,
  "no-email-2fa",
];

/**
 * A user role and its configured permission rules,
 * merged from the Config:Permissions document and the authentication server (Keycloak).
 */
export interface RoleWithPermissions {
  name: string;

  description?: string;

  /**
   * Virtual roles ("_default", "_public") only exist in the permissions config
   * and have no matching realm role in the authentication server.
   */
  isVirtual: boolean;

  /**
   * Whether the role is protected from deletion and description edits:
   * the virtual reserved roles and the technical {@link INTERNAL_ROLES}.
   */
  isProtected: boolean;

  keycloakRole?: Role;

  /**
   * The permission rules configured for this role.
   * undefined if the role has no entry in the permissions config yet
   * (in which case only the "_default" rules apply to its users).
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
  private readonly sessionInfo = inject(SessionSubject);

  private readonly session = toSignal(this.sessionInfo);

  /**
   * Whether the logged-in user is allowed to create/delete roles in the
   * authentication server (i.e. holds the "manage-realm" client role).
   * Reactive, so it settles correctly if the session resolves after init.
   * True when the capability cannot be determined from the token
   * (so a capable admin is never wrongly blocked).
   */
  readonly canManageRoles: Signal<boolean> = computed(() => {
    const realmManagementRoles = this.session()?.realmManagementRoles;
    // undefined = token does not carry client roles -> unknown -> allow
    return (
      realmManagementRoles === undefined ||
      realmManagementRoles.includes("manage-realm") ||
      realmManagementRoles.includes("realm-admin")
    );
  });

  /**
   * The permissions config document, or an empty one if it does not exist yet.
   *
   * Only an explicit "not found" is treated as "no permissions configured".
   * Any other load failure (e.g. offline, or a temporary server error) is
   * propagated: treating it as an empty config would make the callers below
   * save a document that silently drops every already configured role.
   */
  loadPermissionsConfig(): Promise<Config<DatabaseRules>> {
    return this.entityMapper
      .load<Config<DatabaseRules>>(Config, Config.PERMISSION_KEY)
      .catch((err) => {
        const error = err as { status?: number; name?: string } | null;
        if (error?.status === 404 || error?.name === "not_found") {
          return new Config(Config.PERMISSION_KEY, {});
        }
        throw err;
      });
  }

  /**
   * All roles, merged from permissions config keys and realm roles:
   * always starting with the virtual "_default" and "_public" roles,
   * followed by all other config keys and remaining realm roles.
   */
  async loadRoles(): Promise<RoleWithPermissions[]> {
    const rules: DatabaseRules = migrateLegacySectionKeys(
      (await this.loadPermissionsConfig()).data ?? {},
    );
    const keycloakRoles: Role[] = await firstValueFrom(
      this.userAdminService.getAllRoles().pipe(catchError(() => of([]))),
    );

    const roles: RoleWithPermissions[] = RESERVED_ROLES.map((reservedRole) => ({
      name: reservedRole.key,
      isVirtual: true,
      isProtected: true,
      description: reservedRole.description,
      rules: rules[reservedRole.key],
    }));

    for (const key of Object.keys(rules)) {
      if (isReservedRuleConfigKey(key)) continue;
      const keycloakRole = keycloakRoles.find((r) => r.name === key);
      roles.push({
        name: key,
        isVirtual: false,
        isProtected: INTERNAL_ROLES.includes(key),
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
        isProtected: INTERNAL_ROLES.includes(keycloakRole.name),
        keycloakRole,
        description: keycloakRole.description,
      });
    }

    return roles;
  }

  /**
   * Create a new role in the authentication server and save its rules to the config.
   * The realm role is created first; if that fails the config is left untouched
   * (a config-only role would be unassignable).
   * @throws when the role could not be created in the authentication server
   */
  async createRole(name: string, description: string, rules: DatabaseRule[]) {
    await firstValueFrom(
      this.userAdminService.createRole({ name, description }),
    );
    await this.saveRules(name, rules);
  }

  /**
   * Remove a role from the authentication server and the permissions config.
   * The realm role is deleted first; if that fails the config is left untouched.
   * @throws when the role could not be deleted in the authentication server
   */
  async deleteRole(name: string) {
    await firstValueFrom(this.userAdminService.deleteRole(name));

    const config = await this.loadPermissionsConfig();
    const data = { ...(config.data ?? {}) };
    delete data[name];
    await this.saveWithBackup(config, data);
  }

  /**
   * Update a role's description in the authentication server.
   * @throws when the update fails
   */
  async updateRoleDescription(name: string, description: string) {
    await firstValueFrom(
      this.userAdminService.updateRole(name, { description }),
    );
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
