import { ModuleWithProviders, NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";
import { DisableEntityOperationDirective } from "./disable-entity-operation.directive";
import { DisabledWrapperComponent } from "./disabled-wrapper/disabled-wrapper.component";
import { MatTooltipModule } from "@angular/material/tooltip";
import { UserRoleGuard } from "./user-role.guard";
import { AbilityService, detectEntityType } from "./ability.service";
import { EntityAbility } from "./permission-types";
import { PureAbility } from "@casl/ability";

@NgModule({
  declarations: [DisableEntityOperationDirective, DisabledWrapperComponent],
  imports: [CommonModule, MatTooltipModule],
  exports: [DisableEntityOperationDirective],
  entryComponents: [DisabledWrapperComponent],
  providers: [UserRoleGuard, AbilityService],
})
export class PermissionsModule {
  static withAbility(): ModuleWithProviders<PermissionsModule> {
    return {
      ngModule: PermissionsModule,
      providers: [
        {
          provide: EntityAbility,
          useValue: new EntityAbility([], {
            detectSubjectType: detectEntityType,
          }),
        },
        {
          provide: PureAbility,
          useExisting: EntityAbility,
        },
      ],
    };
  }
}
