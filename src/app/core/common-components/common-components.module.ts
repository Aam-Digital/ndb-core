import { NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";
import { TemplateTooltipDirective } from "./template-tooltip/template-tooltip.directive";
import { TemplateTooltipComponent } from "./template-tooltip/template-tooltip.component";

@NgModule({
  declarations: [TemplateTooltipDirective, TemplateTooltipComponent],
  imports: [CommonModule],
  exports: [TemplateTooltipDirective],
})
export class CommonComponentsModule {}
