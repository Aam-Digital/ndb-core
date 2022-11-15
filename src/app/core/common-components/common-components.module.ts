import { NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";
import { TemplateTooltipDirective } from "./template-tooltip/template-tooltip.directive";
import { TemplateTooltipComponent } from "./template-tooltip/template-tooltip.component";
import { BorderHighlightDirective } from "./border-highlight/border-highlight.directive";
import { PillComponent } from "./pill/pill.component";
import { DialogCloseComponent } from "./dialog-close/dialog-close.component";
import { AddNewButtonComponent } from "./add-new-button/add-new-button.component";
import { FontAwesomeModule } from "@fortawesome/angular-fontawesome";
import { MatButtonModule } from "@angular/material/button";

@NgModule({
  declarations: [
    TemplateTooltipDirective,
    TemplateTooltipComponent,
    BorderHighlightDirective,
    PillComponent,
    DialogCloseComponent,
    AddNewButtonComponent,
  ],
  imports: [CommonModule, FontAwesomeModule, MatButtonModule],
  exports: [
    TemplateTooltipDirective,
    BorderHighlightDirective,
    PillComponent,
    DialogCloseComponent,
    AddNewButtonComponent,
  ],
})
export class CommonComponentsModule {}
