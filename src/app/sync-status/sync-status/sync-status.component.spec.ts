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

import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { SyncStatusComponent } from './sync-status.component';
import { MatDialogModule } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import {SessionService} from '../../session/session.service';
import {AlertService} from '../../alerts/alert.service';
import {DatabaseManagerService} from '../../database/database-manager.service';
import {MockDatabaseManagerService} from '../../database/mock-database-manager.service';
import {DatabaseSyncStatus} from '../../database/database-sync-status.enum';
import {NoopAnimationsModule} from '@angular/platform-browser/animations';
import {InitialSyncDialogComponent} from './initial-sync-dialog.component';
import {BrowserDynamicTestingModule} from '@angular/platform-browser-dynamic/testing';

describe('SyncStatusComponent', () => {
  let component: SyncStatusComponent;
  let fixture: ComponentFixture<SyncStatusComponent>;

  let sessionService: SessionService;
  let alertService: AlertService;
  let dbManager: MockDatabaseManagerService;

  beforeEach(async(() => {
    sessionService = new SessionService(null, null, null);
    alertService = new AlertService(null, null);
    dbManager = new MockDatabaseManagerService();

    TestBed.configureTestingModule({
      declarations: [InitialSyncDialogComponent, SyncStatusComponent],
      imports: [MatIconModule, MatDialogModule, NoopAnimationsModule, MatProgressBarModule],
      providers: [
        { provide: SessionService, useValue: sessionService },
        { provide: AlertService, useValue: alertService },
        { provide: DatabaseManagerService, useValue: dbManager}
      ],
    });

    TestBed.overrideModule(BrowserDynamicTestingModule, {
      set: {
        entryComponents: [InitialSyncDialogComponent]
      }
    });

    TestBed.compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(SyncStatusComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });


   it('should be created', () => {
    expect(component).toBeTruthy();
   });

  it('should open dialog without error', (done) => {
    dbManager.triggerSyncStatusChanged(DatabaseSyncStatus.started);
    setTimeout(() => checkDialogRefDefined(expect, done), 100);

    function checkDialogRefDefined(_expect, _done) {
      _expect(component.dialogRef).toBeDefined();
      component.dialogRef.close();
      fixture.detectChanges();
      fixture.whenStable().then(_done());
    }
  });
});
