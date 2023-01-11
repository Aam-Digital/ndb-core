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
export type EntityAction = typeof actions[number];

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
export type DatabaseRule = RawRuleOf<Ability<[EntityAction, string]>>;

/**
 * The format of the JSON object which defines the rules for each role.
 * The format is `<user-role>: <array of DatabaseRule>`, meaning for each role an array of rules can be defined.
 * The rules defined in 'default' will be prepended to any other rules defined for a user
 */
export interface DatabaseRules {
  public?: DatabaseRule[];
  default?: DatabaseRule[];

  [key: string]: DatabaseRule[];
}
