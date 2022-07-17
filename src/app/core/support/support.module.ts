import { NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";
import { SupportComponent } from "./support/support.component";
import { MatButtonModule } from "@angular/material/button";
import { ConfirmationDialogModule } from "../confirmation-dialog/confirmation-dialog.module";
import { FlexModule } from "@angular/flex-layout";
import { MatExpansionModule } from "@angular/material/expansion";

@NgModule({
  declarations: [SupportComponent],
  imports: [
    CommonModule,
    MatButtonModule,
    ConfirmationDialogModule,
    FlexModule,
    MatExpansionModule,
  ],
  exports: [SupportComponent],
})
export class SupportModule {}
