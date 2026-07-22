import { inject, Injectable } from "@angular/core";
import moment from "moment";
import { Config } from "../../config/config";
import { EntityMapperService } from "../../entity/entity-mapper/entity-mapper.service";
import { SessionSubject } from "../../session/auth/session-info";
import {
  DatabaseRule,
  DatabaseRules,
  EntityActionPermission,
} from "../permission-types";

/**
 * Maps the "Use" / "Manage" checkboxes shown in the feature-permission UI to the
 * underlying CASL actions stored in the permissions config.
 *
 * This is the single source of truth for that mapping: if "Use" should ever grant
 * more than read access (e.g. also create/update), change {@link FEATURE_USE_ACTION}.
 *
 * Semantics (confirmed with product): "read" lets a role *use* a feature
 * (e.g. send emails from an EmailTemplate) without being able to add/edit its
 * records, while "manage" grants full control.
 */
export const FEATURE_USE_ACTION: EntityActionPermission = "read";
export const FEATURE_MANAGE_ACTION: EntityActionPermission = "manage";

/**
 * The "Use"/"Manage" permission state of a single role for one feature entity type.
 */
export interface RoleFeaturePermission {
  /** the role's technical name as used as a key in the permissions config */
  role: string;
  /** whether the role effectively has the "Use" (read) permission for this feature */
  use: boolean;
  /** whether the role effectively has the "Manage" (manage) permission for this feature */
  manage: boolean;
  /**
   * Whether this row can be edited via the grid.
   *
   * `false` when the role's access is (partly) granted by a rule the grid does not
   * own - a wildcard `all` subject, a grouped/array subject, a conditioned rule or
   * a rule in the shared `default` block. In that case the checkboxes reflect the
   * role's *effective* access but are shown read-only, because the grid cannot
   * remove such a grant without affecting other entity types; the admin must use
   * the advanced (raw JSON) editor instead.
   */
  editable: boolean;
}

/**
 * The editable permission state of one feature entity type across the given roles.
 */
export interface FeaturePermissionState {
  entityType: string;
  roles: RoleFeaturePermission[];

  /**
   * true if at least one role's access is granted by rules the grid cannot edit
   * (wildcards, grouped subjects, conditions or shared `default` rules) - i.e. some
   * rows are read-only.
   *
   * When true the UI should point admins to the advanced (raw JSON) permissions
   * editor for the full picture. Editing via the grid stays safe either way:
   * {@link FeaturePermissionService.setPermissions} never mutates those rules.
   */
  hasComplexRules: boolean;
}

/**
 * Read and edit the per-role "Use"/"Manage" permissions of a single feature
 * (internal entity type such as EmailTemplate, TemplateExport, ReportConfig, ...)
 * against the central `Config:Permissions` document.
 *
 * To keep the two-checkbox model a faithful (non-destructive) projection of the
 * arbitrarily complex CASL rules, this service only ever reads and writes rules
 * that it "owns" for the exact entity type (single string subject, no conditions,
 * action `read` or `manage`). Any other rule - grouped subjects, conditions,
 * wildcards, inverted rules or other actions - is preserved untouched, and surfaced
 * via {@link FeaturePermissionState.hasComplexRules} so the UI can defer to the
 * advanced editor.
 */
@Injectable({ providedIn: "root" })
export class FeaturePermissionService {
  private readonly entityMapper = inject(EntityMapperService);
  private readonly sessionInfo = inject(SessionSubject);

  /**
   * Whether the current user is allowed to edit the permissions config at all.
   */
  hasAdminPermission(): boolean {
    const roles = this.sessionInfo.value?.roles ?? [];
    return roles.includes("admin_app");
  }

  /**
   * Compute the current "Use"/"Manage" state of the given roles for one feature.
   * @param entityType the feature's ENTITY_TYPE (e.g. "EmailTemplate")
   * @param roleNames the roles to display (typically all assignable roles)
   */
  async getPermissions(
    entityType: string,
    roleNames: string[],
  ): Promise<FeaturePermissionState> {
    const rules = (await this.loadPermissionsConfig())?.data ?? {};
    // rules in `default` apply to every logged-in user, on top of their role rules
    const defaultRules = rules.default ?? [];

    const roles: RoleFeaturePermission[] = roleNames.map((role) => {
      const roleRules = rules[role] ?? [];
      const effectiveRules = [...defaultRules, ...roleRules];

      // access granted by a rule the grid does not own (wildcard, grouped subject,
      // condition, or a `default` rule) cannot be removed via the grid -> read-only
      const grantedByUneditableRule = effectiveRules.some(
        (rule) =>
          this.grantsRead(rule, entityType) &&
          !this.isGridOwnedRule(rule, entityType),
      );

      if (grantedByUneditableRule) {
        const manage = effectiveRules.some((rule) =>
          this.grantsManage(rule, entityType),
        );
        const use =
          manage ||
          effectiveRules.some((rule) => this.grantsRead(rule, entityType));
        return { role, use, manage, editable: false };
      }

      // otherwise the role's access is fully described by rules we own and can edit
      const owned = roleRules.filter((rule) =>
        this.isGridOwnedRule(rule, entityType),
      );
      return {
        role,
        use: owned.some((rule) => rule.action === FEATURE_USE_ACTION),
        manage: owned.some((rule) => rule.action === FEATURE_MANAGE_ACTION),
        editable: true,
      };
    });

    return {
      entityType,
      roles,
      hasComplexRules: roles.some((role) => !role.editable),
    };
  }

