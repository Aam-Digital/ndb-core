/*
 *     This file is part of ndb-core.
 *
 *     ndb-core is free software: you can redistribute it and/or modify
 *     it under the terms of the GNU General Public License as published by
 *     the Free Software Foundation, either version 3 of the License, or
 *     (at your option) any later version.
 *
 *     ndb-core is distributed in the hope that it will be useful,
 *     but WITHOUT ANY WARRANTY; without even the implied warranty of
 *     MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 *     GNU General Public License for more details.
 *
 *     You should have received a copy of the GNU General Public License
 *     along with ndb-core.  If not, see <http://www.gnu.org/licenses/>.
 */

import { SessionService } from './session.service';
import { User } from '../user/user';

describe('SessionService', () => {

  let sessionService: SessionService;
  let databaseManager: any;
  let entityMapper: any;
  let alertService: any;

  const username = 'testuser';
  const password = 'testpass';
  let user: User;

  beforeEach(() => {
    databaseManager = {
      loggedIn: false,
      login: function (loginName: string, loginPassword: string): Promise<boolean> {
        if (loginName === username && user.checkPassword(loginPassword)) {
          this.loggedIn = true;
          return Promise.resolve(true);
        } else {
          return Promise.resolve(false);
        }
      },

      logout: function () {
      }
    };
    spyOn(databaseManager, 'login').and.callThrough();

    user = new User(username);
    user.name = username;
    user.setNewPassword(password);

    entityMapper = {
      load: function (entityType: new(id: string) => User, id: string): Promise<User> {
        const resultEntity = new entityType('');

        if (id !== user.getId()) {
          return Promise.reject<User>('ID not found');
        } else {
          Object.assign(resultEntity, user);
          return Promise.resolve<User>(resultEntity);
        }
      }
    };

    alertService = jasmine.createSpyObj('alertService', ['addInfo', 'addSuccess', 'addWarning', 'addDanger']);
    sessionService = new SessionService(databaseManager, entityMapper, alertService);
  });


  it('is logged in after correct local login', function (done) {
    expect(sessionService.isLoggedIn()).toBeFalsy();

    sessionService.login(username, password).then(
      function (result) {
        expect(result).toBeTruthy();
        expect(sessionService.isLoggedIn()).toBeTruthy();
        done();
      }
    );
  });

  it('is logged in on remote database after correct login', function (done) {
    expect(sessionService.isLoggedIn()).toBeFalsy();
    expect(databaseManager.loggedIn).toBeFalsy();

    sessionService.login(username, password).then(
      function (result) {
        expect(result).toBeTruthy();
        expect(databaseManager.loggedIn).toBeTruthy();
        done();
      }
    );
  });

  it('is not logged in after failed local login on existing user', function (done) {
    expect(sessionService.isLoggedIn()).toBeFalsy();

    sessionService.login(username, password + 'x').then(
      function (result) {
        expect(result).toBeFalsy();
        expect(sessionService.isLoggedIn()).toBeFalsy();
        done();
      }
    );
  });


  it('is not logged in even when remote login succeeds', function (done) {
    expect(sessionService.isLoggedIn()).toBeFalsy();

    // setup: override entityMapper behavior to only return user after remote login
    spyOn(entityMapper, 'load').and.callFake(
      function (requestedUser: User) {
        if (databaseManager.loggedIn) {
          // simulate synced database
          Object.assign(requestedUser, user);
          return Promise.resolve<User>(requestedUser);
        } else {
          return Promise.reject<User>('not found');
        }
      }
    );

    entityMapper.load(user).catch(
      // expect entityMapper to NOT load user
      function () {
        sessionService.login(username, password).then(
          function (result) {
            expect(result).toBeFalsy();
            expect(databaseManager.loggedIn).toBeTruthy();
            expect(sessionService.isLoggedIn()).toBeFalsy();
            done();
          }
        );
      }
    );
  });

  it('is not logged in after logout', function (done) {
    sessionService.login(username, password).then(
      function () {
        expect(sessionService.isLoggedIn()).toBeTruthy();
        sessionService.logout();
        expect(sessionService.isLoggedIn()).toBeFalsy();
        done();
      }
    );
  });

  it('can logout when not logged in', function () {
    expect(sessionService.isLoggedIn()).toBeFalsy();
    sessionService.logout();
    expect(sessionService.isLoggedIn()).toBeFalsy();
  });

  it('getCurrentUser returns user object after correct local login', function (done) {
    expect(sessionService.isLoggedIn()).toBeFalsy();

    sessionService.login(username, password).then(
      function (result) {
        expect(result).toBeTruthy();
        expect(sessionService.getCurrentUser().getId()).toBe(user.getId());
        done();
      }
    );
  });

  it('getCurrentUser returns null after failed local login', function (done) {
    expect(sessionService.isLoggedIn()).toBeFalsy();

    sessionService.login(username, password + 'x').then(
      function (result) {
        expect(result).toBeFalsy();
        expect(sessionService.getCurrentUser()).toBeNull();
        done();
      }
    );
  });
});
