import { inject, Injectable } from "@angular/core";
import { Config } from "../../config/config";
import {
  DatabaseRule,
  DatabaseRules,
  DEFAULT_SECTION_KEY,
  EntityActionPermission,
  isReservedRuleConfigKey,
  LEGACY_DEFAULT_KEY,
} from "../permission-types";
import { PermissionsConfigService } from "../permissions-config.service";

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
const FEATURE_USE_ACTION: EntityActionPermission = "read";
const FEATURE_MANAGE_ACTION: EntityActionPermission = "manage";

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
   * `false` when the role's access is (partly) decided by a rule the grid does not
   * own - a wildcard `all` subject, a grouped/array subject, a conditioned rule,
   * an inverted (deny) rule or a rule in the shared `_default` block. In that case
   * the checkboxes reflect the role's *effective* access but are shown read-only,
   * because the grid cannot change such a rule without affecting other entity
   * types; the admin must use the advanced (raw JSON) editor instead.
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
   * true if at least one role's access is decided by rules the grid cannot edit
   * (wildcards, grouped subjects, conditions, inverted rules or shared `_default`
   * rules) - i.e. some rows are read-only.
   *
   * When true the UI points admins to the advanced (raw JSON) permissions editor
   * for the full picture. Editing via the grid stays safe either way:
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
  private readonly permissionsConfig = inject(PermissionsConfigService);

  /**
   * Compute the current "Use"/"Manage" state of the given roles for one feature.
   * @param entityType the feature's ENTITY_TYPE (e.g. "EmailTemplate")
   * @param roleNames the roles to display (typically all assignable roles)
   */
  async getPermissions(
    entityType: string,
    roleNames: string[],
  ): Promise<FeaturePermissionState> {
    const rules = (await this.permissionsConfig.load())?.data ?? {};
    // rules in `_default` apply to every logged-in user, on top of their role rules
    const defaultRules =
      rules[DEFAULT_SECTION_KEY] ?? rules[LEGACY_DEFAULT_KEY] ?? [];

    const roles: RoleFeaturePermission[] = roleNames.map((role) => {
      const roleRules = rules[role] ?? [];
      const effectiveRules = [...defaultRules, ...roleRules];

      // access decided by a rule the grid does not own (wildcard, grouped subject,
      // condition, inverted rule, or a `_default` rule) cannot be changed via the
      // grid -> show the effective state read-only
      const decidedByUneditableRule = effectiveRules.some(
        (rule) =>
          this.affectsFeature(rule, entityType) &&
          !this.isGridOwnedRule(rule, entityType),
      );

      if (decidedByUneditableRule) {
        const manage = this.hasEffectiveAccess(
          effectiveRules,
          entityType,
          FEATURE_MANAGE_ACTION,
        );
        const use =
          manage ||
          this.hasEffectiveAccess(
            effectiveRules,
            entityType,
            FEATURE_USE_ACTION,
          );
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
   * other rule (including `_default`/`_public` and complex rules) is preserved.
   * A timestamped backup of the previous config is stored before saving.
   *
   * @returns the backup Config that was created, so callers can offer an "undo".
   */
  async setPermissions(
    entityType: string,
    updates: Pick<RoleFeaturePermission, "role" | "use" | "manage">[],
  ): Promise<Config<DatabaseRules>> {
    const config = await this.loadOrInitPermissionsConfig();
    const updatedData = structuredClone(config.data);

    for (const { role, use, manage } of updates) {
      // never edit the shared baseline sections through the per-role grid
      if (isReservedRuleConfigKey(role)) {
        continue;
      }

      // keep every rule we don't own, then re-add the selected owned rules
      const preserved = (updatedData[role] ?? []).filter(
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
        updatedData[role] = updated;
      } else {
        delete updatedData[role];
      }
    }

    return this.permissionsConfig.saveWithBackup(config, updatedData);
  }

  /**
   * The user roles that already appear in the permissions config, excluding the
   * special `_default` (shared baseline) and `_public` (unauthenticated) keys.
   *
   * Used as a robust source of roles that does not depend on the Keycloak admin
   * API being reachable.
   */
  async getConfiguredRoleNames(): Promise<string[]> {
    const rules = (await this.permissionsConfig.load())?.data ?? {};
    return Object.keys(rules).filter((role) => !isReservedRuleConfigKey(role));
  }

  /**
   * A rule is "owned" by the grid (and thus safe to read/rewrite) only if it
   * grants a single feature action to exactly this entity type without any
   * conditions or inversion. Managed `[system-default]` rules (written by the
   * backend to guarantee a baseline) are never owned, so they are left untouched.
   */
  private isGridOwnedRule(rule: DatabaseRule, entityType: string): boolean {
    return (
      !rule.inverted &&
      !rule.conditions &&
      !rule.reason?.includes("[system-default]") &&
      rule.subject === entityType &&
      (rule.action === FEATURE_USE_ACTION ||
        rule.action === FEATURE_MANAGE_ACTION)
    );
  }

  /**
   * Whether the rule has any say over this feature's access, no matter whether it
   * grants or denies it.
   */
  private affectsFeature(rule: DatabaseRule, entityType: string): boolean {
    return this.coversAction(rule, entityType, FEATURE_USE_ACTION);
  }

  /**
   * Whether the given rules leave the role with the action in effect.
   *
   * An inverted rule revokes a grant: CASL resolves a `cannot` on the same
   * subject in favour of the denial, so a row that ignored it would claim access
   * the user does not have. The grid cannot express such a rule, which is why any
   * role affected by one is rendered read-only.
   */
  private hasEffectiveAccess(
    rules: DatabaseRule[],
    entityType: string,
    action: EntityActionPermission,
  ): boolean {
    const relevant = rules.filter((rule) =>
      this.coversAction(rule, entityType, action),
    );
    return relevant.length > 0 && !relevant.some((rule) => rule.inverted);
  }

  /**
   * Whether the rule applies to this entity type and covers the given action,
   * ignoring conditions and inversion. "manage" covers every other action.
   */
  private coversAction(
    rule: DatabaseRule,
    entityType: string,
    action: EntityActionPermission,
  ): boolean {
    return (
      this.subjectMatches(rule.subject, entityType) &&
      (this.actionIncludes(rule.action, action) ||
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

  private async loadOrInitPermissionsConfig(): Promise<Config<DatabaseRules>> {
    const existing = await this.permissionsConfig.load();
    if (existing?.data) {
      return existing;
    }

    // No permissions config yet means "everyone may do everything". Seed the
    // `_default` all-access rule so that starting to restrict a single feature
    // does not accidentally lock every logged-in user out of everything else.
    // This is the one case in which the grid writes a `_default` section.
    const config = existing ?? new Config<DatabaseRules>(Config.PERMISSION_KEY);
    config.data = {
      [DEFAULT_SECTION_KEY]: [{ subject: "all", action: "manage" }],
    };
    return config;
  }
}
