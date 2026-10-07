import { NgModule, inject } from "@angular/core";
import { ComponentRegistry } from "../../dynamic-components";
import { matchingEntitiesComponents } from "./matching-entities-components";
import { DefaultConfigMigrationRegistryService } from "#src/app/core/config/default-config-migration-registry.service";
import { addDefaultMatchingView } from "./add-default-matching-view";

@NgModule({})
export class MatchingEntitiesModule {
  constructor() {
    const components = inject(ComponentRegistry);

    components.addAll(matchingEntitiesComponents);

    inject(DefaultConfigMigrationRegistryService).register(
      addDefaultMatchingView,
    );
  }
}
