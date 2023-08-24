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

import { LoginState } from "../session-states/login-state.enum";
import { SessionService } from "./session.service";
import { SyncState } from "../session-states/sync-state.enum";
import { AuthUser } from "./auth-user";
import { TEST_PASSWORD, TEST_USER } from "../../../utils/mock-local-session";

/**
 * Default tests for testing basic functionality of any SessionService implementation.
 * The session has to be setup, so TEST_USER and TEST_PASSWORD are (the only) valid credentials
 *
 * @example
 describe("TestSessionService", async () => {
  testSessionServiceImplementation(async () => {
    return new TestSessionService();
  });
});
 *
 * @param sessionSetupFunction An async function creating a session instance to be tested
 */
export function testSessionServiceImplementation(
  sessionSetupFunction: () => Promise<SessionService>,
) {
  let sessionService: SessionService;

  beforeEach(async () => {
    sessionService = await sessionSetupFunction();
  });

  it("has the correct initial state", () => {
    expect(sessionService.syncState.value).toBe(SyncState.UNSYNCED);
    expectNotToBeLoggedIn(LoginState.LOGGED_OUT);
  });

  it("succeeds login", async () => {
    const loginResult = await sessionService.login(TEST_USER, TEST_PASSWORD);

    expect(loginResult).toEqual(LoginState.LOGGED_IN);

    expect(sessionService.loginState.value)
      .withContext("unexpected LoginState")
      .toEqual(LoginState.LOGGED_IN);

    expect(sessionService.isLoggedIn())
      .withContext("unexpected isLoggedIn")
      .toBeTrue();
    expect(sessionService.getCurrentUser().name).toBe(TEST_USER);
  });

  it("fails login with wrong password", async () => {
    const loginResult = await sessionService.login(TEST_USER, "");

    expect(loginResult).toEqual(LoginState.LOGIN_FAILED);
    expectNotToBeLoggedIn(LoginState.LOGIN_FAILED);
  });

  it("fails login with wrong/non-existing username", async () => {
    const loginResult = await sessionService.login("other", TEST_PASSWORD);

    // The LocalSession returns LoginState.UNAVAILABLE for unknown users because they might be available remote
    const failedStates = [LoginState.LOGIN_FAILED, LoginState.UNAVAILABLE];
    expect(failedStates).toContain(loginResult);
  });

  it("logs out and resets states", async () => {
    const loginResult = await sessionService.login(TEST_USER, TEST_PASSWORD);
    expect(loginResult).toEqual(LoginState.LOGGED_IN);

    await sessionService.logout();
    expectNotToBeLoggedIn(LoginState.LOGGED_OUT);
  });

  it("it correctly handles the necessary steps after a successful login", async () => {
    const dummyUser: AuthUser = {
      name: "Hanspeter",
      roles: ["user_app"],
    };
    await sessionService.handleSuccessfulLogin(dummyUser);
    expect(sessionService.loginState.value).toEqual(LoginState.LOGGED_IN);
    expect(sessionService.getCurrentUser()).toEqual(dummyUser);
  });

  /**
   * Check all states of the session to be "logged out".
   * @param expectedLoginState The expected LoginState (failed or simply logged out)
   */
  function expectNotToBeLoggedIn(
    expectedLoginState:
      | LoginState.LOGGED_OUT
      | LoginState.LOGIN_FAILED
      | LoginState.UNAVAILABLE,
  ) {
    expect(sessionService.loginState.value)
      .withContext("unexpected LoginState")
      .toEqual(expectedLoginState);

    expect(sessionService.isLoggedIn())
      .withContext("unexpected isLoggedIn")
      .toBeFalse();
    expect(sessionService.getCurrentUser()).toBeUndefined();
  }
}
