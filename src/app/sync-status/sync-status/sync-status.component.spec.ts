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
import {MatDialogModule, MatIconModule, MatProgressBarModule} from '@angular/material';
import {MockSessionService} from '../../session/mock-session.service';
import {AlertService} from '../../alerts/alert.service';
import {NoopAnimationsModule} from '@angular/platform-browser/animations';
import {InitialSyncDialogComponent} from './initial-sync-dialog.component';
import {NgModule} from '@angular/core';
import { SessionService } from 'app/session/session.service';
import { SyncState } from 'app/session/sync-state.enum';


@NgModule({
  declarations: [InitialSyncDialogComponent, SyncStatusComponent],
  imports: [MatIconModule, MatDialogModule, NoopAnimationsModule, MatProgressBarModule],
  entryComponents: [InitialSyncDialogComponent],
})
class TestModule { }


describe('SyncStatusComponent', () => {
  let component: SyncStatusComponent;
  let fixture: ComponentFixture<SyncStatusComponent>;

  let sessionService: MockSessionService;
  let alertService: AlertService;

  beforeEach(async(() => {
    sessionService = new MockSessionService();
    alertService = new AlertService(null, null);

    TestBed.configureTestingModule({
      imports: [TestModule],
      providers: [
        { provide: SessionService, useValue: sessionService },
        { provide: AlertService, useValue: alertService }
      ],
    })
      .compileComponents();
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
    sessionService.getSyncState().setState(SyncState.started);
    setTimeout(() => checkDialogRefDefined(expect, done), 100);

    function checkDialogRefDefined(_expect, _done) {
      _expect(component.dialogRef).toBeDefined();
      _done();
    }
  });
});
