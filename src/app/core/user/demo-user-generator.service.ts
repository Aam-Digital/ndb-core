import { DemoDataGenerator } from "../demo-data/demo-data-generator";
import { Injectable } from "@angular/core";
import { User } from "./user";
import { faker } from "../demo-data/faker";

/**
 * Generate demo users for the application with its DemoDataModule.
 */
@Injectable()
export class DemoUserGeneratorService extends DemoDataGenerator<User> {
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

  constructor() {
    super();
  }

  /**
   * Generate User entities to be loaded by the DemoDataModule.
   */
  public generateEntities(): User[] {
    const users = [];
    const demoUser = new User("demo");
    demoUser.name = "demo";
    demoUser.setNewPassword("pass");

    const demoAdmin = new User("demo-admin");
    demoAdmin.name = "demo-admin";
    demoAdmin.admin = true;
    demoAdmin.setNewPassword("pass");

    users.push(demoUser, demoAdmin);

    for (let i = 0; i < 10; ++i) {
      const user = new User(String(i));
      user.name = faker.name.firstName();
      users.push(user);
    }
    console.log(users);

    return users;
  }
}
