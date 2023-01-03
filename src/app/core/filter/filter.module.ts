import { NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";
import { FilterComponent } from "./filter/filter.component";
import { Angulartics2Module } from "angulartics2";
import { ListFilterComponent } from "./list-filter/list-filter.component";
import { MatFormFieldModule } from "@angular/material/form-field";
import { MatSelectModule } from "@angular/material/select";
import { FilterOverlayComponent } from "./filter-overlay/filter-overlay.component";
import { MatDialogModule } from "@angular/material/dialog";
import { MatButtonModule } from "@angular/material/button";

@NgModule({
  declarations: [FilterComponent, ListFilterComponent, FilterOverlayComponent],
  exports: [FilterComponent],
  imports: [
    CommonModule,
    Angulartics2Module,
    MatFormFieldModule,
    MatSelectModule,
    MatDialogModule,
    MatButtonModule,
  ],
})
export class FilterModule {}
