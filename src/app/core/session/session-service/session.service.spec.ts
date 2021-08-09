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
import { ConnectionState } from "../session-states/connection-state.enum";

export const TEST_USER = "test";
export const TEST_PASSWORD = "pass";
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
  sessionSetupFunction: () => Promise<SessionService>
) {
  let sessionService: SessionService;

  beforeEach(async () => {
    sessionService = await sessionSetupFunction();
  });

  it("has the correct initial state", () => {
    expect(sessionService.getSyncState().getState()).toBe(SyncState.UNSYNCED);
    expect(sessionService.getConnectionState().getState()).toBe(
      ConnectionState.DISCONNECTED
    );
    expectNotToBeLoggedIn(sessionService, LoginState.LOGGED_OUT);
  });

  it("succeeds login", async () => {
    const loginResult = await sessionService.login(TEST_USER, TEST_PASSWORD);

    expect(loginResult).toEqual(LoginState.LOGGED_IN);

    expect(sessionService.getLoginState().getState())
      .withContext("unexpected LoginState")
      .toEqual(LoginState.LOGGED_IN);

    expect(sessionService.isLoggedIn())
      .withContext("unexpected isLoggedIn")
      .toBeTrue();
    expect(sessionService.getCurrentDBUser().name).toBe(TEST_USER);
  });

  it("fails login with wrong password", async () => {
    const loginResult = await sessionService.login(TEST_USER, "");

    expect(loginResult).toEqual(LoginState.LOGIN_FAILED);
    expectNotToBeLoggedIn(sessionService, LoginState.LOGIN_FAILED);
  });

  it("fails login with wrong/non-existing username", async () => {
    const loginResult = await sessionService.login("other", TEST_PASSWORD);

    expect(loginResult).toEqual(LoginState.LOGIN_FAILED);
    expectNotToBeLoggedIn(sessionService, LoginState.LOGIN_FAILED);
  });

  it("logs out and resets states", async () => {
    const loginResult = await sessionService.login(TEST_USER, TEST_PASSWORD);
    expect(loginResult).toEqual(LoginState.LOGGED_IN);

    await sessionService.logout();
    expectNotToBeLoggedIn(sessionService, LoginState.LOGGED_OUT);
  });
}

/**
 * Check all states of the session to be "logged out".
 * @param session The SessionService whose state should be checked
 * @param expectedLoginState The expected LoginState (failed or simply logged out)
 */
function expectNotToBeLoggedIn(
  session: SessionService,
  expectedLoginState: LoginState.LOGGED_OUT | LoginState.LOGIN_FAILED
) {
  expect(session.getLoginState().getState())
    .withContext("unexpected LoginState")
    .toEqual(expectedLoginState);

  expect(session.isLoggedIn())
    .withContext("unexpected isLoggedIn")
    .toEqual(false);
  expect(session.getCurrentDBUser()).not.toBeDefined();
}
