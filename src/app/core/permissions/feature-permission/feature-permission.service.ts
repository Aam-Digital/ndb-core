import { inject, Injectable } from "@angular/core";
import { Config } from "../../config/config";
import {
  DatabaseRule,
  DatabaseRules,
  DEFAULT_SECTION_KEY,
  EntityActionPermission,
  isReservedRuleConfigKey,
  LEGACY_DEFAULT_KEY,
  ruleCoversAction,
  SYSTEM_DEFAULT_RULE_REASON,
} from "../permission-types";
import { PermissionsConfigService } from "../permissions-config.service";

/**
 * The actions offered as a checkbox in the feature-permission UI, in display order.
 *
 * A role that is granted all of them is stored as the CASL `manage` action instead,
 * so that a config written by an admin keeps the shape it had before.
 */
export const FEATURE_ACTIONS = [
  "create",
  "read",
  "update",
  "delete",
] as const satisfies readonly EntityActionPermission[];

export type FeatureAction = (typeof FEATURE_ACTIONS)[number];

/** why a checkbox is shown but cannot be changed here */
export type PermissionLockReason =
  /** granted to everyone by the shared `_default` section */
  | "default"
  /**
   * The role's access comes from a rule this UI must not rewrite, because
   * changing it would affect other roles or entity types:
   * an `all` wildcard subject (the most common case, e.g. `admin_app`),
   * a grouped subject (`subject: ["A", "B"]`), a rule carrying `conditions`,
   * an inverted (deny) rule, or a rule the server manages itself
   * (marked with {@link SYSTEM_DEFAULT_RULE_REASON}).
   */
  | "advanced-rule";

/** the state of a single action checkbox in one row */
export interface FeatureActionPermission {
  /** the effective access, i.e. what the checkbox shows when the dialog opens */
  granted: boolean;
  /**
   * Whether the row's *own* rules for this entity type grant the action, ignoring
   * what the shared `_default` section adds on top.
   *
   * The dialog keeps this as the row's own intent, so that unticking an action on
   * the `_default` row reveals a role's own rule again instead of discarding it.
   */
  grantedByOwnRule: boolean;
  editable: boolean;
  lockedBy?: PermissionLockReason;
}

/**
 * The permission state of one row of the dialog - either a user role or the
 * shared `_default` section - for one feature entity type.
 */
export interface RoleFeaturePermission {
  /** the role's technical name as used as a key in the permissions config */
  role: string;
  actions: Record<FeatureAction, FeatureActionPermission>;
  /**
   * Whether any checkbox of this row can be edited.
   *
   * `false` for a row whose access to this feature is decided by a rule this UI
   * does not own - a wildcard `all` subject, a grouped subject, a conditioned
   * rule or an inverted (deny) rule. Such a row shows its *effective* access
   * read-only, because the rule cannot be changed without affecting other entity
   * types or roles; the admin must use the role administration instead.
   *
   * This applies to the `_default` row just like to a role row: it is editable
   * whenever the shared section holds no rule that this UI cannot express.
   */
  editable: boolean;
}

/**
 * The editable permission state of one feature entity type across the given roles.
 */
export interface FeaturePermissionState {
  entityType: string;

  /**
   * The shared `_default` section, shown as the first row so that checkboxes
   * disabled on the role rows have a visible reason - and editable like any
   * other row, matching the role administration (Admin > Roles).
   */
  defaultRules: RoleFeaturePermission;

  roles: RoleFeaturePermission[];
}

/** the actions of one row as sent back to {@link FeaturePermissionService.setPermissions} */
export interface RoleFeaturePermissionUpdate {
  role: string;
  actions: Record<FeatureAction, boolean>;
}

/**
 * Read and edit the per-role permissions of a single feature (internal entity
 * type such as EmailTemplate, TemplateExport, ReportConfig, ...) against the
 * central `Config:Permissions` document.
 *
 * To keep the checkbox grid a faithful (non-destructive) projection of the
 * arbitrarily complex CASL rules, this service only ever reads and writes rules
 * that it "owns" for the exact entity type (single string subject, no conditions,
 * only feature actions). Any other rule - grouped subjects, conditions, wildcards
 * or inverted rules - is preserved untouched, and the roles it affects are
 * reported as not editable, so the UI can defer to the role administration.
 */
@Injectable({ providedIn: "root" })
export class FeaturePermissionService {
  private readonly permissionsConfig = inject(PermissionsConfigService);

