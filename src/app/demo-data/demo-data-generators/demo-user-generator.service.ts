import {DemoDataGenerator} from '../demo-data-generator';
import {Injectable} from '@angular/core';
import {User} from '../../user/user';


/**
 * Generate demo users for the application. Currently, we only generate user 'demo' with password 'pass'
 */
@Injectable()
export class DemoUserGeneratorService extends DemoDataGenerator<User> {
  /**
   * This function returns a provider object to be used in an Angular Module configuration:
   *   `providers: [DemoUserGeneratorService.provider()]`
   */
  static provider() {
    return [
      { provide: DemoUserGeneratorService, useClass: DemoUserGeneratorService },
    ];
  }

  constructor() {
    super();
  }

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
