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

import { LatestChangesComponent } from './latest-changes.component';

describe('LatestChangesComponent', () => {
  let component: LatestChangesComponent;
  let fixture: ComponentFixture<LatestChangesComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [LatestChangesComponent]
    })
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(LatestChangesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  /* TODO fix test case
  it('should be created', () => {
    expect(component).toBeTruthy();
  });
  */
});
