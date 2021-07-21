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
import { DatabaseIndexingService } from "../../entity/database-indexing/database-indexing.service";
import { BackgroundProcessState } from "../background-process-state.interface";
import { BehaviorSubject } from "rxjs";
import { debounceTime } from "rxjs/operators";
import { StateChangedEvent } from "../../session/session-states/state-handler";
import { LoggingService } from "../../logging/logging.service";

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
  private syncInProgress: boolean;
  private indexingProcesses: BackgroundProcessState[];

  private _backgroundProcesses: BehaviorSubject<
    BackgroundProcessState[]
  > = new BehaviorSubject([]);
  /** background processes to be displayed to users, with short delay to avoid flickering */
  backgroundProcesses = this._backgroundProcesses
    .asObservable()
    .pipe(debounceTime(1000));

  private dialogRef: MatDialogRef<InitialSyncDialogComponent>;

  constructor(
    public dialog: MatDialog,
    private sessionService: SessionService,
    private dbIndexingService: DatabaseIndexingService,
    private alertService: AlertService,
    private loggingService: LoggingService
  ) {}

  ngOnInit(): void {
    this.dbIndexingService.indicesRegistered.subscribe((indicesStatus) =>
      this.handleIndexingState(indicesStatus)
    );

    this.sessionService
      .getSyncState()
      .getStateChangedStream()
      .subscribe((state) => this.handleSyncState(state));
  }

  private handleSyncState(state: StateChangedEvent<SyncState>) {
    switch (state.toState) {
      case SyncState.STARTED:
        this.syncInProgress = true;
        if (!this.sessionService.isLoggedIn() && !this.dialogRef) {
          this.dialogRef = this.dialog.open(InitialSyncDialogComponent);
        }
        break;
      case SyncState.COMPLETED:
        this.syncInProgress = false;
        if (this.dialogRef) {
          this.dialogRef.close();
        }
        this.loggingService.debug("Database sync completed.");
        break;
      case SyncState.FAILED:
        this.syncInProgress = false;
        if (this.dialogRef) {
          this.dialogRef.close();
        }
        break;
    }
    this.updateBackgroundProcessesList();
  }

  private handleIndexingState(indicesStatus: BackgroundProcessState[]) {
    this.indexingProcesses = indicesStatus;
    this.updateBackgroundProcessesList();
  }

  /**
   * Build and emit an updated array of current background processes
   * @private
   */
  private updateBackgroundProcessesList() {
    let currentProcesses: BackgroundProcessState[] = [];
    if (this.syncInProgress) {
      currentProcesses.push({
        title: $localize`Synchronizing database`,
        pending: true,
      });
    } else {
      currentProcesses.push({
        title: $localize`Database up-to-date`,
        pending: false,
      });
    }
    currentProcesses = currentProcesses.concat(this.indexingProcesses);
    this._backgroundProcesses.next(currentProcesses);
  }
}
