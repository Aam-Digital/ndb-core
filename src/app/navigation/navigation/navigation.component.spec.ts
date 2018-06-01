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

import { NavigationComponent } from './navigation.component';
import { RouterTestingModule } from '@angular/router/testing';
import {SessionService} from '../../session/session.service';
import {NavigationItemsService} from '../navigation-items.service';
import {MenuItem} from '../menu-item';
import {MatDividerModule, MatIconModule, MatListModule} from '@angular/material';

describe('NavigationComponent', () => {
  let component: NavigationComponent;
  let fixture: ComponentFixture<NavigationComponent>;


  let navigationItemsService: NavigationItemsService;
  let sessionService: SessionService;

  beforeEach(async(() => {
    sessionService = new SessionService(null, null, null);
    navigationItemsService = new NavigationItemsService();

    TestBed.configureTestingModule({
      imports: [RouterTestingModule, MatIconModule, MatDividerModule, MatListModule],
      declarations: [NavigationComponent],
      providers: [
        {provide: SessionService, useValue: sessionService},
        {provide: NavigationItemsService, useValue: navigationItemsService},
        ],
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(NavigationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });


   it('should be created', () => {
     expect(component).toBeTruthy();
   });

  it('should load navigation items correctly', () => {
    navigationItemsService.addMenuItem(new MenuItem('test', 'test-icon', []));
    expect(component.menu_main.length).toBe(1);
  });

});
