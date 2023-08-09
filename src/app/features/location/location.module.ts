import { NgModule } from "@angular/core";
import { EntitySchemaService } from "../../core/entity/schema/entity-schema.service";
import { ComponentRegistry } from "../../dynamic-components";
import { locationComponents } from "./location-components";

@NgModule({})
export class LocationModule {
  constructor(
    schemaService: EntitySchemaService,
    components: ComponentRegistry,
  ) {
    //schemaService.registerSchemaDatatype(locationEntitySchemaDataType);
    components.addAll(locationComponents);
  }
}
