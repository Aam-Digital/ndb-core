import { NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";
import { AdminComponent } from "./admin/admin.component";
import { MatLegacyButtonModule as MatButtonModule } from "@angular/material/legacy-button";
import { MatLegacySnackBarModule as MatSnackBarModule } from "@angular/material/legacy-snack-bar";
import { BrowserModule } from "@angular/platform-browser";
import { AlertsModule } from "../alerts/alerts.module";
import { EntityModule } from "../entity/entity.module";
import { HttpClientModule } from "@angular/common/http";
import { ChildPhotoUpdateService } from "./services/child-photo-update.service";
import { MatLegacyCheckboxModule as MatCheckboxModule } from "@angular/material/legacy-checkbox";
import { MatLegacyTableModule as MatTableModule } from "@angular/material/legacy-table";
import { FormsModule, ReactiveFormsModule } from "@angular/forms";
import { MatLegacyDialogModule as MatDialogModule } from "@angular/material/legacy-dialog";
import { MatLegacyFormFieldModule as MatFormFieldModule } from "@angular/material/legacy-form-field";
import { MatLegacyInputModule as MatInputModule } from "@angular/material/legacy-input";
import { BackupService } from "./services/backup.service";
import { MatLegacyTooltipModule as MatTooltipModule } from "@angular/material/legacy-tooltip";
import { FontAwesomeModule } from "@fortawesome/angular-fontawesome";
import { DataImportModule } from "../../features/data-import/data-import.module";
import { RouterLink } from "@angular/router";

/**
 * GUI for administrative users to manage and maintain background and technical aspects of the app.
 */
@NgModule({
  imports: [
    CommonModule,
    BrowserModule,
    MatButtonModule,
    MatSnackBarModule,
    MatTableModule,
    MatCheckboxModule,
    AlertsModule,
    EntityModule,
    HttpClientModule,
    FormsModule,
    MatDialogModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatTooltipModule,
    FontAwesomeModule,
    DataImportModule,
    RouterLink,
  ],
  declarations: [AdminComponent],
  providers: [ChildPhotoUpdateService, BackupService],
})
export class AdminModule {
  static dynamicComponents = [AdminComponent];
}
