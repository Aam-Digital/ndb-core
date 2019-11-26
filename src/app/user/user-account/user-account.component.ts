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
import { BlobService } from 'app/webdav/blob-service.service';

@Component({
  selector: 'app-user-account',
  templateUrl: './user-account.component.html',
  styleUrls: ['./user-account.component.css']
})
export class UserAccountComponent implements OnInit {

  user: User;

  constructor( private sessionService: SessionService,
               private blobService: BlobService ) { }

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

  changeBlobPassword(blobPassword, password) {
    this.sessionService.getCurrentUser().setBlobPassword(blobPassword, password);
    this.blobService.connect(this.sessionService.getCurrentUser().blobPasswordDec);
  }
}
