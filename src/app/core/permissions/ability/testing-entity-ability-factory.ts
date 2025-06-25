import { EntityAbility } from "./entity-ability";

export const entityAbilityFactory = () => {
  let ability = new EntityAbility();
  ability.update([{ subject: "all", action: "manage" }]);
  return ability;
};
