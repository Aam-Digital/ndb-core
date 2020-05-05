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
import { CanActivate } from '@angular/router';
import { SessionService } from '../session-service/session.service';

/**
 * Angular guard to prevent routing if no user is currently logged in.
 */
@Injectable()
export class LoggedInGuard implements CanActivate {

  constructor(private _sessionService: SessionService) {
  }

  /**
   * Allow if a user is logged in currently.
   */
  canActivate() {
    return this._sessionService.isLoggedIn();
  }
}
