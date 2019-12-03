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

import { Injectable } from '@angular/core';

import { LoginState } from './login-state.enum';
import { Database } from '../database/database';
import { ConnectionState } from './connection-state.enum';
import { SyncState } from './sync-state.enum';
import { User } from '../user/user';
import { StateHandler } from './util/state-handler';

@Injectable()
export abstract class SessionService {
  abstract login(username: string, password: string): Promise<LoginState>;
  abstract logout();

  abstract getCurrentUser(): User;
  abstract isLoggedIn(): boolean;

  abstract getLoginState(): StateHandler<LoginState>;
  abstract getConnectionState(): StateHandler<ConnectionState>;
  abstract getSyncState(): StateHandler<SyncState>;

  abstract sync(): Promise<any>;

  abstract getDatabase(): Database;
}
