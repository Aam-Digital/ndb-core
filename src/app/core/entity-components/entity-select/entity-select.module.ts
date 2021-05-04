import { NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";
import { EntitySelectComponent } from "./entity-select/entity-select.component";
import { MatFormFieldModule } from "@angular/material/form-field";
import { MatChipsModule } from "@angular/material/chips";
import { MatIconModule } from "@angular/material/icon";
import { FormsModule, ReactiveFormsModule } from "@angular/forms";
import { MatAutocompleteModule } from "@angular/material/autocomplete";
import { MatInputModule } from "@angular/material/input";
import { MatTooltipModule } from "@angular/material/tooltip";
import { ViewModule } from "../../view/view.module";
import { ConfigurableEntitySelectComponent } from "./configurable-entity-select/configurable-entity-select.component";

@NgModule({
  declarations: [EntitySelectComponent, ConfigurableEntitySelectComponent],
  imports: [
    CommonModule,
    MatFormFieldModule,
    FormsModule,
    MatChipsModule,
    MatIconModule,
    ReactiveFormsModule,
    MatAutocompleteModule,
    MatInputModule,
    ReactiveFormsModule,
    MatTooltipModule,
    ViewModule,
  ],
  exports: [EntitySelectComponent, ConfigurableEntitySelectComponent],
})
export class EntitySelectModule {}
