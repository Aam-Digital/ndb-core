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

import { EventEmitter, Injectable } from '@angular/core';
import { SessionStatus } from './session-status';
import { DatabaseManagerService } from '../database/database-manager.service';
import { EntityMapperService } from '../entity/entity-mapper.service';
import { AlertService } from '../alerts/alert.service';
import { User } from '../user/user';
import { environment } from '../../environments/environment';

@Injectable()
export class SessionService {
  currentUser: User = null;

  private _onSessionStatusChanged: EventEmitter<SessionStatus>;
  get onSessionStatusChanged() {
    if (this._onSessionStatusChanged === undefined) {
      this._onSessionStatusChanged = new EventEmitter<SessionStatus>(true);
    }
    return this._onSessionStatusChanged;
  }


  constructor(private _dbManager: DatabaseManagerService,
              private _entityMapper: EntityMapperService,
              private _alertService: AlertService) {

  }

  public isLoggedIn(): boolean {
    return this.currentUser !== null;
  }

  /**
   * Authenticates the given user with local and remote database.
   * If successful, the user is set as currentUser for this session.
   *
   * WARNING: This method returns false immediately if the user cannot
   * be authenticated with the local database.
   */
  public login(username: string, password: string): Promise<boolean> {
    let promise: Promise<boolean>;
    promise = this.authenticateLocalUser(username, password);
    this.remoteDatabaseLogin(username, password);

    return promise;
  }

  public logout() {
    this.currentUser = null;
    this.onSessionStatusChanged.emit(SessionStatus.loggedOut);
  }


  private authenticateLocalUser(username: string, password: string): Promise<boolean> {

    const self = this;

    return this._entityMapper.load<User>(new User(username))
      .then(function (userEntity) {
        if (userEntity.checkPassword(password)) {
          self.onLocalLoginSuccessful(userEntity);
          return true;
        } else {
          self.onLocalLoginFailed({status: 401});
          return false;
        }
      })
      .catch(function (error: any) {
        self.onLocalLoginFailed(error);
        return false;
      });
  }

  private onLocalLoginSuccessful(user: User) {
    this.currentUser = user;
    this.onSessionStatusChanged.emit(SessionStatus.loggedIn);
  }

  private onLocalLoginFailed(error: any) {
    this.currentUser = null;
    this.onSessionStatusChanged.emit(SessionStatus.loginFailed);
    return error;
  }

  private remoteDatabaseLogin(username: string, password: string): Promise<boolean> {
    const self = this;
    return this._dbManager.login(username, password)
      .then(function (loginSuccess) {
        if (loginSuccess) {
          self.onRemoteLoginSuccessful();
        } else {
          self.onRemoteLoginFailed();
        }
        return loginSuccess;
      });
  }

  private onRemoteLoginSuccessful() {
    this._alertService.addInfo('Connected to remote database.');
  }

  private onRemoteLoginFailed() {
    this._alertService.addWarning('Could not connect to remote database. Data cannot be synchronized at the moment.');
  }
}
