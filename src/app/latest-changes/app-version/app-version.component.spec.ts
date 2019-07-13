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

import { AppVersionComponent } from './app-version.component';
import { MatDialogModule } from '@angular/material/dialog';
import {SessionService} from '../../session/session.service';
import {EntityMapperService} from '../../entity/entity-mapper.service';
import {LatestChangesService} from '../latest-changes.service';
import {NoopAnimationsModule} from '@angular/platform-browser/animations';
import {ChangelogComponent} from '../changelog/changelog.component';
import {of} from 'rxjs';
import {BrowserDynamicTestingModule} from '@angular/platform-browser-dynamic/testing';

describe('AppVersionComponent', () => {
  let component: AppVersionComponent;
  let fixture: ComponentFixture<AppVersionComponent>;

  let latestChangesService: LatestChangesService;
  let sessionService: SessionService;
  let entityMapper: EntityMapperService;

  beforeEach(async(() => {
    latestChangesService = new LatestChangesService(null, null, null, null);
    sessionService = new SessionService(null, null, null);
    entityMapper = new EntityMapperService(null, null);

    spyOn(latestChangesService, 'getChangelogs').and
      .returnValue(of([{ name: 'test', tag_name: 'v1.0', body: 'latest test', published_at: '2018-01-01'}]));

    TestBed.configureTestingModule({
      declarations: [AppVersionComponent, ChangelogComponent],
      imports: [MatDialogModule, NoopAnimationsModule],
      providers: [
        {provide: SessionService, useValue: sessionService},
        {provide: EntityMapperService, useValue: entityMapper},
        {provide: LatestChangesService, useValue: latestChangesService},
      ]
    });

    TestBed.overrideModule(BrowserDynamicTestingModule, {
      set: {
        entryComponents: [ChangelogComponent]
      }
    });

    TestBed.compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(AppVersionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });


  it('should be created', () => {
    expect(component).toBeTruthy();
  });


  it('should open dialog', () => {
    const spy = spyOn(latestChangesService, 'showLatestChanges');

    component.showLatestChanges();
    expect(spy.calls.count()).toBe(1, 'dialog not opened');
  });

});
