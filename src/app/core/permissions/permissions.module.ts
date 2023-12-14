import { NgModule } from "@angular/core";
import { UserRoleGuard } from "./permission-guard/user-role.guard";
import { PureAbility } from "@casl/ability";
import { EntityAbility } from "./ability/entity-ability";
import { AbilityService } from "./ability/ability.service";
import { EntityPermissionGuard } from "./permission-guard/entity-permission.guard";

@NgModule({
  providers: [
    UserRoleGuard,
    EntityPermissionGuard,
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
