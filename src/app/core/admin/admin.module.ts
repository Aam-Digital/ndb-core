import { NgModule, inject } from "@angular/core";
import { ComponentRegistry } from "../../dynamic-components";
import { CommonModule } from "@angular/common";
import { ConflictResolutionModule } from "../../features/conflict-resolution/conflict-resolution.module";
import { adminRoutes } from "./admin.routing";

/**
 * An intuitive UI for users to set up and configure the application's data structures and views
 * directly from within the app itself.
 *
 * This module provides its own routing and can be lazy-loaded as a whole module.
 */
@NgModule({
  imports: [CommonModule, ConflictResolutionModule],
})
export class AdminModule {
  static routes = adminRoutes;

  constructor() {
    const components = inject(ComponentRegistry);

    components.addAll([
      [
        "AdminOverview",
        () =>
          import("./admin-overview/admin-overview.component").then(
            (c) => c.AdminOverviewComponent,
          ),
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
      [
        "AdminPrimaryAction",
        () =>
          import("./admin-primary-action/admin-primary-action.component").then(
            (c) => c.AdminPrimaryActionComponent,
          ),
      ],
    ]);
  }
}
