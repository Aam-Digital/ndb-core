import { NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";
import { TooltipComponent } from "./tooltip/tooltip.component";
import { OverlayModule } from "@angular/cdk/overlay";

@NgModule({
  declarations: [TooltipComponent],
  imports: [CommonModule, OverlayModule],
  exports: [TooltipComponent],
  entryComponents: [TooltipComponent],
})
export class TooltipModule {}
