import { NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";
import { SupportComponent } from "./support/support.component";
import { MatLegacyButtonModule as MatButtonModule } from "@angular/material/legacy-button";
import { ConfirmationDialogModule } from "../confirmation-dialog/confirmation-dialog.module";
import { MatExpansionModule } from "@angular/material/expansion";

@NgModule({
  declarations: [SupportComponent],
  imports: [
    CommonModule,
    MatButtonModule,
    ConfirmationDialogModule,
    MatExpansionModule,
  ],
  exports: [SupportComponent],
})
export class SupportModule {}
