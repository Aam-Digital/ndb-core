import { Injectable } from "@angular/core";
import { DemoDataGenerator } from "../demo-data/demo-data-generator";
import { DatabaseRules } from "./permission-types";
import { Config } from "../config/config";

@Injectable()
export class DemoPermissionGeneratorService extends DemoDataGenerator<
  Config<DatabaseRules>
> {
  static provider() {
    return [
      {
        provide: DemoPermissionGeneratorService,
        useClass: DemoPermissionGeneratorService,
      },
    ];
  }

  protected generateEntities(): Config<DatabaseRules>[] {
    // This can be changed to experiment with different permission setups locally.
    // For the general demo mode everything is allowed
    const rules: DatabaseRules = {
      user_app: [
        { subject: "Child", action: "read" },
        { subject: "Child", action: "manage", fields: ["name", "dateOfBirth"] },
      ],
      admin_app: [{ subject: "all", action: "manage" }],
    };
    return [new Config(Config.PERMISSION_KEY, rules)];
  }
}
