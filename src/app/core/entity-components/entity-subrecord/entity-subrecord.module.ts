import { NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";
import { EntitySubrecordComponent } from "./entity-subrecord/entity-subrecord.component";
import { KeysPipe } from "./keys-pipe/keys.pipe";
import { MatTableModule } from "@angular/material/table";
import { MatSortModule } from "@angular/material/sort";
import { MatPaginatorModule } from "@angular/material/paginator";
import { MatIconModule } from "@angular/material/icon";
import { EntityModule } from "../../entity/entity.module";
import { AlertsModule } from "../../alerts/alerts.module";
import { MatSnackBarModule } from "@angular/material/snack-bar";
import { MatButtonModule } from "@angular/material/button";
import { MatTooltipModule } from "@angular/material/tooltip";
import { ViewModule } from "../../view/view.module";
import { ReactiveFormsModule } from "@angular/forms";
import { ConfirmationDialogModule } from "../../confirmation-dialog/confirmation-dialog.module";

@NgModule({
  declarations: [EntitySubrecordComponent, KeysPipe],
  imports: [
    CommonModule,
    AlertsModule,
    MatSnackBarModule,
    EntityModule,
    MatTableModule,
    MatPaginatorModule,
    MatSortModule,
    ViewModule,
    ReactiveFormsModule,
    ConfirmationDialogModule,
    MatTooltipModule,
    MatButtonModule,
    MatIconModule,
  ],
  exports: [EntitySubrecordComponent, KeysPipe],
})
export class EntitySubrecordModule {}
