import { Injectable } from "@angular/core";
import { EntityAction, EntitySubject } from "../permission-types";
import { Ability, subject } from "@casl/ability";
import { EntitySchemaService } from "../../entity/schema/entity-schema.service";
import { Entity } from "../../entity/model/entity";

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
export class EntityAbility extends Ability<[EntityAction, string | any]> {
  constructor(private entitySchemaService: EntitySchemaService) {
    super([]);
  }

  can(action: EntityAction, entity: EntitySubject, field?: string): boolean {
    return super.can(action, this.getSubject(entity), field);
  }

  cannot(action: EntityAction, entity: EntitySubject, field?: string): boolean {
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
        this.entitySchemaService.transformEntityToDatabaseFormat(entity)
      );
    } else if (entity.ENTITY_TYPE) {
      return entity.ENTITY_TYPE;
    } else {
      throw new Error(`${entity} is not a valid subject`);
    }
  }
}
