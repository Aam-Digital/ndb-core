import { EntitySchemaService } from "../../entity/schema/entity-schema.service";
import { EntityAbility } from "./entity-ability";

export const entityAbilityFactory = (
  entitySchemaService: EntitySchemaService,
) => {
  let ability = new EntityAbility(entitySchemaService);
  ability.update([{ subject: "all", action: "manage" }]);
  return ability;
};
