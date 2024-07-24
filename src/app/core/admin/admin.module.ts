import { NgModule } from "@angular/core";
import { ComponentRegistry } from "../../dynamic-components";
import { CommonModule } from "@angular/common";
import { ConflictResolutionModule } from "../../features/conflict-resolution/conflict-resolution.module";
import { ConfigSetupModule } from "../../features/config-setup/config-setup.module";
import { adminRoutes } from "./admin.routing";

/**
 * An intuitive UI for users to set up and configure the application's data structures and views
 * directly from within the app itself.
 *
 * This module provides its own routing and can be lazy-loaded as a whole module.
 */
@NgModule({
  imports: [CommonModule, ConflictResolutionModule, ConfigSetupModule],
})
export class AdminModule {
  static routes = adminRoutes;

  constructor(components: ComponentRegistry) {
    components.addAll([
      [
        "Admin",
        () => import("./admin/admin.component").then((c) => c.AdminComponent),
      ],
      [
        "AdminEntity",
        () =>
          import("./admin-entity/admin-entity.component").then(
            (c) => c.AdminEntityComponent,
          ),
      ],
      [
        "AdminEntityTypes",
        () =>
          import("./admin-entity-types/admin-entity-types.component").then(
            (c) => c.AdminEntityTypesComponent,
          ),
      ],
    ]);
  }
}
