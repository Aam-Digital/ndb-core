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
import {APP_INITIALIZER, NgModule} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';

import { AppComponent } from './app.component';
import { UiModule } from './ui/ui.module';
import { AppConfigModule } from './app-config/app-config.module';
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
import {AppConfig} from './app-config/app-config';
import {FlexLayoutModule} from '@angular/flex-layout';
import {ServiceWorkerModule} from '@angular/service-worker';
import {environment} from '../environments/environment';
import { MatIconModule, MatIconRegistry } from '@angular/material/icon';
import {AdminModule} from './admin/admin.module';
import {CookieService} from 'ngx-cookie-service';

@NgModule({
  declarations: [
    AppComponent
  ],
  imports: [
    ServiceWorkerModule.register('/ngsw-worker.js', { enabled: environment.production }),
    BrowserModule,
    BrowserAnimationsModule,
    FlexLayoutModule,
    HttpClientModule,
    routing,
    FormsModule,
    AlertsModule,
    DatabaseModule,
    AppConfigModule,
    SessionModule,
    UiModule,
    SyncStatusModule,
    LatestChangesModule,
    NavigationModule,
    UserModule,
    DashboardModule,
    ChildrenModule,
    SchoolsModule,
    AdminModule,
    MatIconModule,
  ],
  providers: [
    AppConfig,
    { provide: APP_INITIALIZER, useFactory: initializeApp, deps: [AppConfig], multi: true },
    MatIconRegistry,
    CookieService,
  ],
  bootstrap: [AppComponent]
})
export class AppModule {
  constructor(private _navigationItemsService: NavigationItemsService,
              public matIconRegistry: MatIconRegistry) {
    matIconRegistry.registerFontClassAlias('fontawesome', 'fa');
    matIconRegistry.setDefaultFontSetClass('fa');

    _navigationItemsService.addMenuItem(new MenuItem('Dashboard', 'home', ['/dashboard']));
    _navigationItemsService.addMenuItem(new MenuItem('Children', 'child', ['/child']));
    _navigationItemsService.addMenuItem(new MenuItem('Schools', 'university', ['/school']));
    _navigationItemsService.addMenuItem(new MenuItem('Notes', 'file-text', ['/note']));
    _navigationItemsService.addMenuItem(new MenuItem('Attendance Register', 'table', ['/attendance']));
    _navigationItemsService.addMenuItem(new MenuItem('Admin', 'wrench', ['/admin'], true));
  }
}

export function initializeApp(appConfig: AppConfig) {
  return () => appConfig.load();
}
