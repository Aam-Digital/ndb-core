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
import { AppVersionComponent } from './app-version/app-version.component';
import { AlertsModule } from '../alerts/alerts.module';
import { HttpModule } from '@angular/http';
import { LatestChangesService } from './latest-changes.service';
import { SessionModule } from '../session/session.module';
import {MatButtonModule, MatDialogModule} from '@angular/material';
import {ChangelogComponent} from './changelog/changelog.component';

@NgModule({
  imports: [
    CommonModule,
    AlertsModule,
    SessionModule,
    MatDialogModule,
    MatButtonModule,
    HttpModule
  ],
  declarations: [AppVersionComponent, ChangelogComponent],
  exports: [AppVersionComponent],
  providers: [LatestChangesService],
  entryComponents: [ChangelogComponent]
})
export class LatestChangesModule {
}
