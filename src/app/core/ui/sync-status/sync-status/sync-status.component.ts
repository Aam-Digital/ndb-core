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

import { ChangeDetectionStrategy, Component, inject } from "@angular/core";
import { SyncState } from "../../../session/session-states/sync-state.enum";
import { DatabaseIndexingService } from "../../../entity/database-indexing/database-indexing.service";
import { BackgroundProcessState } from "../background-process-state.interface";
import { BehaviorSubject } from "rxjs";
import { debounceTime } from "rxjs/operators";
import { BackgroundProcessingIndicatorComponent } from "../background-processing-indicator/background-processing-indicator.component";
import { UntilDestroy, untilDestroyed } from "@ngneat/until-destroy";
import { SyncStateSubject } from "../../../session/session-type";

/**
 * A small indicator component that displays an icon when there is currently synchronization
 * with the remote server going on in the background.
 */
@UntilDestroy()
@Component({
  selector: "app-sync-status",
  templateUrl: "./sync-status.component.html",
  imports: [BackgroundProcessingIndicatorComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SyncStatusComponent {
  private syncState = inject(SyncStateSubject);
  private dbIndexingService = inject(DatabaseIndexingService);

  private indexingProcesses: BackgroundProcessState[];

  private _backgroundProcesses = new BehaviorSubject<BackgroundProcessState[]>(
    [],
  );
  /** background processes to be displayed to users, with short delay to avoid flickering */
  backgroundProcesses = this._backgroundProcesses
    .asObservable()
    .pipe(debounceTime(1000));

  constructor() {
    this.dbIndexingService.indicesRegistered
      .pipe(untilDestroyed(this))
      .subscribe((indicesStatus) => {
        this.indexingProcesses = indicesStatus;
        this.updateBackgroundProcessesList();
      });

    this.syncState
      .pipe(untilDestroyed(this))
      .subscribe(() => this.updateBackgroundProcessesList());
  }

  /**
   * Build and emit an updated array of current background processes
   * @private
   */
  private updateBackgroundProcessesList() {
    let currentProcesses: BackgroundProcessState[] = [];
    if (this.syncState.value === SyncState.STARTED) {
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
