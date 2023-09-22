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

import { SessionManagerService } from "./session-manager.service";
import { LoginState } from "../session-states/login-state.enum";
import {
  LoginStateSubject,
  SessionType,
  SyncStateSubject,
} from "../session-type";
import { TestBed, waitForAsync } from "@angular/core/testing";
import { PouchDatabase } from "../../database/pouch-database";
import { environment } from "../../../../environments/environment";
import { AuthUser } from "../auth/auth-user";
import { TEST_USER } from "../../../utils/mock-local-session";
import { LocalAuthService } from "../auth/local/local-auth.service";
import { SyncService } from "../../database/sync.service";
import { KeycloakAuthService } from "../auth/keycloak/keycloak-auth.service";
import { LocalSession } from "./local-session";
import { Database } from "../../database/database";
import { Router } from "@angular/router";
import { UserSubject } from "../../user/user";

describe("SessionManagerService", () => {
  let service: SessionManagerService;
  let loginStateSubject: LoginStateSubject;
  let userSubject: UserSubject;
  let mockKeycloak: jasmine.SpyObj<KeycloakAuthService>;

  let dbUser: AuthUser;

  beforeEach(waitForAsync(() => {
    mockKeycloak = jasmine.createSpyObj(["autoLogin", "logout"]);
    mockKeycloak.autoLogin.and.rejectWith();

    TestBed.configureTestingModule({
      providers: [
        SessionManagerService,
        LocalSession,
        SyncStateSubject,
        LoginStateSubject,
        UserSubject,
        { provide: Database, useClass: PouchDatabase },
        { provide: KeycloakAuthService, useValue: mockKeycloak },
      ],
    });
    service = TestBed.inject(SessionManagerService);
    loginStateSubject = TestBed.inject(LoginStateSubject);
    userSubject = TestBed.inject(UserSubject);

    dbUser = { name: TEST_USER, roles: ["user_app"] };
    TestBed.inject(LocalAuthService).saveUser(dbUser);
    environment.session_type = SessionType.synced;
  }));

  afterEach(() => {
    localStorage.clear();
    environment.session_type = SessionType.mock;
  });

  it("should update the local user object once authenticated", async () => {
    const updatedUser: AuthUser = {
      name: TEST_USER,
      roles: dbUser.roles.concat("admin"),
    };
    mockKeycloak.autoLogin.and.resolveTo(updatedUser);
    const saveUserSpy = spyOn(TestBed.inject(LocalAuthService), "saveUser");
    const syncSpy = spyOn(TestBed.inject(SyncService), "startSync");

    await service.checkForValidSession();

    expect(saveUserSpy).toHaveBeenCalledWith(updatedUser);
    expect(userSubject.value).toEqual(updatedUser);
    expect(syncSpy).toHaveBeenCalled();
    expect(loginStateSubject.value).toBe(LoginState.LOGGED_IN);
  });

  it("should automatically login, if the session is still valid", async () => {
    mockKeycloak.autoLogin.and.resolveTo(dbUser);

    await service.checkForValidSession();

    expect(loginStateSubject.value).toEqual(LoginState.LOGGED_IN);
    expect(userSubject.value).toEqual(dbUser);
  });

  it("should trigger remote logout if remote login succeeded before", async () => {
    mockKeycloak.autoLogin.and.resolveTo(dbUser);
    await service.checkForValidSession();

    service.logout();

    expect(mockKeycloak.logout).toHaveBeenCalled();
  });

  it("should only reset local state if remote login did not happen", async () => {
    const navigateSpy = spyOn(TestBed.inject(Router), "navigate");
    await service.offlineLogin(dbUser);
    expect(loginStateSubject.value).toBe(LoginState.LOGGED_IN);
    expect(userSubject.value).toEqual(dbUser);

    service.logout();

    expect(mockKeycloak.logout).not.toHaveBeenCalled();
    expect(loginStateSubject.value).toBe(LoginState.LOGGED_OUT);
    expect(userSubject.value).toBeUndefined();
    expect(navigateSpy).toHaveBeenCalled();
  });
});
