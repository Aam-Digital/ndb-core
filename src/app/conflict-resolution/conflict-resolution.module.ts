import { NgModule } from "@angular/core";
import { ComponentRegistry } from "../dynamic-components";
import { conflictResolutionComponents } from "./conflict-resolution-components";

@NgModule({})
export class ConflictResolutionModule {
  constructor(components: ComponentRegistry) {
    components.addAll(conflictResolutionComponents);
  }
}
