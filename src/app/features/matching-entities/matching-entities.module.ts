import { NgModule } from "@angular/core";
import { ComponentRegistry } from "../../dynamic-components";
import { matchingEntitiesComponents } from "./matching-entities-components";

@NgModule({})
export class MatchingEntitiesModule {
  constructor(components: ComponentRegistry) {
    components.addAll(matchingEntitiesComponents);
  }
}
