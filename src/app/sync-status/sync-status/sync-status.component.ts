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

import {Component, OnInit} from '@angular/core';
import {SessionService} from '../../session/session.service';
import {SyncState} from '../../session/sync-state.enum';
import {AlertService} from '../../alerts/alert.service';
import {MatDialog, MatDialogRef} from '@angular/material';
import {InitialSyncDialogComponent} from './initial-sync-dialog.component';
import { StateChangedEvent } from 'app/session/util/state-handler';

@Component({
  selector: 'app-sync-status',
  templateUrl: './sync-status.component.html',
  styleUrls: ['./sync-status.component.css']
})
export class SyncStatusComponent implements OnInit {

  syncInProgress: boolean;
  dialogRef: MatDialogRef<InitialSyncDialogComponent>;

  constructor(public dialog: MatDialog,
              private sessionService: SessionService,
              private alertService: AlertService) {
  }

  ngOnInit(): void {
    this.sessionService.getSyncState().getStateChangedStream().subscribe(state => this.handleSyncState(state));
  }

  private handleSyncState(state: StateChangedEvent<SyncState>) {
    switch (state.toState) {
      case SyncState.started:
        this.syncInProgress = true;
        if (!this.sessionService.isLoggedIn()) {
          this.dialogRef = this.dialog.open(InitialSyncDialogComponent);
        }
        break;
      case SyncState.completed:
        this.syncInProgress = false;
        if (this.dialogRef) {
          this.dialogRef.close();
        }
        this.alertService.addInfo('Database sync completed.');
        break;
      case SyncState.failed:
        this.syncInProgress = false;
        if (this.dialogRef) {
          this.dialogRef.close();
        }
        this.alertService.addWarning('Database sync failed.');
        break;

      /*case DatabaseSyncStatus.pulledChanges:
        this.alertService.addInfo('Updated database from server.');
        this.syncInProgress = true;
        setTimeout(() => this.syncInProgress = false, 1000);
        break;
      case DatabaseSyncStatus.pushedChanges:
        this.syncInProgress = true;
        setTimeout(() => this.syncInProgress = false, 1000);
        break;*/
    }
  }
}
