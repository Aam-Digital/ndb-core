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

import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpModule } from '@angular/http';

import { AppComponent } from './app.component';
import { UiModule } from './ui/ui.module';
import { ConfigModule } from './config/config.module';
import { DatabaseModule } from './database/database.module';
import { routing } from './app.routing';
import { AlertsModule } from './alerts/alerts.module';
import { SessionModule } from './session/session.module';
import { SyncStatusModule } from './sync-status/sync-status.module';
import { NavigationModule } from './navigation/navigation.module';
import { LatestChangesModule } from './latest-changes/latest-changes.module';
import { UserModule } from './user/user.module';

import { DashboardModule } from './dashboard/dashboard.module';
import { ChildrenModule } from './children/children.module';
import { SchoolsModule } from './schools/schools.module';
import { NavigationItemsService } from './navigation/navigation-items.service';
import { MenuItem } from './navigation/menu-item';

@NgModule({
  declarations: [
    AppComponent
  ],
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    HttpModule,
    routing,
    FormsModule,
    AlertsModule,
    DatabaseModule,
    ConfigModule,
    SessionModule,
    UiModule,
    SyncStatusModule,
    LatestChangesModule,
    NavigationModule,
    UserModule,
    DashboardModule,
    ChildrenModule,
    SchoolsModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule {
  constructor(private _navigationItemsService: NavigationItemsService) {
    _navigationItemsService.addMenuItem(new MenuItem('Dashboard', 'home', ['/dashboard']));
    _navigationItemsService.addMenuItem(new MenuItem('Children', 'face', ['/child']));
    _navigationItemsService.addMenuItem(new MenuItem('Schools', 'school', ['/school']));
  }
}
