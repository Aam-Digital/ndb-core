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

import {NgModule} from '@angular/core';
import { CommonModule } from '@angular/common';
import { AppVersionComponent } from './app-version/app-version.component';
import { AlertsModule } from '../alerts/alerts.module';
import { HttpClientModule } from '@angular/common/http';
import { LatestChangesService } from './latest-changes.service';
import { SessionModule } from '../session/session.module';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule } from '@angular/material/dialog';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import {ChangelogComponent} from './changelog/changelog.component';
import {SwUpdate} from '@angular/service-worker';
import {UpdateManagerService} from './update-manager.service';

@NgModule({
  imports: [
    CommonModule,
    AlertsModule,
    SessionModule,
    MatDialogModule,
    MatButtonModule,
    MatSnackBarModule,
    HttpClientModule
  ],
  declarations: [AppVersionComponent, ChangelogComponent],
  exports: [AppVersionComponent],
  providers: [LatestChangesService, UpdateManagerService],
  entryComponents: [ChangelogComponent]
})
export class LatestChangesModule {
  constructor(
    private updates: SwUpdate,
    private latestChangesService: LatestChangesService,
    private updateManagerService: UpdateManagerService) {

    this.latestChangesService.showLatestChangesIfUpdated();

    this.updateManagerService.notifyUserWhenUpdateAvailable();
    this.updateManagerService.regularlyCheckForUpdates();
  }
}
