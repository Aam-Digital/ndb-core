import { NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";
import { DisableEntityOperationDirective } from "./disable-entity-operation.directive";
import { DisabledWrapperComponent } from "./disabled-wrapper/disabled-wrapper.component";
import { MatTooltipModule } from "@angular/material/tooltip";
import { UserRoleGuard } from "./user-role.guard";
import { AbilityService } from "./ability.service";
import { PureAbility } from "@casl/ability";
import { PermissionEnforcerService } from "./permission-enforcer.service";
import { EntityAbility } from "./entity-ability";

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
