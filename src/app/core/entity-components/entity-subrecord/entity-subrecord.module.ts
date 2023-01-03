import { NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";
import { EntitySubrecordComponent } from "./entity-subrecord/entity-subrecord.component";
import { MatTableModule } from "@angular/material/table";
import { MatSortModule } from "@angular/material/sort";
import { MatPaginatorModule } from "@angular/material/paginator";
import { EntityModule } from "../../entity/entity.module";
import { MatSnackBarModule } from "@angular/material/snack-bar";
import { MatButtonModule } from "@angular/material/button";
import { MatTooltipModule } from "@angular/material/tooltip";
import { ViewModule } from "../../view/view.module";
import { ReactiveFormsModule } from "@angular/forms";
import { ListPaginatorComponent } from "./list-paginator/list-paginator.component";
import { MatSlideToggleModule } from "@angular/material/slide-toggle";
import { MatToolbarModule } from "@angular/material/toolbar";
import { Angulartics2Module } from "angulartics2";
import { FontAwesomeModule } from "@fortawesome/angular-fontawesome";
import { RowDetailsComponent } from "./row-details/row-details.component";
import { MatFormFieldModule } from "@angular/material/form-field";
import { MatDialogModule } from "@angular/material/dialog";
import { PermissionsModule } from "../../permissions/permissions.module";
import { MatRippleModule } from "@angular/material/core";
import { MatChipsModule } from "@angular/material/chips";
import { MatMenuModule } from "@angular/material/menu";
import { MatProgressBarModule } from "@angular/material/progress-bar";

@NgModule({
  declarations: [
    EntitySubrecordComponent,
    ListPaginatorComponent,
    RowDetailsComponent,
  ],
  imports: [
    CommonModule,
    MatSnackBarModule,
    EntityModule,
    MatTableModule,
    MatPaginatorModule,
    MatSortModule,
    ViewModule,
    ReactiveFormsModule,
    MatTooltipModule,
    MatButtonModule,
    MatSlideToggleModule,
    MatToolbarModule,
    FontAwesomeModule,
    Angulartics2Module,
    MatFormFieldModule,
    MatDialogModule,
    PermissionsModule,
    MatRippleModule,
    MatChipsModule,
    MatMenuModule,
    MatProgressBarModule,
  ],
  exports: [EntitySubrecordComponent],
})
export class EntitySubrecordModule {}
