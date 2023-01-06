import { NgModule } from "@angular/core";
import { ComponentRegistry } from "../dynamic-components";
import { coreComponents } from "./core-components";

@NgModule({})
export class CoreModule {
  constructor(components: ComponentRegistry) {
    components.addAll(coreComponents);
  }
}
