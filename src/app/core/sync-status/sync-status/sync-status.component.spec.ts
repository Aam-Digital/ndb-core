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

import { ComponentFixture, TestBed, waitForAsync } from "@angular/core/testing";

import { SyncStatusComponent } from "./sync-status.component";
import { MatDialogModule } from "@angular/material/dialog";
import { MatIconModule } from "@angular/material/icon";
import { MatProgressBarModule } from "@angular/material/progress-bar";
import { MockSessionService } from "../../session/session-service/mock-session.service";
import { NoopAnimationsModule } from "@angular/platform-browser/animations";
import { InitialSyncDialogComponent } from "./initial-sync-dialog.component";
import { SessionService } from "../../session/session-service/session.service";
import { SyncState } from "../../session/session-states/sync-state.enum";
import { AlertsModule } from "../../alerts/alerts.module";
import { EntitySchemaService } from "../../entity/schema/entity-schema.service";
import { DatabaseIndexingService } from "../../entity/database-indexing/database-indexing.service";
import { BehaviorSubject } from "rxjs";
import { take } from "rxjs/operators";
import { BackgroundProcessState } from "../background-process-state.interface";

describe("SyncStatusComponent", () => {
  let component: SyncStatusComponent;
  let fixture: ComponentFixture<SyncStatusComponent>;

  let sessionService: MockSessionService;
  let mockIndexingService;

  const DATABASE_SYNCING_STATE: BackgroundProcessState = {
    title: "Synchronizing database",
    pending: true,
  };
  const DATABASE_SYNCED_STATE: BackgroundProcessState = {
    title: "Database up-to-date",
    pending: false,
  };

  beforeEach(
    waitForAsync(() => {
      sessionService = new MockSessionService(new EntitySchemaService());
      mockIndexingService = { indicesRegistered: new BehaviorSubject([]) };

      TestBed.configureTestingModule({
        declarations: [InitialSyncDialogComponent, SyncStatusComponent],
        imports: [
          MatIconModule,
          MatDialogModule,
          NoopAnimationsModule,
          MatProgressBarModule,
          AlertsModule,
        ],
        providers: [
          { provide: SessionService, useValue: sessionService },
          { provide: DatabaseIndexingService, useValue: mockIndexingService },
        ],
      });

      TestBed.compileComponents();
    })
  );

  beforeEach(() => {
    fixture = TestBed.createComponent(SyncStatusComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should be created", () => {
    expect(component).toBeTruthy();
  });

  it("should open dialog without error", async () => {
    sessionService.getSyncState().setState(SyncState.STARTED);

    fixture.detectChanges();
    await fixture.whenStable();
    // @ts-ignore
    expect(component.dialogRef).toBeDefined();

    sessionService.getSyncState().setState(SyncState.COMPLETED);
    // @ts-ignore
    component.dialogRef.close();

    fixture.detectChanges();
    await fixture.whenStable();
  });

  it("should update backgroundProcesses details on sync", async () => {
    sessionService.getSyncState().setState(SyncState.STARTED);
    fixture.detectChanges();
    await fixture.whenStable();

    expect(
      await component.backgroundProcesses.pipe(take(1)).toPromise()
    ).toEqual([DATABASE_SYNCING_STATE]);

    sessionService.getSyncState().setState(SyncState.COMPLETED);
    fixture.detectChanges();
    await fixture.whenStable();

    expect(
      await component.backgroundProcesses.pipe(take(1)).toPromise()
    ).toEqual([DATABASE_SYNCED_STATE]);
  });

  it("should update backgroundProcesses with indexing", async () => {
    const testIndexState: BackgroundProcessState = {
      title: "Indexing",
      pending: true,
    };
    mockIndexingService.indicesRegistered.next([testIndexState]);
    fixture.detectChanges();
    await fixture.whenStable();

    expect(
      await component.backgroundProcesses.pipe(take(1)).toPromise()
    ).toEqual([DATABASE_SYNCED_STATE, testIndexState]);
  });
});
