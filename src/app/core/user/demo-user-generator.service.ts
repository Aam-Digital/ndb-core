import { DemoDataGenerator } from "../demo-data/demo-data-generator";
import { Injectable } from "@angular/core";
import { User } from "./user";
import { faker } from "../demo-data/faker";

export const TEST_USER = "demo";

/**
 * Generate demo users for the application with its DemoDataModule.
 */
@Injectable()
export class DemoUserGeneratorService extends DemoDataGenerator<User> {
  /** the username of the basic account generated by this demo service */
  static DEFAULT_USERNAME = TEST_USER;
  static ADMIN_USERNAME = "demo-admin";

  /**
   * This function returns a provider object to be used in an Angular Module configuration
   *
   * @return `providers: [DemoUserGeneratorService.provider()]`
   */
  static provider() {
    return [
      { provide: DemoUserGeneratorService, useClass: DemoUserGeneratorService },
    ];
  }

  /**
   * Generate User entities to be loaded by the DemoDataModule.
   */
  public generateEntities(): User[] {
    const users = [];
    const demoUser = new User(DemoUserGeneratorService.DEFAULT_USERNAME);
    demoUser.name = DemoUserGeneratorService.DEFAULT_USERNAME;

    const demoAdmin = new User(DemoUserGeneratorService.ADMIN_USERNAME);
    demoAdmin.name = DemoUserGeneratorService.ADMIN_USERNAME;

    users.push(demoUser, demoAdmin);

    const userNames = new Set<string>();
    while (userNames.size < 10) {
      userNames.add(faker.person.firstName());
    }
    for (const name of userNames) {
      const user = new User(name);
      user.name = name;
      user["phone"] = faker.phone.number();
      users.push(user);
    }

    return users;
  }
}
