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

import { BrowserModule } from "@angular/platform-browser";
import { BrowserAnimationsModule } from "@angular/platform-browser/animations";
import { ErrorHandler, LOCALE_ID, NgModule } from "@angular/core";
import { HttpClientModule } from "@angular/common/http";

import { AppComponent } from "./app.component";
import { RouteRegistry, routesRegistry, routing } from "./app.routing";
import { SessionModule } from "./core/session/session.module";
import { LatestChangesModule } from "./core/latest-changes/latest-changes.module";

import { ChildrenModule } from "./child-dev-project/children/children.module";
import { ServiceWorkerModule } from "@angular/service-worker";
import { environment } from "../environments/environment";
import { EntityModule } from "./core/entity/entity.module";
import { LoggingErrorHandler } from "./core/logging/logging-error-handler";
import { AnalyticsService } from "./core/analytics/analytics.service";
import { ViewModule } from "./core/view/view.module";
import { ConfigurableEnumModule } from "./core/configurable-enum/configurable-enum.module";
import { MatPaginatorIntl } from "@angular/material/paginator";
import { TranslatableMatPaginator } from "./core/language/TranslatableMatPaginator";
import { FaIconLibrary } from "@fortawesome/angular-fontawesome";
import { fas } from "@fortawesome/free-solid-svg-icons";
import { far } from "@fortawesome/free-regular-svg-icons";
import { DatabaseModule } from "./core/database/database.module";
import { Angulartics2Matomo, Angulartics2Module } from "angulartics2";
import {
  DEFAULT_LANGUAGE,
  LANGUAGE_LOCAL_STORAGE_KEY,
} from "./core/language/language-statics";
import {
  DateAdapter,
  MAT_DATE_FORMATS,
  MatNativeDateModule,
} from "@angular/material/core";
import {
  DATE_FORMATS,
  DateAdapterWithFormatting,
} from "./core/language/date-adapter-with-formatting";
import { FileModule } from "./features/file/file.module";
import { LocationModule } from "./features/location/location.module";
import { LanguageModule } from "./core/language/language.module";
import { PermissionsModule } from "./core/permissions/permissions.module";
import { PwaInstallModule } from "./core/pwa-install/pwa-install.module";
import { UiComponent } from "./core/ui/ui/ui.component";
import { MatSnackBarModule } from "@angular/material/snack-bar";
import { MatDialogModule } from "@angular/material/dialog";

// TODO analyze with webpack bundle analyzer
/**
 * Main entry point of the application.
 * Imports required modules and does basic setup.
 * Real functionality should be implemented in separate modules and imported here rather than being part of this module.
 */
@NgModule({
  declarations: [AppComponent],
  imports: [
    // TODO check how service worker handles lazy loaded components
    ServiceWorkerModule.register("/ngsw-worker.js", {
      enabled: environment.production,
    }),
    Angulartics2Module.forRoot({
      developerMode: !environment.production,
    }),
    BrowserModule,
    BrowserAnimationsModule,
    HttpClientModule,
    routing,

    DatabaseModule,
    LocationModule,
    LanguageModule,
    PermissionsModule,
    PwaInstallModule,
    ViewModule,
    EntityModule,
    SessionModule,
    LatestChangesModule,
    ChildrenModule,
    ConfigurableEnumModule,
    FileModule,
    UiComponent,

    MatSnackBarModule,
    MatDialogModule,
    MatNativeDateModule,
  ],
  providers: [
    { provide: ErrorHandler, useClass: LoggingErrorHandler },
    { provide: MatPaginatorIntl, useValue: TranslatableMatPaginator() },
    { provide: RouteRegistry, useValue: routesRegistry },
    {
      provide: LOCALE_ID,
      useValue:
        localStorage.getItem(LANGUAGE_LOCAL_STORAGE_KEY) ?? DEFAULT_LANGUAGE,
    },
    AnalyticsService,
    Angulartics2Matomo,
    { provide: DateAdapter, useClass: DateAdapterWithFormatting },
    {
      provide: MAT_DATE_FORMATS,
      useValue: DATE_FORMATS,
    },
  ],
  bootstrap: [AppComponent],
})
export class AppModule {
  constructor(icons: FaIconLibrary) {
    icons.addIconPacks(fas, far);
  }
}
