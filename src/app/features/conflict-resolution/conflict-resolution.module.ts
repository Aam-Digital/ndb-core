import { NgModule, inject } from "@angular/core";
import { ComponentRegistry } from "../../dynamic-components";
import { conflictResolutionComponents } from "./conflict-resolution-components";

@NgModule({})
export class ConflictResolutionModule {
  constructor() {
    const components = inject(ComponentRegistry);

    components.addAll(conflictResolutionComponents);
  }
}
