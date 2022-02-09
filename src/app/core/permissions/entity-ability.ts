import { Injectable } from "@angular/core";
import { EntityAction, EntityRule, EntitySubject } from "./permission-types";
import { Ability, subject } from "@casl/ability";
import { EntitySchemaService } from "../entity/schema/entity-schema.service";
import { Entity } from "../entity/model/entity";

@Injectable()
export class EntityAbility extends Ability<[EntityAction, EntitySubject]> {
  static with(rules: EntityRule[]): EntityAbility {
    const ability = new EntityAbility();
    ability.update(rules);
    return ability;
  }

  constructor(
    private entitySchemaService: EntitySchemaService = new EntitySchemaService()
  ) {
    super([]);
  }

  can(action: EntityAction, entity: EntitySubject, field?: string): boolean {
    console.log("called", action, entity);
    let transformedSubject = entity;
    if (entity instanceof Entity) {
      transformedSubject = subject(
        entity.getConstructor().ENTITY_TYPE,
        this.entitySchemaService.transformEntityToDatabaseFormat(entity)
      );
      console.log("transformed", transformedSubject);
    }
    console.log(
      "rule",
      this.relevantRuleFor(action, transformedSubject),
      this.rules
    );
    return super.can(action, transformedSubject, field);
  }
}
