import { DemoDataGenerator } from '../demo-data/demo-data-generator';
import { Injectable } from '@angular/core';
import { User } from './user';


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
    const demoUser = new User('demo');
    demoUser.name = 'demo';
    demoUser.setNewPassword('pass');

    const demoAdmin = new User('demo-admin');
    demoUser.name = 'demo-admin';
    demoAdmin.admin = true;
    demoAdmin.setNewPassword('pass');

    return [demoUser, demoAdmin];
  }

}
