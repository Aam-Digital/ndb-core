import { NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";
import { EntityListComponent } from "./entity-list/entity-list.component";
import { MatTableModule } from "@angular/material/table";
import { MatExpansionModule } from "@angular/material/expansion";
import { MatFormFieldModule } from "@angular/material/form-field";
import { MatButtonModule } from "@angular/material/button";
import { MatIconModule } from "@angular/material/icon";
import { MatButtonToggleModule } from "@angular/material/button-toggle";
import { NoopAnimationsModule } from "@angular/platform-browser/animations";
import { MatSelectModule } from "@angular/material/select";
import { MatPaginatorModule } from "@angular/material/paginator";
import { RouterModule } from "@angular/router";
import { DisplayTextComponent } from "./display-text/display-text.component";
import { DisplayDateComponent } from "./display-date/display-date.component";
import { ViewModule } from "../view/view.module";
import { FormsModule } from "@angular/forms";
import { AdminModule } from "../admin/admin.module";
import { MatInputModule } from "@angular/material/input";
import { MatSortModule } from "@angular/material/sort";
import { FlexLayoutModule } from "@angular/flex-layout";
import { Angulartics2Module } from "angulartics2";
import { DisplayTickComponent } from "./display-tick/display-tick.component";
import { EntityDetailsComponent } from "./entity-details/entity-details.component";
import { EntitySubrecordComponent } from "./entity-subrecord/entity-subrecord.component";
import { KeysPipe } from "./keys-pipe/keys.pipe";
import { ConfirmationDialogModule } from "../confirmation-dialog/confirmation-dialog.module";
import { FormDialogModule } from "../form-dialog/form-dialog.module";

@NgModule({
  imports: [
    CommonModule,
    MatTableModule,
    MatExpansionModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatButtonToggleModule,
    NoopAnimationsModule,
    MatSelectModule,
    MatPaginatorModule,
    RouterModule,
    ViewModule,
    FormsModule,
    AdminModule,
    MatSortModule,
    FlexLayoutModule,
    Angulartics2Module,
    ConfirmationDialogModule,
    FormDialogModule,
  ],
  declarations: [
    EntityListComponent,
    DisplayTextComponent,
    DisplayDateComponent,
    DisplayTickComponent,
    EntityDetailsComponent,
    EntitySubrecordComponent,
    KeysPipe,
  ],
  exports: [EntityListComponent, EntitySubrecordComponent],
})
export class EntityComponentsModule {}
