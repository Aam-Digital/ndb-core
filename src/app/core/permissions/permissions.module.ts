import { NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";
import { DisableEntityOperationDirective } from "./permission-directive/disable-entity-operation.directive";
import { DisabledWrapperComponent } from "./permission-directive/disabled-wrapper.component";
import { MatTooltipModule } from "@angular/material/tooltip";
import { UserRoleGuard } from "./permission-guard/user-role.guard";
import { PureAbility } from "@casl/ability";
import { EntityAbility } from "./ability/entity-ability";
import { PermissionEnforcerService } from "./permission-enforcer/permission-enforcer.service";
import { AbilityService } from "./ability/ability.service";

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
