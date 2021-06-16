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
import { PermissionsModule } from "../../permissions/permissions.module";
import { MatMenuModule } from "@angular/material/menu";
import { MatTabsModule } from "@angular/material/tabs";

@NgModule({
  declarations: [
    EntityListComponent,
    DisplayTextComponent,
    DisplayDateComponent,
    DisplayConfigurableEnumComponent,
    DisplayCheckmarkComponent,
    ListFilterComponent,
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
    MatExpansionModule,
    ExtendedModule,
    MatButtonToggleModule,
    MatTableModule,
    ViewModule,
    MatSortModule,
    MatPaginatorModule,
    PermissionsModule,
    MatMenuModule,
    MatTabsModule,
  ],
  exports: [EntityListComponent],
})
export class EntityListModule {}
