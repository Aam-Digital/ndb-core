import { NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";
import { EntityOperationDirective } from "./entity-operation.directive";
import { TooltipModule } from "../tooltip/tooltip.module";

@NgModule({
  declarations: [EntityOperationDirective],
  imports: [CommonModule, TooltipModule],
  exports: [EntityOperationDirective],
})
export class PermissionsModule {}
