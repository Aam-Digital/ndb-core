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

import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
} from "@angular/core";
import { toObservable, toSignal } from "@angular/core/rxjs-interop";
import { SyncState } from "../../../session/session-states/sync-state.enum";
import { environment } from "../../../../../environments/environment";
import { DatabaseIndexingService } from "../../../entity/database-indexing/database-indexing.service";
import { BackgroundProcessState } from "../background-process-state.interface";
import { debounceTime } from "rxjs/operators";
import { BackgroundProcessingIndicatorComponent } from "../background-processing-indicator/background-processing-indicator.component";
import { SyncStateSubject, SessionType } from "../../../session/session-type";

/**
 * A small indicator component that displays an icon when there is currently synchronization
 * with the remote server going on in the background.
 */
@Component({
  selector: "app-sync-status",
  templateUrl: "./sync-status.component.html",
  imports: [BackgroundProcessingIndicatorComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SyncStatusComponent {
  private readonly syncStateSubject = inject(SyncStateSubject);
  private readonly dbIndexingService = inject(DatabaseIndexingService);

  private readonly syncState = toSignal(this.syncStateSubject, {
    initialValue: this.syncStateSubject.value,
  });
  private readonly indexingProcesses = toSignal(
    this.dbIndexingService.indicesRegistered,
    { initialValue: [] as BackgroundProcessState[] },
  );

  private readonly currentProcesses = computed<BackgroundProcessState[]>(() => {
    const currentProcesses: BackgroundProcessState[] = [];
    if (this.syncState() === SyncState.STARTED) {
      currentProcesses.push({
        title: $localize`Synchronizing database`,
        pending: true,
      });
    } else if (environment.session_type === SessionType.online) {
      currentProcesses.push({
        title: $localize`Offline sync disabled — loading data directly from server`,
        pending: false,
      });
    } else {
      currentProcesses.push({
        title: $localize`Database up-to-date`,
        pending: false,
      });
    }

    return currentProcesses.concat(this.indexingProcesses());
  });

  /** background processes to be displayed to users, with short delay to avoid flickering */
  backgroundProcesses = toSignal(
    toObservable(this.currentProcesses).pipe(debounceTime(1000)),
    { initialValue: [] as BackgroundProcessState[] },
  );
}
