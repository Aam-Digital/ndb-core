import { NgModule, inject } from "@angular/core";
import { UserRoleGuard } from "./permission-guard/user-role.guard";
import { Ability } from "@casl/ability";
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
      provide: Ability,
      useExisting: EntityAbility,
    },
  ],
})
export class PermissionsModule {
  constructor() {
    const abilityService = inject(AbilityService);

    abilityService.initializeRules();
  }
}
