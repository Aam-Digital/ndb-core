import { NgModule } from "@angular/core";
import { ComponentRegistry } from "../../dynamic-components";

/**
 * Basic UI to make admin / technical debugging functions accessible.
 */
@NgModule({})
export class AdminModule {
  constructor(components: ComponentRegistry) {
    components.addAll([
      [
        "Admin",
        () => import("./admin/admin.component").then((c) => c.AdminComponent),
      ],
    ]);
  }
}
