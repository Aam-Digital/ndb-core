import { NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";
import { EditLocationComponent } from "./edit-location/edit-location.component";
import { ViewLocationComponent } from "./view-location/view-location.component";
import { EntitySchemaService } from "../../core/entity/schema/entity-schema.service";
import { locationEntitySchemaDataType } from "./location-data-type";
import { MatLegacyFormFieldModule as MatFormFieldModule } from "@angular/material/legacy-form-field";
import { MatLegacyAutocompleteModule as MatAutocompleteModule } from "@angular/material/legacy-autocomplete";
import { MatLegacyInputModule as MatInputModule } from "@angular/material/legacy-input";
import { FormsModule, ReactiveFormsModule } from "@angular/forms";
import { FontAwesomeModule } from "@fortawesome/angular-fontawesome";
import { MatLegacyButtonModule as MatButtonModule } from "@angular/material/legacy-button";
import { MapComponent } from "./map/map.component";
import { MapPopupComponent } from "./map-popup/map-popup.component";
import { MatLegacyDialogModule as MatDialogModule } from "@angular/material/legacy-dialog";
import { ViewDistanceComponent } from "./view-distance/view-distance.component";
import { EntityUtilsModule } from "../../core/entity-components/entity-utils/entity-utils.module";

@NgModule({
  declarations: [
    EditLocationComponent,
    ViewLocationComponent,
    MapComponent,
    MapPopupComponent,
    ViewDistanceComponent,
  ],
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
  exports: [EditLocationComponent, MapComponent],
})
export class LocationModule {
  dynamicComponents = [
    EditLocationComponent,
    ViewLocationComponent,
    ViewDistanceComponent,
  ];

  constructor(schemaService: EntitySchemaService) {
    schemaService.registerSchemaDatatype(locationEntitySchemaDataType);
  }
}
