import { Ability, RawRuleOf } from "@casl/ability";
import { Entity, EntityConstructor } from "../entity/model/entity";

/**
 * The individual CRUD actions, in the order they are displayed as columns of the
 * permission UIs.
 */
export const CRUD_ACTIONS = ["read", "create", "update", "delete"] as const;

export type CrudAction = (typeof CRUD_ACTIONS)[number];

/**
 * The list of action strings that can be used for permissions
 */
const actions = [...CRUD_ACTIONS, "manage"] as const; // "manage" matches any action

/**
 * The type which defines which actions can be used for permissions.
 * The type allows all strings defined in the `actions` array.
 * E.g. "read" or "manage"
 */
export type EntityActionPermission = (typeof actions)[number];

/**
 * The type which defines which subjects can be used for permissions.
 * This matches any entity classes, entity objects and the wildcard string "all"
 * E.g. `Child`, `new Note()` or `all`
 */
export type EntitySubject = EntityConstructor | Entity | string;

/**
 * The format that the JSON defined rules need to have.
 * In the JSON object the Entities can be specified by using their ENTITY_TYPE string representation.
 */
export type DatabaseRule = RawRuleOf<Ability<[EntityActionPermission, string]>>;

/**
 * Section keys in {@link DatabaseRules} that carry special semantics instead of
 * mapping a user role. The underscore prefix marks them as internal so they
 * cannot collide with a realm role name.
 */
export const DEFAULT_SECTION_KEY = "_default";
export const PUBLIC_SECTION_KEY = "_public";

/** A user role starting with this prefix is reserved and never resolved. */
export const RESERVED_ROLE_PREFIX = "_";

/**
 * The realm role that grants access to the administration features, as checked
 * by the admin routes' {@link UserRoleGuard} configuration.
 */
export const ADMIN_APP_ROLE = "admin_app";

/**
 * All section keys that must never be resolved as if they were user role names,
 * even if a realm role with the same name exists.
 *
 * A new key added here does not automatically stop inheriting the "_default"
 * rules; see {@link inheritsDefaultRules}.
 */
export const RESERVED_RULE_CONFIG_KEYS: string[] = [
  DEFAULT_SECTION_KEY,
  PUBLIC_SECTION_KEY,
];

/**
 * Whether a key in {@link DatabaseRules} carries special semantics instead of
 * naming a user role, so it must neither be resolved as a role nor rewritten by
 * a per-role UI. Covers the reserved underscore prefix as well as the legacy
 * (non-prefixed) spellings of not yet migrated configs.
 */
export function isReservedRuleConfigKey(key: string): boolean {
  return (
    key.startsWith(RESERVED_ROLE_PREFIX) ||
    RESERVED_RULE_CONFIG_KEYS.includes(key)
  );
}

/**
 * Marker written into a rule's `reason` by the backend for rules it manages itself
 * to guarantee a baseline. Such rules must not be rewritten by an admin UI.
 */
export const SYSTEM_DEFAULT_RULE_REASON = "[system-default]";

/**
 * Whether the rule applies to the given entity type, ignoring conditions and
 * inversion. `all` matches every entity type.
 */
export function ruleAppliesToSubject(
  subject: DatabaseRule["subject"],
  entityType: string,
): boolean {
  if (Array.isArray(subject)) {
    return subject.includes(entityType) || subject.includes("all");
  }
  return subject === entityType || subject === "all";
}

/**
 * Whether the rule grants the given action for the entity type, ignoring conditions
 * and inversion. `manage` covers every other action, and a rule can list several
 * actions as an array.
 */
export function ruleCoversAction(
  rule: DatabaseRule,
  entityType: string,
  action: EntityActionPermission,
): boolean {
  const actions = Array.isArray(rule.action) ? rule.action : [rule.action];
  return (
    ruleAppliesToSubject(rule.subject, entityType) &&
    (actions.includes(action) || actions.includes("manage"))
  );
}

/**
 * Whether users of the given role also receive the shared "_default" rules.
 * False for "_default", which cannot inherit from itself, and for "_public",
 * which applies to visitors who are not logged in and never get the "_default"
 * rules (see AbilityService.getRulesForUser).
 *
 * The excluded keys are listed explicitly instead of taken from
 * {@link RESERVED_RULE_CONFIG_KEYS}, because a future reserved role that
 * applies to logged-in users would inherit the "_default" rules as usual.
 */
export function inheritsDefaultRules(roleName: string): boolean {
  return ![DEFAULT_SECTION_KEY, PUBLIC_SECTION_KEY].includes(roleName);
}

/**
 * The format of the JSON object which defines the rules for each role.
 * The format is `<user-role>: <array of DatabaseRule>`, meaning for each role an array of rules can be defined.
 * The rules defined in '_default' are prepended to any other rules defined for a user.
 * The rules defined in '_public' are used if a user is not logged in.
 */
export interface DatabaseRules {
  _public?: DatabaseRule[];
  _default?: DatabaseRule[];

  [key: string]: DatabaseRule[];
}
