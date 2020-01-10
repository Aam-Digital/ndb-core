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

import {Component} from '@angular/core';
import {MatDialog, MatDialogRef} from '@angular/material/dialog';
import {DemoDataService} from './demo-data.service';

@Component({
  template: '<p>Generating sample data for this demo ...</p>' +
    '<mat-progress-bar mode="indeterminate"></mat-progress-bar>',
})
export class DemoDataGeneratingProgressDialogComponent {
    static loadDemoDataWithLoadingDialog(dialog: MatDialog) {
      dialog.open(DemoDataGeneratingProgressDialogComponent);
    }

  constructor(
    private demoDataService: DemoDataService,
    public dialogRef: MatDialogRef<DemoDataGeneratingProgressDialogComponent>,
    ) {
    this.dialogRef.disableClose = true;
    this.dialogRef.afterOpened().subscribe(async () => {
      await this.demoDataService.publishDemoData();
      this.dialogRef.close();
    });
  }
}
