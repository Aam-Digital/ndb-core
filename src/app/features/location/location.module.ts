import { NgModule, inject } from "@angular/core";
import { ComponentRegistry } from "../../dynamic-components";
import { locationComponents } from "./location-components";
import { DefaultDatatype } from "../../core/entity/default-datatype/default.datatype";
import { LocationDatatype } from "./location.datatype";
import { DEMO_VALUE_GENERATOR } from "../../core/demo-data/generic/demo-value-generator";
import { LocationDemoValueGenerator } from "./location-demo-value.generator";

@NgModule({
  providers: [
    { provide: DefaultDatatype, useClass: LocationDatatype, multi: true },
    {
      provide: DEMO_VALUE_GENERATOR,
      useClass: LocationDemoValueGenerator,
      multi: true,
    },
  ],
})
export class LocationModule {
  constructor() {
    const components = inject(ComponentRegistry);

    components.addAll(locationComponents);
  }
}
