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
import {MockSessionService} from '../../session/mock-session.service';
import {NoopAnimationsModule} from '@angular/platform-browser/animations';
import {InitialSyncDialogComponent} from './initial-sync-dialog.component';
import { SessionService } from 'app/session/session.service';
import { SyncState } from 'app/session/sync-state.enum';
import { AlertsModule } from 'app/alerts/alerts.module';
import {BrowserDynamicTestingModule} from '@angular/platform-browser-dynamic/testing';


describe('SyncStatusComponent', () => {
  let component: SyncStatusComponent;
  let fixture: ComponentFixture<SyncStatusComponent>;

  let sessionService: MockSessionService;

  beforeEach(async(() => {
    sessionService = new MockSessionService();

    TestBed.configureTestingModule({
      declarations: [InitialSyncDialogComponent, SyncStatusComponent],
      imports: [MatIconModule, MatDialogModule, NoopAnimationsModule, MatProgressBarModule, AlertsModule],
      providers: [
        { provide: SessionService, useValue: sessionService }
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

  it('should open dialog without error', async () => {
    sessionService.getSyncState().setState(SyncState.started);

    fixture.detectChanges();
    await fixture.whenStable();
    expect(component.dialogRef).toBeDefined();

    sessionService.getSyncState().setState(SyncState.completed);
    component.dialogRef.close();

    fixture.detectChanges();
    await fixture.whenStable();
  });
});
