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

import { Component, OnInit } from '@angular/core';
import { MenuItem } from '../menu-item';
import { SessionService } from '../../session/session.service';
import { NavigationItemsService } from '../navigation-items.service';

@Component({
  selector: 'app-navigation',
  templateUrl: './navigation.component.html',
  styleUrls: ['./navigation.component.css']
})
export class NavigationComponent implements OnInit {

  public menu_main: MenuItem[];

  constructor(private _sessionService: SessionService,
              private _navigationItemService: NavigationItemsService) {

    this.menu_main = this._navigationItemService.getMenuItems();
  }

  ngOnInit(): void {
  }

  logout() {
    this._sessionService.logout();
  }

}
