import { NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";
import { EntitySelectComponent } from "./entity-select/entity-select.component";
import { MatFormFieldModule } from "@angular/material/form-field";
import { MatChipsModule } from "@angular/material/chips";
import { ReactiveFormsModule } from "@angular/forms";
import { MatAutocompleteModule } from "@angular/material/autocomplete";
import { MatTooltipModule } from "@angular/material/tooltip";
import { ViewModule } from "../../view/view.module";
import { EntityBlockModule } from "../entity-block/entity-block.module";

@NgModule({
  declarations: [EntitySelectComponent],
  imports: [
    CommonModule,
    MatFormFieldModule,
    MatChipsModule,
    ReactiveFormsModule,
    MatAutocompleteModule,
    MatTooltipModule,
    ViewModule,
    EntityBlockModule,
  ],
  exports: [EntitySelectComponent],
})
export class EntitySelectModule {}
