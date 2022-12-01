import { NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";
import { EditLocationComponent } from "./edit-location/edit-location.component";
import { ViewLocationComponent } from "./view-location/view-location.component";
import { EntitySchemaService } from "../../core/entity/schema/entity-schema.service";
import { locationEntitySchemaDataType } from "./location-data-type";
import { MatFormFieldModule } from "@angular/material/form-field";
import { MatAutocompleteModule } from "@angular/material/autocomplete";
import { MatInputModule } from "@angular/material/input";
import { FormsModule, ReactiveFormsModule } from "@angular/forms";
import { FontAwesomeModule } from "@fortawesome/angular-fontawesome";

@NgModule({
  declarations: [EditLocationComponent, ViewLocationComponent],
  imports: [
    CommonModule,
    MatFormFieldModule,
    MatAutocompleteModule,
    MatInputModule,
    ReactiveFormsModule,
    FormsModule,
    FontAwesomeModule,
  ],
  exports: [EditLocationComponent],
})
export class LocationModule {
  dynamicComponents = [EditLocationComponent, ViewLocationComponent];

  constructor(schemaService: EntitySchemaService) {
    schemaService.registerSchemaDatatype(locationEntitySchemaDataType);
  }
}
