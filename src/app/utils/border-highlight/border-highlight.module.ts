import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BorderHighlightDirective } from './border-highlight.directive';



@NgModule({
  declarations: [
    BorderHighlightDirective
  ],
  exports: [
    BorderHighlightDirective
  ],
  imports: [
    CommonModule
  ]
})
export class BorderHighlightModule { }
