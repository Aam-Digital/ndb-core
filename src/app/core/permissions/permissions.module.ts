import { Injector, NgModule, inject } from "@angular/core";
import { UserRoleGuard } from "./permission-guard/user-role.guard";
import { PureAbility } from "@casl/ability";
import { EntityAbility } from "./ability/entity-ability";
import { AbilityService } from "./ability/ability.service";
import { EntityPermissionGuard } from "./permission-guard/entity-permission.guard";
import { PermissionEnforcerService } from "./permission-enforcer/permission-enforcer.service";
import { LocalPermissionEnforcerService } from "./permission-enforcer/local-permission-enforcer.service";
import { NoopPermissionEnforcerService } from "./permission-enforcer/noop-permission-enforcer.service";
import { SessionType } from "../session/session-type";
import { environment } from "../../../environments/environment";
import { serviceProvider } from "../../utils/utils";

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
    LocalPermissionEnforcerService,
    NoopPermissionEnforcerService,
    serviceProvider(PermissionEnforcerService, (injector: Injector) =>
      environment.session_type === SessionType.online
        ? // No local data to purge
          injector.get(NoopPermissionEnforcerService)
        : injector.get(LocalPermissionEnforcerService),
    ),
  ],
})
export class PermissionsModule {
  constructor() {
    const abilityService = inject(AbilityService);

    abilityService.initializeRules();
  }
}