  /**
   * Persist the updated "Use"/"Manage" state for the given roles.
   *
   * Only rules this service owns for the exact entity type are replaced; every
   * other rule (including `default`/`public` and complex rules) is preserved.
   * A timestamped backup of the previous config is stored before saving.
   *
   * @returns the backup Config that was created, so callers can offer an "undo".
   */
  async setPermissions(
    entityType: string,
    updates: Pick<RoleFeaturePermission, "role" | "use" | "manage">[],
  ): Promise<Config<DatabaseRules>> {
    const config = await this.loadOrInitPermissionsConfig();
    const backup = new Config<DatabaseRules>(
      Config.PERMISSION_KEY + ":" + moment().format("YYYY-MM-DD_HH-mm-ss"),
      structuredClone(config.data),
    );

    for (const { role, use, manage } of updates) {
      // keep every rule we don't own, then re-add the selected owned rules
      const preserved = (config.data[role] ?? []).filter(
        (rule) => !this.isGridOwnedRule(rule, entityType),
      );
      const updated = [...preserved];
      if (use) {
        updated.push({ subject: entityType, action: FEATURE_USE_ACTION });
      }
      if (manage) {
        updated.push({ subject: entityType, action: FEATURE_MANAGE_ACTION });
      }

      if (updated.length > 0) {
        config.data[role] = updated;
      } else {
        delete config.data[role];
      }
    }

    await this.entityMapper.save(backup);
    await this.entityMapper.save(config);
    return backup;
  }

  /**
   * The user roles that already appear in the permissions config, excluding the
   * special `default` (shared baseline) and `public` (unauthenticated) keys.
   *
   * Used as a robust source of roles that does not depend on the Keycloak admin
   * API being reachable.
   */
  async getConfiguredRoleNames(): Promise<string[]> {
    const rules = (await this.loadPermissionsConfig())?.data ?? {};
    return Object.keys(rules).filter(
      (role) => role !== "default" && role !== "public",
    );
  }

  /**
   * A rule is "owned" by the grid (and thus safe to read/rewrite) only if it
   * grants a single feature action to exactly this entity type without any
   * conditions or inversion.
   */
  private isGridOwnedRule(rule: DatabaseRule, entityType: string): boolean {
    return (
      !rule.inverted &&
      !rule.conditions &&
      rule.subject === entityType &&
      (rule.action === FEATURE_USE_ACTION ||
        rule.action === FEATURE_MANAGE_ACTION)
    );
  }

  /** Whether the rule grants "manage" on this entity type (ignoring conditions). */
  private grantsManage(rule: DatabaseRule, entityType: string): boolean {
    return (
      !rule.inverted &&
      this.subjectMatches(rule.subject, entityType) &&
      this.actionIncludes(rule.action, FEATURE_MANAGE_ACTION)
    );
  }

  /**
   * Whether the rule grants at least "read" on this entity type (ignoring
   * conditions). "manage" implies "read".
   */
  private grantsRead(rule: DatabaseRule, entityType: string): boolean {
    return (
      !rule.inverted &&
      this.subjectMatches(rule.subject, entityType) &&
      (this.actionIncludes(rule.action, FEATURE_USE_ACTION) ||
        this.actionIncludes(rule.action, FEATURE_MANAGE_ACTION))
    );
  }

  private subjectMatches(
    subject: DatabaseRule["subject"],
    entityType: string,
  ): boolean {
    if (Array.isArray(subject)) {
      return subject.includes(entityType) || subject.includes("all");
    }
    return subject === entityType || subject === "all";
  }

  private actionIncludes(
    action: DatabaseRule["action"],
    target: EntityActionPermission,
  ): boolean {
    return Array.isArray(action) ? action.includes(target) : action === target;
  }

  private async loadPermissionsConfig(): Promise<Config<DatabaseRules> | null> {
    try {
      return await this.entityMapper.load<Config<DatabaseRules>>(
        Config,
        Config.PERMISSION_KEY,
      );
    } catch {
      return null;
    }
  }

  private async loadOrInitPermissionsConfig(): Promise<Config<DatabaseRules>> {
    const existing = await this.loadPermissionsConfig();
    if (existing?.data) {
      return existing;
    }

    // No permissions config yet means "everyone may do everything". Seed the
    // `default` all-access rule so that starting to restrict a single feature
    // does not accidentally lock every logged-in user out of everything else.
    const config = existing ?? new Config<DatabaseRules>(Config.PERMISSION_KEY);
    config.data = { default: [{ subject: "all", action: "manage" }] };
    return config;
  }
}
