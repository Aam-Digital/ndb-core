import { NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";
import { DisableEntityOperationDirective } from "./permission-directive/disable-entity-operation.directive";
import { DisabledWrapperComponent } from "./permission-directive/disabled-wrapper.component";
import { MatLegacyTooltipModule as MatTooltipModule } from "@angular/material/legacy-tooltip";
import { UserRoleGuard } from "./permission-guard/user-role.guard";
import { AbilityService } from "./ability/ability.service";
import { PureAbility } from "@casl/ability";
import { PermissionEnforcerService } from "./permission-enforcer/permission-enforcer.service";
import { EntityAbility } from "./ability/entity-ability";

@NgModule({
  declarations: [DisableEntityOperationDirective, DisabledWrapperComponent],
  imports: [CommonModule, MatTooltipModule],
  exports: [DisableEntityOperationDirective],
  providers: [
    UserRoleGuard,
    AbilityService,
    PermissionEnforcerService,
    EntityAbility,
    {
      provide: PureAbility,
      useExisting: EntityAbility,
    },
  ],
})
export class PermissionsModule {}
