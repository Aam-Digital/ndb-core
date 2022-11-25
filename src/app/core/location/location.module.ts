import { NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";
import { EditLocationComponent } from "./edit-location/edit-location.component";
import { ViewLocationComponent } from "./view-location/view-location.component";
import { EntitySchemaService } from "../entity/schema/entity-schema.service";
import { locationEntitySchemaDataType } from "./location-data-type";

@NgModule({
  declarations: [EditLocationComponent, ViewLocationComponent],
  imports: [CommonModule],
})
export class LocationModule {
  dynamicComponents = [EditLocationComponent, ViewLocationComponent];

  constructor(schemaService: EntitySchemaService) {
    schemaService.registerSchemaDatatype(locationEntitySchemaDataType);
  }
}
