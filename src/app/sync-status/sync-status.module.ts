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

import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SyncStatusComponent } from './sync-status/sync-status.component';
import { DatabaseModule } from '../database/database.module';
import { SessionModule } from '../session/session.module';
import {AlertsModule} from '../alerts/alerts.module';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import {InitialSyncDialogComponent} from './sync-status/initial-sync-dialog.component';

@NgModule({
  imports: [
    CommonModule,
    SessionModule,
    DatabaseModule,
    AlertsModule,
    MatIconModule,
    MatButtonModule,
    MatDialogModule,
    MatProgressBarModule,
  ],
  declarations: [InitialSyncDialogComponent, SyncStatusComponent],
  exports: [SyncStatusComponent],
  providers: [],
  entryComponents: [InitialSyncDialogComponent],
})
export class SyncStatusModule {
}
