import { NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";
import { DisableEntityOperationDirective } from "./disable-entity-operation.directive";
import { DisabledWrapperComponent } from "./disabled-wrapper/disabled-wrapper.component";
import { MatTooltipModule } from "@angular/material/tooltip";
import { UserRoleGuard } from "./user-role.guard";
import { AbilityService } from "./ability.service";

@NgModule({
  declarations: [DisableEntityOperationDirective, DisabledWrapperComponent],
  imports: [CommonModule, MatTooltipModule],
  exports: [DisableEntityOperationDirective],
  entryComponents: [DisabledWrapperComponent],
  providers: [UserRoleGuard, AbilityService],
})
export class PermissionsModule {}
