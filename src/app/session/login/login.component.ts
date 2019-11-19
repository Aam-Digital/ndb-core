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
import { SyncState } from '../sync-state.enum';
import { SessionService } from '../session.service';
import { LoginState } from '../login-state.enum';
import { ConnectionState } from '../connection-state.enum';

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

  constructor(private _sessionService: SessionService) {
  }

  ngOnInit(): void {
  }

  login() {
    this.loginInProgress = true;

    this._sessionService.login(this.username, this.password)
      .then(loginState => {
        if (loginState === LoginState.LOGGED_IN) {
          this.onLoginSuccess();
        } else {
          if (this._sessionService.getConnectionState().getState() === ConnectionState.OFFLINE) {
            this.onLoginFailure('can\'t login for the first time when offline');
          } else {
            this.onLoginFailure('username or password incorrect');
          }
        }
      }).catch(reason => this.onLoginFailure(reason));
  }

  private onLoginSuccess() {
    this.reset();
    // login component is automatically hidden based on _sessionService.isLoggedIn()
  }

  private onLoginFailure(reason: any) {
    this.reset();
    this.errorMessage = reason;
  }


  private reset() {
    this.errorMessage = '';
    this.password = '';
    this.loginInProgress = false;
  }
}
