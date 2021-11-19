import { Ability, AbilityClass, InferSubjects, RawRuleOf } from "@casl/ability";
import { Entity } from "../entity/model/entity";

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
export type EntitySubject = InferSubjects<typeof Entity> | "all";

/**
 * The type of the Ability service that ensures only valid actions and subjects can be used.
 */
export type EntityAbility = Ability<[EntityAction, EntitySubject]>;

/**
 * The type of a rule that can be passed to the `update` function of the Ability service.
 * The type only allows subjects and actions defined in `EntityAction` and `EntitySubject`.
 */
export type EntityRule = RawRuleOf<EntityAbility>;

/**
 * This const is required for correctly typed dependency injection.
 * See {@link https://casl.js.org/v5/en/package/casl-angular#type-script-support}
 */
export const EntityAbility = Ability as AbilityClass<EntityAbility>;

/**
 * The format that the JSON defined rules need to have.
 * In the JSON object the Entities can be specified by using their ENTITY_TYPE string representation.
 */
export type DatabaseRule = RawRuleOf<Ability<[EntityAction, string]>>;

/**
 * The format which the JSON document needs to have which defines the rules for each role.
 * The format is `<user-role>: <array of DatabaseRule>`, meaning for each role an array of rules can be defined.
 */
export type DatabaseRules = { [key in string]: DatabaseRule[] };
