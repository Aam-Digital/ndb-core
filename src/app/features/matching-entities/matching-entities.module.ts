import { NgModule, inject } from "@angular/core";
import { ComponentRegistry } from "../../dynamic-components";
import { matchingEntitiesComponents } from "./matching-entities-components";

@NgModule({})
export class MatchingEntitiesModule {
  constructor() {
    const components = inject(ComponentRegistry);

    components.addAll(matchingEntitiesComponents);
  }
}
