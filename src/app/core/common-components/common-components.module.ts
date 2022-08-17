import { NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";
import { DialogCloseComponent } from "./dialog-close/dialog-close.component";
import { FontAwesomeModule } from "@fortawesome/angular-fontawesome";
import { MatButtonModule } from "@angular/material/button";
import { CustomizableTooltipDirective } from "./customizable-tooltip/customizable-tooltip.directive";
import { CustomizableTooltipComponent } from "./customizable-tooltip/customizable-tooltip.component";
import { BorderHighlightDirective } from "./border-highlight/border-highlight.directive";
import { AddNewButtonComponent } from "./add-new-button/add-new-button.component";
import { PillComponent } from "./pill/pill.component";

@NgModule({
  declarations: [
    DialogCloseComponent,
    CustomizableTooltipDirective,
    CustomizableTooltipComponent,
    BorderHighlightDirective,
    AddNewButtonComponent,
    PillComponent,
  ],
  imports: [CommonModule, FontAwesomeModule, MatButtonModule],
  exports: [
    DialogCloseComponent,
    CustomizableTooltipDirective,
    BorderHighlightDirective,
    AddNewButtonComponent,
    PillComponent,
  ],
})
export class CommonComponentsModule {}
