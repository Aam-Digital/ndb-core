import { NgModule } from "@angular/core";
import { ComponentRegistry } from "../../dynamic-components";
import { locationComponents } from "./location-components";
import { DefaultDatatype } from "../../core/entity/schema/datatype-default";
import { LocationDatatype } from "./location.datatype";

@NgModule({
  providers: [
    { provide: DefaultDatatype, useClass: LocationDatatype, multi: true },
  ],
})
export class LocationModule {
  constructor(components: ComponentRegistry) {
    components.addAll(locationComponents);
  }
}