  /**
   * Compute the current permission state of the given roles for one feature.
   * @param entityType the feature's ENTITY_TYPE (e.g. "EmailTemplate")
   * @param roleNames the roles to display (typically all assignable roles)
   */
  async getPermissions(
    entityType: string,
    roleNames: string[],
  ): Promise<FeaturePermissionState> {
    const rules = (await this.permissionsConfig.load())?.data ?? {};
    const defaultRules = this.getDefaultRules(rules);
    const grantedByDefault = this.getDefaultGrants(defaultRules, entityType);

    const roles = roleNames
      .filter((role) => !isReservedRuleConfigKey(role))
      .map((role) =>
        this.getRolePermission(
          role,
          rules[role] ?? [],
          defaultRules,
          grantedByDefault,
          entityType,
        ),
      );

    return {
      entityType,
      // the shared section is read and written like any other row; it cannot
      // inherit from itself, so nothing is locked as "granted by default" here
      defaultRules: this.getRolePermission(
        DEFAULT_SECTION_KEY,
        defaultRules,
        [],
        this.mapActions(() => false),
        entityType,
      ),
      roles,
    };
  }

  private getRolePermission(
    role: string,
    roleRules: DatabaseRule[],
    defaultRules: DatabaseRule[],
    grantedByDefault: Record<FeatureAction, boolean>,
    entityType: string,
  ): RoleFeaturePermission {
    // access decided by a rule this UI does not own (wildcard, grouped subject,
    // condition or inverted rule) cannot be changed here -> show the effective
    // state of the whole row read-only.
    const hasAdvancedRule = roleRules.some(
      (rule) =>
        this.affectsFeature(rule, entityType) &&
        !this.isOwnedRule(rule, entityType),
    );

    if (hasAdvancedRule) {
      const effectiveRules = [...defaultRules, ...roleRules];
      return {
        role,
        actions: this.mapActions((action) => {
          const granted = this.hasEffectiveAccess(
            effectiveRules,
            entityType,
            action,
          );
          // the row cannot be edited at all, so there is no separate "own" state
          return {
            granted,
            grantedByOwnRule: granted,
            editable: false,
            lockedBy: "advanced-rule",
          };
        }),
        editable: false,
      };
    }

    const ownedRules = roleRules.filter((rule) =>
      this.isOwnedRule(rule, entityType),
    );
    return {
      role,
      actions: this.mapActions((action) => {
        const grantedByOwnRule = ownedRules.some((rule) =>
          ruleCoversAction(rule, entityType, action),
        );
        // an action granted to everyone through `_default` cannot be revoked for a
        // single role here (that would need an inverted rule), so it is locked
        if (grantedByDefault[action]) {
          return {
            granted: true,
            grantedByOwnRule,
            editable: false,
            lockedBy: "default",
          };
        }
        return { granted: grantedByOwnRule, grantedByOwnRule, editable: true };
      }),
      editable: true,
    };
  }

