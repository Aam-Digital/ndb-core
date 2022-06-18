import { NgModule } from '@angular/core';
import { CommonModule } from "@angular/common";
import { CustomizableTooltipDirective } from './customizable-tooltip.directive';
import { CustomizableTooltipComponent } from './customizable-tooltip.component';

@NgModule({
  declarations: [
    CustomizableTooltipDirective,
    CustomizableTooltipComponent
  ],
  exports: [
    CustomizableTooltipDirective
  ],
  imports: [
    CommonModule
  ]
})
export class CustomizableTooltipModule { }
