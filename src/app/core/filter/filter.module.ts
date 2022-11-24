import { NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";
import { FilterComponent } from "./filter/filter.component";
import { Angulartics2Module } from "angulartics2";
import { ListFilterComponent } from "./list-filter/list-filter.component";
import { MatFormFieldModule } from "@angular/material/form-field";
import { MatSelectModule } from "@angular/material/select";
import { CommonComponentsModule } from "../common-components/common-components.module";

@NgModule({
  declarations: [FilterComponent, ListFilterComponent],
  exports: [FilterComponent, ListFilterComponent, ListFilterComponent],
  imports: [
    CommonModule,
    Angulartics2Module,
    MatFormFieldModule,
    MatSelectModule,
    CommonComponentsModule,
  ],
})
export class FilterModule {}
