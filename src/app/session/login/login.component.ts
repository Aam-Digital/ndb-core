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

import { Component, OnInit } from '@angular/core';
import { DatabaseSyncStatus } from '../../database/database-sync-status.enum';
import { SessionService } from '../session.service';
import { DatabaseManagerService } from '../../database/database-manager.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent implements OnInit {

  loginInProgress = false;
  username: string;
  password: string;
  errorMessage: string;

  private retryLoginSubscription: any;
  private isRetriedLogin = false;
  private _lastPassword: string;


  constructor(private _sessionService: SessionService,
              private _dbManager: DatabaseManagerService) {
  }


  ngOnInit(): void {
  }

  login() {
    this.loginInProgress = true;

    this._sessionService.login(this.username, this.password)
      .then(success => success ? this.onLoginSuccess() : this.onLoginFailure('username or password incorrect'))
      .catch(reason => this.onLoginFailure(reason));
  }

  private onLoginSuccess() {
    this.reset();
    // login component is automatically hidden based on _sessionService.isLoggedIn()
  }

  private onLoginFailure(reason: any) {
    if (!this.isRetriedLogin) {
      this._lastPassword = this.password;
      this.retryLoginAfterSync();
    }

    this.reset();
    this.errorMessage = reason;
  }


  private reset() {
    this.errorMessage = '';
    this._lastPassword = this.password;
    this.password = '';
    this.loginInProgress = false;
    this.isRetriedLogin = false;
  }


  private retryLoginAfterSync() {
    this.isRetriedLogin = true;

    const self = this;
    this.retryLoginSubscription = this._dbManager.onSyncStatusChanged.subscribe(
      function (syncStatus: DatabaseSyncStatus) {
        if (syncStatus === DatabaseSyncStatus.completed) {
          self.password = self._lastPassword;
          self.login();
          self.retryLoginSubscription.unsubscribe();
        } else if (syncStatus === DatabaseSyncStatus.failed) {
          self.retryLoginSubscription.unsubscribe();
        }
      }
    );
  }
}
