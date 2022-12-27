import { NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";
import { TemplateTooltipDirective } from "./template-tooltip/template-tooltip.directive";
import { TemplateTooltipComponent } from "./template-tooltip/template-tooltip.component";
import { BorderHighlightDirective } from "./border-highlight/border-highlight.directive";
import { PillComponent } from "./pill/pill.component";
import { DialogCloseComponent } from "./dialog-close/dialog-close.component";
import { FontAwesomeModule } from "@fortawesome/angular-fontawesome";
import { MatLegacyButtonModule as MatButtonModule } from "@angular/material/legacy-button";

@NgModule({
  declarations: [
    TemplateTooltipDirective,
    TemplateTooltipComponent,
    BorderHighlightDirective,
    PillComponent,
    DialogCloseComponent,
  ],
  imports: [CommonModule, FontAwesomeModule, MatButtonModule],
  exports: [
    TemplateTooltipDirective,
    BorderHighlightDirective,
    PillComponent,
    DialogCloseComponent,
  ],
})
export class CommonComponentsModule {}
