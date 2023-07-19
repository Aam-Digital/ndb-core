import { NgModule } from "@angular/core";
import { UserRoleGuard } from "./permission-guard/user-role.guard";
import { PureAbility } from "@casl/ability";
import { EntityAbility } from "./ability/entity-ability";
import { AbilityService } from "./ability/ability.service";

@NgModule({
  providers: [
    UserRoleGuard,
    AbilityService,
    EntityAbility,
    {
      provide: PureAbility,
      useExisting: EntityAbility,
    },
  ],
})
export class PermissionsModule {
  constructor(abilityService: AbilityService) {
    abilityService.initializeRules();
  }
}
