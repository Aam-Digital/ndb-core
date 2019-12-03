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
import { User } from '../user';
import { SessionService } from '../../session/session.service';
import { CloudFileService } from 'app/webdav/cloud-file-service.service';

@Component({
  selector: 'app-user-account',
  templateUrl: './user-account.component.html',
  styleUrls: ['./user-account.component.css']
})
export class UserAccountComponent implements OnInit {

  user: User;

  constructor( private sessionService: SessionService,
               private cloudFileService: CloudFileService ) { }

  ngOnInit() {
    this.user = this.sessionService.getCurrentUser();
  }

  changePassword( pwd , rpwd ) {
    if ( pwd === rpwd ) {
      // TODO: update the password for this remote database user first and deny the password change if that fails
      this.user.setNewPassword( pwd );
      // TODO: Show success message
    } else {
      // TODO: Show error message
    }
  }

  /**
   * Sets the username and password for the cloud-service, provided the login password is correct
   * @param cloudUser username for the cloud-service
   * @param cloudPassword password for the cloud-service
   * @param password password used to login to the main application
   */
  updateCloudService(cloudUser: string, cloudPassword: string, password: string) {
    this.sessionService.getCurrentUser().setBlobPassword(cloudPassword, password);
    this.sessionService.getCurrentUser().cloudUserName = cloudUser;
    this.cloudFileService.connect();
  }
}
