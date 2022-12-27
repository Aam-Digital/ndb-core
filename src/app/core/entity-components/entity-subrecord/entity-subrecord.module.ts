import { NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";
import { EntitySubrecordComponent } from "./entity-subrecord/entity-subrecord.component";
import { MatLegacyTableModule as MatTableModule } from "@angular/material/legacy-table";
import { MatSortModule } from "@angular/material/sort";
import { MatLegacyPaginatorModule as MatPaginatorModule } from "@angular/material/legacy-paginator";
import { EntityModule } from "../../entity/entity.module";
import { AlertsModule } from "../../alerts/alerts.module";
import { MatLegacySnackBarModule as MatSnackBarModule } from "@angular/material/legacy-snack-bar";
import { MatLegacyButtonModule as MatButtonModule } from "@angular/material/legacy-button";
import { MatLegacyTooltipModule as MatTooltipModule } from "@angular/material/legacy-tooltip";
import { ViewModule } from "../../view/view.module";
import { ReactiveFormsModule } from "@angular/forms";
import { ConfirmationDialogModule } from "../../confirmation-dialog/confirmation-dialog.module";
import { EntityFormModule } from "../entity-form/entity-form.module";
import { ListPaginatorComponent } from "./list-paginator/list-paginator.component";
import { MatLegacySlideToggleModule as MatSlideToggleModule } from "@angular/material/legacy-slide-toggle";
import { MatToolbarModule } from "@angular/material/toolbar";
import { Angulartics2Module } from "angulartics2";
import { FontAwesomeModule } from "@fortawesome/angular-fontawesome";
import { RowDetailsComponent } from "./row-details/row-details.component";
import { MatLegacyFormFieldModule as MatFormFieldModule } from "@angular/material/legacy-form-field";
import { MatLegacyDialogModule as MatDialogModule } from "@angular/material/legacy-dialog";
import { PermissionsModule } from "../../permissions/permissions.module";
import { MatRippleModule } from "@angular/material/core";
import { MatLegacyChipsModule as MatChipsModule } from "@angular/material/legacy-chips";
import { MatLegacyMenuModule as MatMenuModule } from "@angular/material/legacy-menu";
import { MatLegacyProgressBarModule as MatProgressBarModule } from "@angular/material/legacy-progress-bar";
import { CommonComponentsModule } from "../../common-components/common-components.module";

@NgModule({
  declarations: [
    EntitySubrecordComponent,
    ListPaginatorComponent,
    RowDetailsComponent,
  ],
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
    MatSlideToggleModule,
    MatToolbarModule,
    EntityFormModule,
    FontAwesomeModule,
    Angulartics2Module,
    MatFormFieldModule,
    MatDialogModule,
    PermissionsModule,
    MatRippleModule,
    MatChipsModule,
    MatMenuModule,
    MatProgressBarModule,
    CommonComponentsModule,
  ],
  exports: [EntitySubrecordComponent],
})
export class EntitySubrecordModule {}
