import { Injectable, inject } from "@angular/core";
import { EntityActionPermission, EntitySubject } from "../permission-types";
import {
  Ability,
  buildMongoQueryMatcher,
  createMongoAbility,
  fieldPatternMatcher,
  MongoQuery,
  RawRuleFrom,
  subject,
  Subject,
} from "@casl/ability";
import { $and, $nor, $not, $or, and, nor, not, or } from "@ucast/mongo2js";
import { EntitySchemaService } from "../../entity/schema/entity-schema.service";
import { Entity } from "../../entity/model/entity";
import { Logging } from "../../logging/logging.service";

/** The action and subject types this ability checks permissions for. */
type EntityAbilityTuple = [EntityActionPermission, Subject];

/**
 * CASL's default matcher registers only field operators ($eq, $in, $elemMatch,
 * ...). Without the logical operators a rule like `{ $or: [...] }` is parsed as
 * a field literally named "$or" and therefore matches no document at all, so
 * permissions built with them would silently grant nothing.
 */
const conditionsMatcher = buildMongoQueryMatcher(
  { $or, $and, $nor, $not },
  { or, and, nor, not },
);

/**
 * Drop rules whose conditions the matcher cannot compile, e.g. `{ $or: [] }`,
 * which the raw JSON editor or a direct database edit can introduce. Such a
 * rule throws on every permission check for its subject - and because CASL
 * evaluates rules in order, one broken rule also takes down the valid rules
 * next to it.
 *
 * Validating by compiling with the very matcher that later evaluates the rule
 * keeps the two from drifting apart as the operator set changes.
 *
 * A granting rule is removed, which preserves the deny-by-default outcome such
 * a config already had while the logical operators were unregistered. An
 * inverted rule is kept without its conditions instead, since removing it
 * would lift a restriction.
 */
function withEvaluableConditions(
  rule: RawRuleFrom<EntityAbilityTuple, MongoQuery>,
): RawRuleFrom<EntityAbilityTuple, MongoQuery>[] {
  if (!rule.conditions) {
    return [rule];
  }

  try {
    conditionsMatcher(rule.conditions);
    return [rule];
  } catch (err) {
    Logging.warn("Ignoring permission rule with unusable conditions", {
      subject: rule.subject,
      action: rule.action,
      inverted: !!rule.inverted,
      error: err?.message,
    });

    const { conditions, ...unconditional } = rule;
    return rule.inverted ? [unconditional] : [];
  }
}

/**
 * An extension of the Ability class which can check permissions on Entities.
 * Inject this class in your component to check for permissions.
 *
 * e.g.
 * ```
 * export class ExampleComponent {
 *   constructor(private ability: EntityAbility) {
 *     this.ability.can("update", new Child());
 *   }
 * }
 * ```
 * Entities are transformed to the database format and permissions are evaluated based on the configuration found in the database.
 */
@Injectable()
export class EntityAbility extends Ability<EntityAbilityTuple, MongoQuery> {
  private entitySchemaService = inject(EntitySchemaService);

  /** Whether the ability rules have been initialized by AbilityService at least once. */
  initialized = false;

  constructor() {
    // `Ability` itself carries no matchers, so rule conditions and field
    // restrictions are silently inert unless both are passed in explicitly
    super([], {
      conditionsMatcher,
      fieldMatcher: fieldPatternMatcher,
    });
  }

  /**
   * Keep rules with unusable conditions from reaching the matcher,
   * see {@link withEvaluableConditions}.
   */
  override update(rules: RawRuleFrom<EntityAbilityTuple, MongoQuery>[]): this {
    return super.update((rules ?? []).flatMap(withEvaluableConditions));
  }

  override can(
    action: EntityActionPermission,
    entity: EntitySubject,
    field?: string,
    enforceConditions?: boolean,
  ): boolean {
    if (action === "create" && !enforceConditions) {
      const rules = this.rules.map((r) => {
        const simplifiedRule = { ...r };
        delete simplifiedRule.conditions;
        return simplifiedRule;
      });
      const abilityWithoutConditions =
        createMongoAbility<EntityAbilityTuple>(rules);
      return abilityWithoutConditions.can(
        action,
        this.getSubject(entity),
        field,
      );
    }
    return super.can(action, this.getSubject(entity), field);
  }

  override cannot(
    action: EntityActionPermission,
    entity: EntitySubject,
    field?: string,
  ): boolean {
    return super.cannot(action, this.getSubject(entity), field);
  }

  private getSubject(entity: EntitySubject): any {
    if (
      !entity ||
      typeof entity === "string" ||
      entity["__caslSubjectType__"]
    ) {
      // This happens in case the subject has already been processed
      return entity;
    } else if (entity instanceof Entity) {
      return subject(
        entity.getType(),
        this.entitySchemaService.transformEntityToDatabaseFormat(entity),
      );
    } else if (entity.ENTITY_TYPE) {
      return entity.ENTITY_TYPE;
    } else {
      throw new Error(`${JSON.stringify(entity)} is not a valid subject`);
    }
  }
}
