import { NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";
import { EntityListComponent } from "./entity-list.component";
import { DisplayTextComponent } from "./display-text/display-text.component";
import { DisplayDateComponent } from "./display-date/display-date.component";
import { DisplayCheckmarkComponent } from "./display-checkmark/display-checkmark.component";
import { MatFormFieldModule } from "@angular/material/form-field";
import { MatSelectModule } from "@angular/material/select";
import { MatIconModule } from "@angular/material/icon";
import { Angulartics2Module } from "angulartics2";
import { MatButtonModule } from "@angular/material/button";
import { ExtendedModule, FlexModule } from "@angular/flex-layout";
import { MatInputModule } from "@angular/material/input";
import { MatToolbarModule } from "@angular/material/toolbar";
import { MatCheckboxModule } from "@angular/material/checkbox";
import { MatExpansionModule } from "@angular/material/expansion";
import { MatButtonToggleModule } from "@angular/material/button-toggle";
import { MatTableModule } from "@angular/material/table";
import { MatSortModule } from "@angular/material/sort";
import { MatPaginatorModule } from "@angular/material/paginator";
import { FormsModule } from "@angular/forms";
import { AdminModule } from "../../admin/admin.module";
import { ViewModule } from "../../view/view.module";
import { DisplayConfigurableEnumComponent } from "./display-configurable-enum/display-configurable-enum.component";
import { ListFilterComponent } from "./list-filter/list-filter.component";
import { ListPaginatorComponent } from "./list-paginator/list-paginator.component";
import { PermissionsModule } from "../../permissions/permissions.module";
import { MatSliderModule } from "@angular/material/slider";
import { MatSlideToggleModule } from "@angular/material/slide-toggle";

@NgModule({
  declarations: [
    EntityListComponent,
    DisplayTextComponent,
    DisplayDateComponent,
    DisplayConfigurableEnumComponent,
    DisplayCheckmarkComponent,
    ListFilterComponent,
    ListPaginatorComponent,
  ],
  imports: [
    CommonModule,
    FormsModule,
    MatFormFieldModule,
    MatSelectModule,
    AdminModule,
    MatIconModule,
    Angulartics2Module,
    MatButtonModule,
    FlexModule,
    MatInputModule,
    MatCheckboxModule,
    MatExpansionModule,
    ExtendedModule,
    MatButtonToggleModule,
    MatTableModule,
    MatToolbarModule,
    ViewModule,
    MatSortModule,
    MatPaginatorModule,
    PermissionsModule,
    MatSliderModule,
    MatSlideToggleModule,
  ],
  exports: [EntityListComponent, ListPaginatorComponent],
})
export class EntityListModule {}
