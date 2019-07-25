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
import { LocalSession } from './local-session';
import { RemoteSession } from './remote-session';
import { EntitySchemaService } from 'app/entity/schema/entity-schema.service';

describe('SyncedSessionService', () => {
    const alertService = new AlertService(null, null);
    const entitySchemaService = new EntitySchemaService();
    let sessionService: SessionService;

    describe('Integration Tests', () => {
        let originalTimeout;

        beforeEach(function() {
            originalTimeout = jasmine.DEFAULT_TIMEOUT_INTERVAL;
            jasmine.DEFAULT_TIMEOUT_INTERVAL = 10000;
        });

        afterEach(function() {
            jasmine.DEFAULT_TIMEOUT_INTERVAL = originalTimeout;
        });

        beforeEach(() => {
            AppConfig.settings = {
                'site_name': 'Aam Digital - DEV',
                'database': {
                    'name': 'integration_tests',
                    'remote_url': 'https://demo.aam-digital.com/db/',
                    'timeout': 60000,
                    'outdated_threshold_days': 0,
                    'useTemporaryDatabase': false
                }
            };
            sessionService = new SyncedSessionService(alertService, entitySchemaService);
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

            // remote session takes a bit longer than a local login - this throws on successful connection
            await sessionService.getConnectionState().waitForChangeTo(ConnectionState.rejected, ConnectionState.connected);

            expect(sessionService.isLoggedIn()).toEqual(false);
            expect(sessionService.getCurrentUser()).not.toBeDefined();
        });

        it('has the correct state after Login with non-existing user', async () => {
            const loginState = await sessionService.login('demo123', 'pass123');
            expect(loginState).toEqual(LoginState.loginFailed);
            expect(sessionService.getLoginState().getState()).toEqual(LoginState.loginFailed);
            expect(sessionService.getSyncState().getState()).toEqual(SyncState.unsynced);

            // remote session takes a bit longer than a local login - this throws on successful connection
            await sessionService.getConnectionState().waitForChangeTo(ConnectionState.rejected, ConnectionState.connected);

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

    describe('Mocked Tests', () => {
        let localSession: LocalSession;
        let remoteSession: RemoteSession;

        beforeEach(() => {
            AppConfig.settings = {
                'site_name': 'Aam Digital - DEV',
                'database': {
                    'name': 'integration_tests',
                    'remote_url': 'https://demo.aam-digital.com/db/',
                    'timeout': 60000,
                    'outdated_threshold_days': 0,
                    'useTemporaryDatabase': false
                }
            };
            // setup synced session service
            sessionService = new SyncedSessionService(alertService, entitySchemaService);
            // make private members localSession and remoteSession available in the tests
            localSession = sessionService['_localSession'];
            remoteSession = sessionService['_remoteSession'];
        });

        it('behaves correctly when the local session rejects, but the remote session succeeds', (done) => {
            const localLogin = spyOn(localSession, 'login').and.returnValues(
                Promise.resolve(LoginState.loginFailed),
                Promise.resolve(LoginState.loggedIn)
            );
            const remoteLogin = spyOn(remoteSession, 'login').and.returnValue(Promise.resolve(ConnectionState.connected));
            const syncSpy = spyOn(sessionService, 'sync').and.returnValue(Promise.resolve());
            sessionService.login('u', 'p');
            setTimeout(() => { // wait for the next event cycle loop --> all Promise handlers are evaluated before this
                // login methods should have been called, the local one twice
                expect(localLogin.calls.allArgs()).toEqual([['u', 'p'], ['u', 'p']]);
                expect(remoteLogin.calls.allArgs()).toEqual([['u', 'p']]);
                // sync should have been triggered
                expect(syncSpy.calls.count()).toEqual(1);
                done();
            });
        });

        it('behaves correctly when the local session logs in, but the remote session rejects', (done) => {
            const localLogin = spyOn(localSession, 'login').and.returnValue(Promise.resolve(LoginState.loggedIn));
            const localLogout = spyOn(localSession, 'logout');
            const remoteLogin = spyOn(remoteSession, 'login').and.returnValue(Promise.resolve(ConnectionState.rejected));
            const syncSpy = spyOn(sessionService, 'sync').and.returnValue(Promise.resolve());
            sessionService.login('u', 'p');
            setTimeout(() => { // wait for the next event cycle loop --> all Promise handlers are evaluated before this
                // login methods should have been called
                expect(localLogin.calls.allArgs()).toEqual([['u', 'p']]);
                expect(remoteLogin.calls.allArgs()).toEqual([['u', 'p']]);
                // sync should not have been triggered
                expect(syncSpy.calls.count()).toEqual(0);
                // logout should have been called
                expect(localLogout.calls.count()).toEqual(1);
                done();
            });
        });
    });
});
