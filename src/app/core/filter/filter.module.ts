import { NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";
import { FilterComponent } from "./filter/filter.component";
import { MatButtonToggleModule } from "@angular/material/button-toggle";
import { MatFormFieldModule } from "@angular/material/form-field";
import { MatSelectModule } from "@angular/material/select";

@NgModule({
  declarations: [FilterComponent],
  imports: [
    CommonModule,
    MatButtonToggleModule,
    MatFormFieldModule,
    MatSelectModule,
  ],
  exports: [FilterComponent],
})
export class FilterModule {}
