import { NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";
import { CustomizableTooltipDirective } from "./customizable-tooltip/customizable-tooltip.directive";
import { CustomizableTooltipComponent } from "./customizable-tooltip/customizable-tooltip.component";

@NgModule({
  declarations: [CustomizableTooltipDirective, CustomizableTooltipComponent],
  imports: [CommonModule],
  exports: [CustomizableTooltipDirective],
})
export class CommonComponentsModule {}
