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
import { SessionService } from "../../../session/session-service/session.service";
import { SyncState } from "../../../session/session-states/sync-state.enum";
import { DatabaseIndexingService } from "../../../entity/database-indexing/database-indexing.service";
import { BehaviorSubject } from "rxjs";
import { BackgroundProcessState } from "../background-process-state.interface";
import { FontAwesomeTestingModule } from "@fortawesome/angular-fontawesome/testing";
import {
  EntityRegistry,
  entityRegistry,
} from "../../../entity/database-entity.decorator";
import { expectObservable } from "../../../../utils/test-utils/observable-utils";

describe("SyncStatusComponent", () => {
  let component: SyncStatusComponent;
  let fixture: ComponentFixture<SyncStatusComponent>;

  let mockSessionService: jasmine.SpyObj<SessionService>;
  let mockIndexingService;

  const DATABASE_SYNCING_STATE: BackgroundProcessState = {
    title: "Synchronizing database",
    pending: true,
  };
  const DATABASE_SYNCED_STATE: BackgroundProcessState = {
    title: "Database up-to-date",
    pending: false,
  };

  beforeEach(waitForAsync(() => {
    mockSessionService = jasmine.createSpyObj(["isLoggedIn"], {
      syncState: new BehaviorSubject(SyncState.UNSYNCED),
    });
    mockSessionService.isLoggedIn.and.returnValue(false);
    mockIndexingService = { indicesRegistered: new BehaviorSubject([]) };

    TestBed.configureTestingModule({
      imports: [
        SyncStatusComponent,
        NoopAnimationsModule,
        FontAwesomeTestingModule,
      ],
      providers: [
        { provide: SessionService, useValue: mockSessionService },
        { provide: DatabaseIndexingService, useValue: mockIndexingService },
        { provide: EntityRegistry, useValue: entityRegistry },
      ],
    });

    TestBed.compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(SyncStatusComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should be created", () => {
    expect(component).toBeTruthy();
  });

  it("should update backgroundProcesses details on sync", async () => {
    mockSessionService.syncState.next(SyncState.STARTED);
    fixture.detectChanges();
    await fixture.whenStable();

    await expectObservable(component.backgroundProcesses).first.toBeResolvedTo([
      DATABASE_SYNCING_STATE,
    ]);

    mockSessionService.syncState.next(SyncState.COMPLETED);
    fixture.detectChanges();
    await fixture.whenStable();

    await expectObservable(component.backgroundProcesses).first.toBeResolvedTo([
      DATABASE_SYNCED_STATE,
    ]);
  });

  it("should update backgroundProcesses with indexing", async () => {
    const testIndexState: BackgroundProcessState = {
      title: "Indexing",
      pending: true,
    };
    mockIndexingService.indicesRegistered.next([testIndexState]);
    fixture.detectChanges();
    await fixture.whenStable();

    await expectObservable(component.backgroundProcesses).first.toBeResolvedTo([
      DATABASE_SYNCED_STATE,
      testIndexState,
    ]);
  });
});
