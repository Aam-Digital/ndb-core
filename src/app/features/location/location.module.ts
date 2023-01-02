import { NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";
import { EntitySchemaService } from "../../core/entity/schema/entity-schema.service";
import { locationEntitySchemaDataType } from "./location-data-type";
import { MatFormFieldModule } from "@angular/material/form-field";
import { MatAutocompleteModule } from "@angular/material/autocomplete";
import { MatInputModule } from "@angular/material/input";
import { FormsModule, ReactiveFormsModule } from "@angular/forms";
import { FontAwesomeModule } from "@fortawesome/angular-fontawesome";
import { MatButtonModule } from "@angular/material/button";
import { MapComponent } from "./map/map.component";
import { MapPopupComponent } from "./map-popup/map-popup.component";
import { MatDialogModule } from "@angular/material/dialog";
import { EntityUtilsModule } from "../../core/entity-components/entity-utils/entity-utils.module";

@NgModule({
  declarations: [MapComponent, MapPopupComponent],
  imports: [
    CommonModule,
    MatFormFieldModule,
    MatAutocompleteModule,
    MatInputModule,
    ReactiveFormsModule,
    FormsModule,
    FontAwesomeModule,
    MatButtonModule,
    MatDialogModule,
    EntityUtilsModule,
  ],
  exports: [MapComponent],
})
export class LocationModule {
  constructor(schemaService: EntitySchemaService) {
    schemaService.registerSchemaDatatype(locationEntitySchemaDataType);
  }
}
