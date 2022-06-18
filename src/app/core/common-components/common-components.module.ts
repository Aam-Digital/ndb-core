import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DialogCloseComponent } from "./dialog-close/dialog-close.component";
import { FontAwesomeModule } from "@fortawesome/angular-fontawesome";
import { MatButtonModule } from "@angular/material/button";
import { MatDialogModule } from "@angular/material/dialog";
import { CustomizableTooltipDirective } from "./customizable-tooltip/customizable-tooltip.directive";
import { CustomizableTooltipComponent } from "./customizable-tooltip/customizable-tooltip.component";
import { BorderHighlightDirective } from "./border-highlight/border-highlight.directive";
import { AddNewButtonComponent } from './add-new-button/add-new-button.component';

@NgModule({
  declarations: [
    DialogCloseComponent,
    CustomizableTooltipDirective,
    CustomizableTooltipComponent,
    BorderHighlightDirective,
    AddNewButtonComponent,
  ],
  imports: [
    CommonModule,
    FontAwesomeModule,
    MatButtonModule,
    MatDialogModule,
  ],
  exports: [
    DialogCloseComponent,
    CustomizableTooltipDirective,
    BorderHighlightDirective,
    AddNewButtonComponent
  ]
})
export class CommonComponentsModule {}
