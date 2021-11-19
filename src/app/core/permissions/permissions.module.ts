import { NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";
import { DisableEntityOperationDirective } from "./disable-entity-operation.directive";
import { DisabledWrapperComponent } from "./disabled-wrapper/disabled-wrapper.component";
import { MatTooltipModule } from "@angular/material/tooltip";
import { UserRoleGuard } from "./user-role.guard";
import { AbilityService, detectEntityType } from "./ability.service";
import { EntityAbility } from "./permission-types";

@NgModule({
  declarations: [DisableEntityOperationDirective, DisabledWrapperComponent],
  imports: [CommonModule, MatTooltipModule],
  exports: [DisableEntityOperationDirective],
  entryComponents: [DisabledWrapperComponent],
  providers: [
    UserRoleGuard,
    AbilityService,
    {
      provide: EntityAbility,
      useValue: new EntityAbility([], { detectSubjectType: detectEntityType }),
    },
  ],
})
export class PermissionsModule {
  //  TODO use LoginState change to init rules
}
