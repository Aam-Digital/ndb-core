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

import {Component, Inject, OnInit} from '@angular/core';
import {Changelog} from '../changelog';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import {isObservable} from 'rxjs';

@Component({
  templateUrl: './changelog.component.html',
  styleUrls: ['./changelog.component.css']
})
export class ChangelogComponent implements OnInit {

  currentChangelog: Changelog;

  constructor(
    public dialogRef: MatDialogRef<ChangelogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any) {

  }

  ngOnInit(): void {
    if (this.data && isObservable(this.data.changelogData)) {
      this.data.changelogData.subscribe(changelog => this.currentChangelog = changelog[0]);
    }
  }


  onCloseClick(): void {
    this.dialogRef.close();
  }
}
