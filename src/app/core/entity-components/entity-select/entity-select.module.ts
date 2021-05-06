import { NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";
import { EntitySelectComponent } from "./entity-select/entity-select.component";
import { MatFormFieldModule } from "@angular/material/form-field";
import { MatChipsModule } from "@angular/material/chips";
import { ReactiveFormsModule } from "@angular/forms";
import { MatAutocompleteModule } from "@angular/material/autocomplete";
import { MatInputModule } from "@angular/material/input";
import { MatTooltipModule } from "@angular/material/tooltip";

@NgModule({
  declarations: [EntitySelectComponent],
  imports: [
    CommonModule,
    MatFormFieldModule,
    MatChipsModule,
    ReactiveFormsModule,
    MatAutocompleteModule,
    MatInputModule,
    MatTooltipModule,
  ],
  exports: [EntitySelectComponent],
})
export class EntitySelectModule {}
