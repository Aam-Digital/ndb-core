import { NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";
import { EditButtonComponent } from "./edit-button/edit-button.component";
import { MatButtonModule } from "@angular/material/button";

@NgModule({
  declarations: [EditButtonComponent],
  imports: [CommonModule, MatButtonModule],
  exports: [EditButtonComponent],
})
export class AppButtonsModule {}
