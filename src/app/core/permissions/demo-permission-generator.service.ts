import { Injectable } from "@angular/core";
import { DemoDataGenerator } from "../demo-data/demo-data-generator";
import { Permission } from "./permission";
import { DatabaseRules } from "./permission-types";

@Injectable()
export class DemoPermissionGeneratorService extends DemoDataGenerator<Permission> {
  static provide() {
    return [
      {
        provide: DemoPermissionGeneratorService,
        useClass: DemoPermissionGeneratorService,
      },
    ];
  }

  protected generateEntities(): Permission[] {
    // This can be changed to experiment with different permission setups locally.
    // For the general demo mode everything is allowed
    const rules: DatabaseRules = {
      user_app: [{ subject: "all", action: "manage" }],
      admin_app: [{ subject: "all", action: "manage" }],
    };
    return [new Permission(rules)];
  }
}
