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

import { Component, OnInit, ViewChild } from '@angular/core';
import { EntityMapperService } from '../../entity/entity-mapper.service';
import { AlertService } from '../../alerts/alert.service';
import { ConfigService } from '../../config/config.service';
import { LatestChangesService } from '../latest-changes.service';
import { ModalDirective } from 'ngx-bootstrap';
import { Changelog } from '../changelog';
import { SessionStatus } from '../../session/session-status';
import { SessionService } from '../../session/session.service';

@Component({
  selector: 'app-latest-changes',
  templateUrl: './latest-changes.component.html',
  styleUrls: ['./latest-changes.component.css']
})
export class LatestChangesComponent implements OnInit {

  currentChangelog: Changelog;
  currentVersion: string;

  @ViewChild('latestChangesModal') public latestChangesModal: ModalDirective;

  constructor(private _sessionService: SessionService,
              private _latestChangesService: LatestChangesService,
              private _configService: ConfigService,
              private _alertService: AlertService,
              private _entityMapperService: EntityMapperService) {

    this.currentVersion = this._configService.version;

    _latestChangesService.getChangelog().subscribe(
      changelog => this.currentChangelog = changelog[0],
      error => _alertService.addDanger(error)
    );

    const self = this;
    this._sessionService.onSessionStatusChanged.subscribe(
      function sessionStatus(sessionStatus: SessionStatus) {
        if (sessionStatus === SessionStatus.loggedIn) {
          if (self._sessionService.currentUser.lastUsedVersion !== self.currentVersion) {
            self._sessionService.currentUser.lastUsedVersion = self.currentVersion;
            self._entityMapperService.save(self._sessionService.currentUser);
            self.showLatestChanges();
          }
        }
      }
    );
  }

  ngOnInit(): void {
  }

  public showLatestChanges(): void {
    this.latestChangesModal.show();
  }
}
