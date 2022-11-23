import { NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";
import { EntityListComponent } from "./entity-list.component";
import { MatFormFieldModule } from "@angular/material/form-field";
import { MatSelectModule } from "@angular/material/select";
import { Angulartics2Module } from "angulartics2";
import { MatButtonModule } from "@angular/material/button";
import { MatInputModule } from "@angular/material/input";
import { MatCheckboxModule } from "@angular/material/checkbox";
import { MatExpansionModule } from "@angular/material/expansion";
import { MatButtonToggleModule } from "@angular/material/button-toggle";
import { MatTableModule } from "@angular/material/table";
import { MatSortModule } from "@angular/material/sort";
import { MatPaginatorModule } from "@angular/material/paginator";
import { FormsModule } from "@angular/forms";
import { ExportModule } from "../../export/export.module";
import { ViewModule } from "../../view/view.module";
import { PermissionsModule } from "../../permissions/permissions.module";
import { EntitySubrecordModule } from "../entity-subrecord/entity-subrecord.module";
import { EntityUtilsModule } from "../entity-utils/entity-utils.module";
import { EntityFormModule } from "../entity-form/entity-form.module";
import { FontAwesomeModule } from "@fortawesome/angular-fontawesome";
import { MatMenuModule } from "@angular/material/menu";
import { MatTabsModule } from "@angular/material/tabs";
import { FilterOverlayComponent } from "./filter-overlay/filter-overlay.component";
import { MatDialogModule } from "@angular/material/dialog";
import { TabStateModule } from "../../../utils/tab-state/tab-state.module";
import { CommonComponentsModule } from "../../common-components/common-components.module";
import { FilterModule } from "../../filter/filter.module";

@NgModule({
  declarations: [EntityListComponent, FilterOverlayComponent],
  imports: [
    CommonModule,
    FormsModule,
    MatFormFieldModule,
    MatSelectModule,
    ExportModule,
    Angulartics2Module,
    MatButtonModule,
    MatInputModule,
    MatCheckboxModule,
    MatExpansionModule,
    MatButtonToggleModule,
    MatTableModule,
    ViewModule,
    MatSortModule,
    MatPaginatorModule,
    PermissionsModule,
    MatMenuModule,
    MatTabsModule,
    EntitySubrecordModule,
    EntityUtilsModule,
    EntityFormModule,
    FontAwesomeModule,
    MatDialogModule,
    TabStateModule,
    CommonComponentsModule,
    FilterModule,
  ],
  exports: [EntityListComponent],
})
export class EntityListModule {
  dynamicComponents = [EntityListComponent];
}
