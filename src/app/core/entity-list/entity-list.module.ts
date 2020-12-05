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
  ],
  declarations: [
    EntityListComponent,
    DisplayTextComponent,
    DisplayDateComponent,
    DisplayTickComponent,
    EntityDetailsComponent,
  ],
  exports: [EntityListComponent],
})
export class EntityListModule {}