  /**
   * Persist the updated permissions for the given rows (user roles and the
   * shared `_default` section).
   *
   * Only rules this service owns for the exact entity type are replaced; every
   * other rule (including `_public` and complex rules) is preserved.
   * Actions already granted through `_default` are never written as a role rule,
   * so that inherited access does not get duplicated into every role.
   * A timestamped backup of the previous config is stored before saving.
   *
   * @returns the backup Config that was created, so callers can offer an "undo".
   */
  async setPermissions(
    entityType: string,
    updates: RoleFeaturePermissionUpdate[],
  ): Promise<Config<DatabaseRules>> {
    const existing = await this.permissionsConfig.load();
    // the grants to suppress on the role rows are the ones that are in effect
    // *after* this save, because `_default` can be edited in the same go.
    // Read before seeding below, so a seeded `_default` does not count as one
    // the admin saw as inherited.
    const grantedByDefault = this.getUpdatedDefaultGrants(
      updates,
      existing,
      entityType,
    );
    const config = this.ensurePermissionsConfig(existing);
    const updatedData = structuredClone(config.data);

    for (const { role, actions } of updates) {
      const isDefaultSection = role === DEFAULT_SECTION_KEY;
      // `_public` (and the legacy spellings) are never edited through this grid,
      // as they carry semantics the per-role checkboxes cannot represent
      if (!isDefaultSection && isReservedRuleConfigKey(role)) {
        continue;
      }

      const selected = FEATURE_ACTIONS.filter(
        (action) =>
          actions[action] &&
          // the shared section is what grants the action in the first place
          (isDefaultSection || !grantedByDefault[action]),
      );

      // keep every rule we don't own, then re-add the selected actions
      const preserved = (updatedData[role] ?? []).filter(
        (rule) => !this.isOwnedRule(rule, entityType),
      );
      const updated = [...preserved];
      const grantedAction = this.toRuleAction(selected);
      if (grantedAction) {
        updated.push({ subject: entityType, action: grantedAction });
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
   * Which actions the shared `_default` section grants for this feature once the
   * given updates are saved: taken from the submitted `_default` row if it was
   * editable (and therefore sent along), and from the stored config otherwise.
   */
  private getUpdatedDefaultGrants(
    updates: RoleFeaturePermissionUpdate[],
    existing: Config<DatabaseRules> | null,
    entityType: string,
  ): Record<FeatureAction, boolean> {
    const defaultUpdate = updates.find(
      ({ role }) => role === DEFAULT_SECTION_KEY,
    );
    if (defaultUpdate) {
      return this.mapActions((action) => defaultUpdate.actions[action]);
    }
    return this.getDefaultGrants(
      this.getDefaultRules(existing?.data ?? {}),
      entityType,
    );
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
   * The action to store for the given selection: `manage` if every feature action
   * is selected (keeping the shape an admin would write by hand), a plain string
   * for a single action and an array otherwise. `undefined` if nothing is selected.
   */
  private toRuleAction(
    selected: FeatureAction[],
  ): EntityActionPermission | EntityActionPermission[] | undefined {
    if (selected.length === 0) {
      return undefined;
    }
    if (selected.length === FEATURE_ACTIONS.length) {
      return "manage";
    }
    return selected.length === 1 ? selected[0] : [...selected];
  }

  /** rules in `_default` apply to every logged-in user, on top of their role rules */
  private getDefaultRules(rules: DatabaseRules): DatabaseRule[] {
    return rules[DEFAULT_SECTION_KEY] ?? rules[LEGACY_DEFAULT_KEY] ?? [];
  }

  /** which actions the shared `_default` section grants for this feature */
  private getDefaultGrants(
    defaultRules: DatabaseRule[],
    entityType: string,
  ): Record<FeatureAction, boolean> {
    return this.mapActions((action) =>
      this.hasEffectiveAccess(defaultRules, entityType, action),
    );
  }

  private mapActions<T>(
    valueFor: (action: FeatureAction) => T,
  ): Record<FeatureAction, T> {
    return Object.fromEntries(
      FEATURE_ACTIONS.map((action) => [action, valueFor(action)]),
    ) as Record<FeatureAction, T>;
  }

  /**
   * A rule is "owned" by this UI (and thus safe to read/rewrite) only if it grants
   * feature actions to exactly this entity type without any conditions or
   * inversion. Managed `[system-default]` rules (written by the backend to
   * guarantee a baseline) are never owned, so they are left untouched.
   */
  private isOwnedRule(rule: DatabaseRule, entityType: string): boolean {
    const actions = Array.isArray(rule.action) ? rule.action : [rule.action];
    return (
      !rule.inverted &&
      !rule.conditions &&
      !rule.reason?.includes(SYSTEM_DEFAULT_RULE_REASON) &&
      rule.subject === entityType &&
      actions.every(
        (action) =>
          action === "manage" ||
          FEATURE_ACTIONS.includes(action as FeatureAction),
      )
    );
  }

  /**
   * Whether the rule has any say over this feature's access, no matter whether it
   * grants or denies it.
   */
  private affectsFeature(rule: DatabaseRule, entityType: string): boolean {
    return FEATURE_ACTIONS.some((action) =>
      ruleCoversAction(rule, entityType, action),
    );
  }

  /**
   * Whether the given rules leave the role with the action in effect.
   *
   * CASL resolves overlapping rules so that the last matching one wins, so an
   * inverted rule revokes a grant that came before it while a later granting
   * rule re-enables access again. Ignoring that would make a row claim access
   * the user does not have. This UI cannot express an inverted rule, which is
   * why any role affected by one is rendered read-only.
   *
   * `rules` must be in the order the AbilityService applies them, i.e. the
   * shared `_default` section first and the role's own rules after it.
   */
  private hasEffectiveAccess(
    rules: DatabaseRule[],
    entityType: string,
    action: EntityActionPermission,
  ): boolean {
    const decidingRule = rules.findLast((rule) =>
      ruleCoversAction(rule, entityType, action),
    );
    return !!decidingRule && !decidingRule.inverted;
  }

  private ensurePermissionsConfig(
    existing: Config<DatabaseRules> | null,
  ): Config<DatabaseRules> {
    if (existing?.data) {
      return existing;
    }

    // No permissions config yet means "everyone may do everything". Seed the
    // `_default` all-access rule so that starting to restrict a single feature
    // does not accidentally lock every logged-in user out of everything else.
    // This is the one case in which this UI writes a `_default` section.
    const config = existing ?? new Config<DatabaseRules>(Config.PERMISSION_KEY);
    config.data = {
      [DEFAULT_SECTION_KEY]: [{ subject: "all", action: "manage" }],
    };
    return config;
  }
}
