import { NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";
import { EntityOperationDirective } from "./entity-operation.directive";
import { DisabledWrapperComponent } from "./disabled-wrapper/disabled-wrapper.component";
import { MatTooltipModule } from "@angular/material/tooltip";

@NgModule({
  declarations: [EntityOperationDirective, DisabledWrapperComponent],
  imports: [CommonModule, MatTooltipModule],
  exports: [EntityOperationDirective, DisabledWrapperComponent],
  entryComponents: [DisabledWrapperComponent],
})
export class PermissionsModule {}
