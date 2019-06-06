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

import {Component, OnDestroy, OnInit, ViewChild, ViewContainerRef} from '@angular/core';
import { SessionService } from '../../session/session.service';
import {AppConfig} from '../../app-config/app-config';
import {Title} from '@angular/platform-browser';
import {MediaObserver, MediaChange} from '@angular/flex-layout';
import {Subscription} from 'rxjs';

@Component({
  moduleId: module.id,
  selector: 'app-ui',
  templateUrl: './ui.component.html',
  styleUrls: ['./ui.component.css']
})
export class UiComponent implements OnInit, OnDestroy {
  @ViewChild('sideNav', { static: false }) sideNav;
  title: string;
  viewContainerRef: ViewContainerRef;
  watcher: Subscription;
  sideNavMode: string;

  constructor(private _sessionService: SessionService,
              viewContainerRef: ViewContainerRef,
              private titleService: Title,
              mediaObserver: MediaObserver) {
    this.viewContainerRef = viewContainerRef;
    // watch screen width to change sidenav mode
    this.watcher = mediaObserver.media$.subscribe((change: MediaChange) => {
      this.sideNavMode = change.mqAlias === ('xs' || 'sm') ? 'over' : 'side';
    });
  }
  ngOnInit(): void {
    this.title = AppConfig.settings.site_name;
    this.titleService.setTitle(this.title);
  }

  ngOnDestroy() {
    this.watcher.unsubscribe();
  }

  isLoggedIn() {
    return this._sessionService.isLoggedIn();
  }

  logout() {
    this._sessionService.logout();
  }
}
