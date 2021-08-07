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

import { AppConfig } from "../../../app-config/app-config";
import { LocalSession } from "./local-session";
import { SessionType } from "../../session-type";
import { encryptPassword, LocalUser } from "./local-user";
import { LoginState } from "../../session-states/login-state.enum";

describe("LocalSessionService", () => {
  let localSession: LocalSession;
  let username = "demo";
  let password = "pass";
  let testUser: LocalUser;

  beforeEach(() => {
    AppConfig.settings = {
      site_name: "Aam Digital - DEV",
      session_type: SessionType.synced,
      database: {
        name: "integration_tests",
        remote_url: "https://demo.aam-digital.com/db/",
      },
    };
    localSession = new LocalSession();
  });

  beforeEach(() => {
    testUser = {
      name: username,
      roles: ["user_app"],
      encryptedPassword: encryptPassword(password),
    };
    localSession.saveUser(testUser);
  });

  it("should be created", () => {
    expect(localSession).toBeDefined();
  });

  it("should save user objects to local storage", () => {
    const storedUser = window.localStorage.getItem(testUser.name);
    expect(JSON.parse(storedUser)).toEqual(testUser);
  });

  it("should login a previously saved user with correct password", () => {
    expect(localSession.loginState.getState()).toBe(LoginState.LOGGED_OUT);

    localSession.login(username, password);

    expect(localSession.loginState.getState()).toBe(LoginState.LOGGED_IN);
  });

  it("should fail login with correct username but wrong password", () => {
    localSession.login(username, "wrong password");

    expect(localSession.loginState.getState()).toBe(LoginState.LOGIN_FAILED);
  });

  it("should fail login with correct wrong username", () => {
    localSession.login("wrong username", password);

    expect(localSession.loginState.getState()).toBe(LoginState.LOGIN_FAILED);
  });

  it("should assign current user after successful login", () => {
    localSession.login(username, password);

    const currentUser = localSession.getCurrentUser();

    expect(currentUser.name).toBe(username);
    expect(currentUser.roles).toEqual(testUser.roles);
  });
});
