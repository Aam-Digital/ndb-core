import { NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";
import { FilterComponent } from "./filter/filter.component";
import { Angulartics2Module } from "angulartics2";
import { ListFilterComponent } from "./list-filter/list-filter.component";
import { MatLegacyFormFieldModule as MatFormFieldModule } from "@angular/material/legacy-form-field";
import { MatLegacySelectModule as MatSelectModule } from "@angular/material/legacy-select";
import { CommonComponentsModule } from "../common-components/common-components.module";
import { FilterOverlayComponent } from "./filter-overlay/filter-overlay.component";
import { MatLegacyDialogModule as MatDialogModule } from "@angular/material/legacy-dialog";
import { MatLegacyButtonModule as MatButtonModule } from "@angular/material/legacy-button";

@NgModule({
  declarations: [FilterComponent, ListFilterComponent, FilterOverlayComponent],
  exports: [FilterComponent],
  imports: [
    CommonModule,
    Angulartics2Module,
    MatFormFieldModule,
    MatSelectModule,
    CommonComponentsModule,
    MatDialogModule,
    MatButtonModule,
  ],
})
export class FilterModule {}
