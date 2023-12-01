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

/** State of the login at the local database, which is synonymous to login at the whole application */
export enum LoginState {
  /** Login failed due to wrong credentials */
  LOGIN_FAILED,
  /** Login state either before first login-attempt or after logout */
  LOGGED_OUT,
  /** Successfully logged in */
  LOGGED_IN,
  /** Login is currently in progress */
  IN_PROGRESS,
  /** Login is not possible right now */
  UNAVAILABLE,
}
