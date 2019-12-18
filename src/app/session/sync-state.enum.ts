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

/**
 * State of the Synchronization between local and remote database
 */
export enum SyncState {
  /** Sync startet. In case of liveSync, this means the sync was resumed */
  STARTED,
  /** Sync completed. In case of liveSync, this means the sync was paused (and waits for more changes) */
  COMPLETED,
  /** Sync failed. This may be, because we are offline, or due to some other reason */
  FAILED,
  /** (Potentially) Unsynced. This is the state before the first sync after startup */
  UNSYNCED,
  /** Sync was aborted. Currently only used when the initial login takes place offline */
  ABORTED,
}
