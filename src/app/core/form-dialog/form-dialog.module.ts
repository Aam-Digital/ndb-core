import { NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";
import { MatLegacyButtonModule as MatButtonModule } from "@angular/material/legacy-button";
import { MatLegacyDialogModule as MatDialogModule } from "@angular/material/legacy-dialog";
import { FormDialogService } from "./form-dialog.service";
import { FormDialogWrapperComponent } from "./form-dialog-wrapper/form-dialog-wrapper.component";
import { FormsModule } from "@angular/forms";
import { ConfirmationDialogModule } from "../confirmation-dialog/confirmation-dialog.module";
import { Angulartics2Module } from "angulartics2";
import { PermissionsModule } from "../permissions/permissions.module";
import { AbilityModule } from "@casl/angular";

/**
 * A helper utility module to consistently and easily display forms
 *
 * Use the {@link FormDialogService} to display forms as a dialog hovering over the other UI.
 *
 * Use the {@link FormDialogWrapperComponent} to get generic logic and UI for saving/cancelling forms.
 */
@NgModule({
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    FormsModule,
    ConfirmationDialogModule,
    Angulartics2Module,
    PermissionsModule,
    AbilityModule,
  ],
  declarations: [FormDialogWrapperComponent],
  providers: [FormDialogService],
  exports: [FormDialogWrapperComponent],
})
export class FormDialogModule {}
