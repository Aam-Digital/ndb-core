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

import {Component, OnInit} from '@angular/core';
import { EntityMapperService } from '../../entity/entity-mapper.service';
import { SessionStatus } from '../../session/session-status';
import { SessionService } from '../../session/session.service';
import {ChangelogComponent} from '../changelog/changelog.component';
import {MatDialog, MatDialogRef} from '@angular/material';
import {LatestChangesService} from '../latest-changes.service';

@Component({
  selector: 'app-version',
  templateUrl: './app-version.component.html',
  styleUrls: ['./app-version.component.css']
})
export class AppVersionComponent implements OnInit {
  currentVersion: string;

  dialogRef: MatDialogRef<ChangelogComponent>;

  constructor(private _sessionService: SessionService,
              private _entityMapperService: EntityMapperService,
              private changelog: LatestChangesService,
              private dialog: MatDialog) {
  }

  ngOnInit(): void {
    this.changelog.getCurrentVersion().subscribe(version => this.currentVersion = version);

    this._sessionService.onSessionStatusChanged.subscribe(
      (sessionStatus: SessionStatus) => {
        if (sessionStatus === SessionStatus.loggedIn) {
          setTimeout(() => this.checkForUpdatedVersion());
        }
      }
    );

    // do initial check
    setTimeout(() => this.checkForUpdatedVersion());
  }

  checkForUpdatedVersion() {
    if (this._sessionService.currentUser === null) {
      return;
    }

    if (this._sessionService.currentUser.lastUsedVersion !== this.currentVersion) {
      this._sessionService.currentUser.lastUsedVersion = this.currentVersion;
      this._entityMapperService.save(this._sessionService.currentUser);
      this.showLatestChanges();
    }
  }

  public showLatestChanges(): void {
    this.dialogRef = this.dialog.open(ChangelogComponent, {
      width: '400px'
    });
  }
}
