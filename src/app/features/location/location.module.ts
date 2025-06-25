import { NgModule, inject } from "@angular/core";
import { ComponentRegistry } from "../../dynamic-components";
import { locationComponents } from "./location-components";
import { DefaultDatatype } from "../../core/entity/default-datatype/default.datatype";
import { LocationDatatype } from "./location.datatype";

@NgModule({
  providers: [
    { provide: DefaultDatatype, useClass: LocationDatatype, multi: true },
  ],
})
export class LocationModule {
  constructor() {
    const components = inject(ComponentRegistry);

    components.addAll(locationComponents);
  }
}
