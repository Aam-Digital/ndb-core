import { NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";
import { ConfirmationDialogComponent } from "./confirmation-dialog/confirmation-dialog.component";
import { MatLegacyButtonModule as MatButtonModule } from "@angular/material/legacy-button";
import { MatLegacyDialogModule as MatDialogModule } from "@angular/material/legacy-dialog";
import { ConfirmationDialogService } from "./confirmation-dialog.service";
import { MatIconModule } from "@angular/material/icon";
import { MatRippleModule } from "@angular/material/core";
import { FontAwesomeModule } from "@fortawesome/angular-fontawesome";
import { CommonComponentsModule } from "../common-components/common-components.module";

/**
 * A helper utility module helping to display configurable confirmation dialog boxes
 * without having to create a custom template every time.
 *
 * Use the {@link ConfirmationDialogService} for this.
 */
@NgModule({
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatRippleModule,
    FontAwesomeModule,
    CommonComponentsModule,
  ],
  declarations: [ConfirmationDialogComponent],
  providers: [ConfirmationDialogService],
})
export class ConfirmationDialogModule {}
