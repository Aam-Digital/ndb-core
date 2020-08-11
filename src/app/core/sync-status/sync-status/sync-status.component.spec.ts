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

import { async, ComponentFixture, TestBed } from "@angular/core/testing";

import { SyncStatusComponent } from "./sync-status.component";
import { MatDialogModule } from "@angular/material/dialog";
import { MatIconModule } from "@angular/material/icon";
import { MatProgressBarModule } from "@angular/material/progress-bar";
import { MockSessionService } from "../../session/session-service/mock-session.service";
import { NoopAnimationsModule } from "@angular/platform-browser/animations";
import { InitialSyncDialogComponent } from "./initial-sync-dialog.component";
import { SessionService } from "app/core/session/session-service/session.service";
import { SyncState } from "app/core/session/session-states/sync-state.enum";
import { AlertsModule } from "app/core/alerts/alerts.module";
import { EntitySchemaService } from "app/core/entity/schema/entity-schema.service";
import { DatabaseIndexingService } from "../../entity/database-indexing/database-indexing.service";
import { of } from "rxjs";

describe("SyncStatusComponent", () => {
  let component: SyncStatusComponent;
  let fixture: ComponentFixture<SyncStatusComponent>;

  let sessionService: MockSessionService;
  let mockIndexingService;

  beforeEach(async(() => {
    sessionService = new MockSessionService(new EntitySchemaService());
    mockIndexingService = { indicesRegistered: of([]) };

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
  }));

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
});
