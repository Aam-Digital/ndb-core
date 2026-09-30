import { Injectable, inject } from "@angular/core";
import { EntityActionPermission, EntitySubject } from "../permission-types";
import {
  Ability,
  buildMongoQueryMatcher,
  createMongoAbility,
  fieldPatternMatcher,
  MongoQuery,
  subject,
  Subject,
} from "@casl/ability";
import { $and, $nor, $not, $or, and, nor, not, or } from "@ucast/mongo2js";
import { EntitySchemaService } from "../../entity/schema/entity-schema.service";
import { Entity } from "../../entity/model/entity";

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
