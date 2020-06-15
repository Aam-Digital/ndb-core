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

import { Component, OnInit } from "@angular/core";
import { SessionService } from "../../session/session-service/session.service";
import { SyncState } from "../../session/session-states/sync-state.enum";
import { AlertService } from "../../alerts/alert.service";
import { MatDialog, MatDialogRef } from "@angular/material/dialog";
import { InitialSyncDialogComponent } from "./initial-sync-dialog.component";
import { StateChangedEvent } from "app/core/session/session-states/state-handler";

/**
 * A small indicator component that displays an icon when there is currently synchronization
 * with the remote server going on in the background.
 *
 * This component also triggers a blocking dialog box when an initial sync is detected that prevents
 * user login (because user accounts need to be synced first).
 */
@Component({
  selector: "app-sync-status",
  templateUrl: "./sync-status.component.html",
  styleUrls: ["./sync-status.component.scss"],
})
export class SyncStatusComponent implements OnInit {
  /** whether synchronization is currently going on */
  syncInProgress: boolean;

  private dialogRef: MatDialogRef<InitialSyncDialogComponent>;

  constructor(
    public dialog: MatDialog,
    private sessionService: SessionService,
    private alertService: AlertService
  ) {}

  ngOnInit(): void {
    this.sessionService
      .getSyncState()
      .getStateChangedStream()
      .subscribe((state) => this.handleSyncState(state));
  }

  private handleSyncState(state: StateChangedEvent<SyncState>) {
    switch (state.toState) {
      case SyncState.STARTED:
        this.syncInProgress = true;
        if (!this.sessionService.isLoggedIn()) {
          this.dialogRef = this.dialog.open(InitialSyncDialogComponent);
        }
        break;
      case SyncState.COMPLETED:
        this.syncInProgress = false;
        if (this.dialogRef) {
          this.dialogRef.close();
        }
        this.alertService.addInfo("Database sync completed.");
        break;
      case SyncState.FAILED:
        this.syncInProgress = false;
        if (this.dialogRef) {
          this.dialogRef.close();
        }
        this.alertService.addWarning("Database sync failed.");
        break;
    }
  }
}
