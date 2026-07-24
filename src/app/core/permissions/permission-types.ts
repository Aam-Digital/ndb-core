import { Ability, RawRuleOf } from "@casl/ability";
import { Entity, EntityConstructor } from "../entity/model/entity";

/**
 * The list of action strings that can be used for permissions
 */
const actions = [
  "read",
  "create",
  "update",
  "delete",
  "manage", // Matches any actions
] as const;

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
 * cannot collide with a realm role name. Legacy (non-prefixed) spellings are
 * still read for backward compatibility until all documents are migrated.
 */
export const DEFAULT_SECTION_KEY = "_default";
export const PUBLIC_SECTION_KEY = "_public";
export const LEGACY_DEFAULT_KEY = "default";
export const LEGACY_PUBLIC_KEY = "public";

/** A user role starting with this prefix is reserved and never resolved. */
export const RESERVED_ROLE_PREFIX = "_";

/**
 * All section keys (current and legacy) that must never be resolved as if they
 * were user role names, even if a realm role with the same name exists.
 */
export const RESERVED_RULE_CONFIG_KEYS: string[] = [
  DEFAULT_SECTION_KEY,
  PUBLIC_SECTION_KEY,
  LEGACY_DEFAULT_KEY,
  LEGACY_PUBLIC_KEY,
];

/**
 * The format of the JSON object which defines the rules for each role.
 * The format is `<user-role>: <array of DatabaseRule>`, meaning for each role an array of rules can be defined.
 * The rules defined in '_default' (legacy 'default') are prepended to any other rules defined for a user.
 * The rules defined in '_public' (legacy 'public') are used if a user is not logged in.
 */
export interface DatabaseRules {
  _public?: DatabaseRule[];
  _default?: DatabaseRule[];
  public?: DatabaseRule[];
  default?: DatabaseRule[];

  [key: string]: DatabaseRule[];
}
