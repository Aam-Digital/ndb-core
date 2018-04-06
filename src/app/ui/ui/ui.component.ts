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

import { Component, OnInit, ViewContainerRef } from '@angular/core';
import { SessionService } from '../../session/session.service';
import { NavigationItemsService } from '../../navigation/navigation-items.service';
import { MenuItem } from '../../navigation/menu-item';

@Component({
  moduleId: module.id,
  selector: 'app-ui',
  templateUrl: './ui.component.html',
  styleUrls: ['./ui.component.css']
})
export class UiComponent implements OnInit {

  title = 'NDB';
  viewContainerRef: ViewContainerRef;

  constructor(private _sessionService: SessionService,
              viewContainerRef: ViewContainerRef,
              private _navigationItemsService: NavigationItemsService) {
    this.viewContainerRef = viewContainerRef;

    const menuItems = [
      new MenuItem('Dashboard', 'home', ['/']),
      new MenuItem('child', 'child', ['/child']),
      new MenuItem('Child-List', 'child-list', ['/child-list'])
    ];
    _navigationItemsService.setMenuItems(menuItems);
  }

  ngOnInit(): void {
  }

  isLoggedIn() {
    return this._sessionService.isLoggedIn();
  }

}
