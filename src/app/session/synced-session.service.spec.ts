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
import { SyncedSessionService } from './synced-session.service';
import { AlertService } from 'app/alerts/alert.service';
import { LoginState } from './login-state.enum';
import { SyncState } from './sync-state.enum';
import { ConnectionState } from './connection-state.enum';
import { AppConfig } from 'app/app-config/app-config';

describe('SyncedSessionService', () => {
    const alertService = new AlertService(null, null);
    let sessionService: SessionService;

    describe("Integration Tests", () => {
        beforeEach(() => {
            AppConfig.settings = {
                'site_name': 'Aam Digital - DEV',
                'database': {
                    'name': 'dev',
                    'remote_url': 'https://demo.aam-digital.com/db/',
                    'timeout': 60000,
                    'outdated_threshold_days': 0,
                    'useTemporaryDatabase': false
                }
            };
            sessionService = new SyncedSessionService(alertService);
        });

        it('has the correct Initial State', () => {
            expect(sessionService.getLoginState().getState()).toEqual(LoginState.loggedOut);
            expect(sessionService.getSyncState().getState()).toEqual(SyncState.unsynced);
            expect(sessionService.getConnectionState().getState()).toEqual(ConnectionState.disconnected);

            expect(sessionService.isLoggedIn()).toEqual(false);
            expect(sessionService.getCurrentUser()).not.toBeDefined();
        });

        it('has the correct state after Login with wrong credentials', async () => {
            const loginState = await sessionService.login('demo', 'pass123');
            expect(loginState).toEqual(LoginState.loginFailed);
            expect(sessionService.getLoginState().getState()).toEqual(LoginState.loginFailed);
            expect(sessionService.getSyncState().getState()).toEqual(SyncState.unsynced);
            expect(sessionService.getConnectionState().getState()).toEqual(ConnectionState.rejected);

            expect(sessionService.isLoggedIn()).toEqual(false);
            expect(sessionService.getCurrentUser()).not.toBeDefined();
        });

        it('has the correct state after Login with non-existing user', async () => {
            const loginState = await sessionService.login('demo123', 'pass123');
            expect(loginState).toEqual(LoginState.loginFailed);
            expect(sessionService.getLoginState().getState()).toEqual(LoginState.loginFailed);
            expect(sessionService.getSyncState().getState()).toEqual(SyncState.unsynced);
            expect(sessionService.getConnectionState().getState()).toEqual(ConnectionState.rejected);

            expect(sessionService.isLoggedIn()).toEqual(false);
            expect(sessionService.getCurrentUser()).not.toBeDefined();
        });

        it('has the correct state after Login with correct credentials', async () => {
            const [loginState] = await Promise.all([
                sessionService.login('demo', 'pass'),
                sessionService.getSyncState().waitForChangeTo(SyncState.completed, SyncState.failed)
            ]);
            expect(loginState).toEqual(LoginState.loggedIn);
            expect(sessionService.getLoginState().getState()).toEqual(LoginState.loggedIn);
            expect(sessionService.getSyncState().getState()).toEqual(SyncState.completed);
            expect(sessionService.getConnectionState().getState()).toEqual(ConnectionState.connected);

            expect(sessionService.isLoggedIn()).toEqual(true);
            expect(sessionService.getCurrentUser()).toBeDefined();
        });

        it('has the correct state after Logout', () => {
            sessionService.logout();
            expect(sessionService.getLoginState().getState()).toEqual(LoginState.loggedOut);
            expect(sessionService.getConnectionState().getState()).toEqual(ConnectionState.disconnected);

            expect(sessionService.isLoggedIn()).toEqual(false);
            expect(sessionService.getCurrentUser()).not.toBeDefined();
        });
    });

    describe("Mocked Tests", () => {
        beforeEach(() => {
            // setup synced session service
            // replace login-methods of local and remote session with mocks that can resolve with custom values programmatically
            throw new Error("TODO(lh)");
        });

        it('behaves correctly when the local session rejects, but the remote session succeeds', async () => {
            // localSession should change loginState to loginFailed
            // remoteSession should change connectionState to connected
            // syncState should change to completed
            // loginState should change to loggedIn (this is not implemented yet!)
            throw new Error("TODO(lh)");
        });

        it('behaves correctly when the local session logs in, but the remote session rejects', async () => {
            // localSession should change loginState to loggedIn
            // remoteSession should change connectionState to rejected
            // loginState should change to loginFailed
            throw new Error("TODO(lh)");
        });
    });
});
