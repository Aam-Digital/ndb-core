import { NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";
import { EntityListComponent } from "./entity-list.component";
import { MatLegacyFormFieldModule as MatFormFieldModule } from "@angular/material/legacy-form-field";
import { MatLegacySelectModule as MatSelectModule } from "@angular/material/legacy-select";
import { Angulartics2Module } from "angulartics2";
import { MatLegacyButtonModule as MatButtonModule } from "@angular/material/legacy-button";
import { MatLegacyInputModule as MatInputModule } from "@angular/material/legacy-input";
import { MatLegacyCheckboxModule as MatCheckboxModule } from "@angular/material/legacy-checkbox";
import { MatExpansionModule } from "@angular/material/expansion";
import { MatButtonToggleModule } from "@angular/material/button-toggle";
import { MatLegacyTableModule as MatTableModule } from "@angular/material/legacy-table";
import { MatSortModule } from "@angular/material/sort";
import { MatLegacyPaginatorModule as MatPaginatorModule } from "@angular/material/legacy-paginator";
import { FormsModule } from "@angular/forms";
import { ExportModule } from "../../export/export.module";
import { ViewModule } from "../../view/view.module";
import { PermissionsModule } from "../../permissions/permissions.module";
import { EntitySubrecordModule } from "../entity-subrecord/entity-subrecord.module";
import { EntityUtilsModule } from "../entity-utils/entity-utils.module";
import { EntityFormModule } from "../entity-form/entity-form.module";
import { FontAwesomeModule } from "@fortawesome/angular-fontawesome";
import { MatLegacyMenuModule as MatMenuModule } from "@angular/material/legacy-menu";
import { MatLegacyTabsModule as MatTabsModule } from "@angular/material/legacy-tabs";
import { TabStateModule } from "../../../utils/tab-state/tab-state.module";
import { CommonComponentsModule } from "../../common-components/common-components.module";
import { FilterModule } from "../../filter/filter.module";

@NgModule({
  declarations: [EntityListComponent],
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
    TabStateModule,
    CommonComponentsModule,
    FilterModule,
  ],
  exports: [EntityListComponent],
})
export class EntityListModule {
  dynamicComponents = [EntityListComponent];
}
