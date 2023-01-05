import { NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";
import { FilterComponent } from "./filter/filter.component";
import { Angulartics2Module } from "angulartics2";
import { ListFilterComponent } from "./list-filter/list-filter.component";
import { MatFormFieldModule } from "@angular/material/form-field";
import { MatSelectModule } from "@angular/material/select";
import { CommonComponentsModule } from "../common-components/common-components.module";
import { FilterOverlayComponent } from "./filter-overlay/filter-overlay.component";
import { MatDialogModule } from "@angular/material/dialog";
import { DateRangeFilterComponent } from "./date-range-filter/date-range-filter.component";
import { DateRangeFilterPanelComponent } from "./date-range-filter/date-range-filter-panel/date-range-filter-panel.component";
import { FontAwesomeModule } from "@fortawesome/angular-fontawesome";
import { MatDatepickerModule } from "@angular/material/datepicker";
import { FormsModule } from "@angular/forms";
import { MatButtonModule } from "@angular/material/button";

@NgModule({
  declarations: [
    FilterComponent,
    ListFilterComponent,
    FilterOverlayComponent,
    DateRangeFilterComponent,
    DateRangeFilterPanelComponent,
  ],
  exports: [FilterComponent],
  imports: [
    CommonModule,
    Angulartics2Module,
    MatFormFieldModule,
    MatSelectModule,
    CommonComponentsModule,
    MatDialogModule,
    FontAwesomeModule,
    MatDatepickerModule,
    FormsModule,
    MatButtonModule,
  ],
})
export class FilterModule {}
