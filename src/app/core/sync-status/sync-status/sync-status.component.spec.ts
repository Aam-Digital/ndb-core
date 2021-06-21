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
import { NoopAnimationsModule } from "@angular/platform-browser/animations";
import { SessionService } from "../../session/session-service/session.service";
import { SyncState } from "../../session/session-states/sync-state.enum";
import { DatabaseIndexingService } from "../../entity/database-indexing/database-indexing.service";
import { BehaviorSubject } from "rxjs";
import { first } from "rxjs/operators";
import { BackgroundProcessState } from "../background-process-state.interface";
import { SyncStatusModule } from "../sync-status.module";

describe("SyncStatusComponent", () => {
  let component: SyncStatusComponent;
  let fixture: ComponentFixture<SyncStatusComponent>;

  let mockSessionService: jasmine.SpyObj<SessionService>;
  const syncState = new BehaviorSubject(SyncState.UNSYNCED);
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
      mockSessionService = jasmine.createSpyObj<SessionService>(
        ["isLoggedIn"],
        { syncStateStream: syncState }
      );
      mockSessionService.isLoggedIn.and.returnValue(false);
      mockIndexingService = { indicesRegistered: new BehaviorSubject([]) };

      TestBed.configureTestingModule({
        imports: [SyncStatusModule, NoopAnimationsModule],
        providers: [
          { provide: SessionService, useValue: mockSessionService },
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
    syncState.next(SyncState.STARTED);

    fixture.detectChanges();
    await fixture.whenStable();
    // @ts-ignore
    expect(component.dialogRef).toBeDefined();

    syncState.next(SyncState.COMPLETED);
    // @ts-ignore
    component.dialogRef.close();

    fixture.detectChanges();
    await fixture.whenStable();
  });

  it("should update backgroundProcesses details on sync", async () => {
    syncState.next(SyncState.STARTED);
    fixture.detectChanges();
    await fixture.whenStable();

    expect(
      await component.backgroundProcesses.pipe(first()).toPromise()
    ).toEqual([DATABASE_SYNCING_STATE]);

    syncState.next(SyncState.COMPLETED);
    fixture.detectChanges();
    await fixture.whenStable();

    expect(
      await component.backgroundProcesses.pipe(first()).toPromise()
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
      await component.backgroundProcesses.pipe(first()).toPromise()
    ).toEqual([DATABASE_SYNCED_STATE, testIndexState]);
  });
});
