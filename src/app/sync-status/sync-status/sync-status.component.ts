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
import {DatabaseManagerService} from '../../database/database-manager.service';
import {SessionService} from '../../session/session.service';
import {DatabaseSyncStatus} from '../../database/database-sync-status.enum';
import {AlertService} from '../../alerts/alert.service';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import {InitialSyncDialogComponent} from './initial-sync-dialog.component';

@Component({
  selector: 'app-sync-status',
  templateUrl: './sync-status.component.html',
  styleUrls: ['./sync-status.component.css']
})
export class SyncStatusComponent implements OnInit {

  syncInProgress: boolean;
  dialogRef: MatDialogRef<InitialSyncDialogComponent>;

  constructor(private _dbManager: DatabaseManagerService,
              public dialog: MatDialog,
              private _sessionService: SessionService,
              private alertService: AlertService) {
  }

  ngOnInit(): void {
    this._dbManager.onSyncStatusChanged.subscribe((status: any) => this.handleSyncStatus(status));
  }

  private handleSyncStatus(status: DatabaseSyncStatus) {
    switch (status) {
      case DatabaseSyncStatus.started:
        this.syncInProgress = true;
        if (!this._sessionService.isLoggedIn()) {
          this.dialogRef = this.dialog.open(InitialSyncDialogComponent);
        }
        break;
      case DatabaseSyncStatus.completed:
        this.syncInProgress = false;
        if (this.dialogRef) {
          this.dialogRef.close();
        }
        this.alertService.addInfo('Database sync completed.');
        break;
      case DatabaseSyncStatus.failed:
        this.syncInProgress = false;
        if (this.dialogRef) {
          this.dialogRef.close();
        }
        this.alertService.addWarning('Database sync failed.');
        break;

      case DatabaseSyncStatus.pulledChanges:
        this.alertService.addInfo('Updated database from server.');
        this.syncInProgress = true;
        setTimeout(() => this.syncInProgress = false, 1000);
        break;
      case DatabaseSyncStatus.pushedChanges:
        this.syncInProgress = true;
        setTimeout(() => this.syncInProgress = false, 1000);
        break;
    }
  }
}
