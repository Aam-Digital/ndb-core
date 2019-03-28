import { SessionService } from './session.service';
import { SyncedSessionService } from './synced-session.service';
import { AlertService } from 'app/alerts/alert.service';
import { LoginState } from './login-state.enum';
import { SyncState } from './sync-state.enum';
import { ConnectionState } from './connection-state.enum';
import { AppConfig } from 'app/app-config/app-config';

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

describe('SyncedSessionService', () => {
    const alertService = new AlertService(null, null);
    let sessionService: SessionService;

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
    })

    it('has the correct state after Login with wrong credentials', async () => {
        const loginState = await sessionService.login('demo', 'pass123');
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

    it('Logout', () => {
        sessionService.logout();
        expect(sessionService.getLoginState().getState()).toEqual(LoginState.loggedOut);
        expect(sessionService.getConnectionState().getState()).toEqual(ConnectionState.disconnected);

        expect(sessionService.isLoggedIn()).toEqual(false);
        expect(sessionService.getCurrentUser()).not.toBeDefined();
    });
});
