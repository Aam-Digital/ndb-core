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
import { LOCALE_ID, NgModule } from "@angular/core";
import {
  provideHttpClient,
  withInterceptorsFromDi,
} from "@angular/common/http";

import { AppComponent } from "./app.component";
import { allRoutes } from "./app.routing";
import { SessionModule } from "./core/session/session.module";
import { LatestChangesModule } from "./core/ui/latest-changes/latest-changes.module";

import { ChildrenModule } from "./child-dev-project/children/children.module";
import {
  ServiceWorkerModule,
  SwRegistrationOptions,
} from "@angular/service-worker";
import { environment } from "../environments/environment";
import { firebaseConfig } from "../environments/environment";
import { AnalyticsService } from "./core/analytics/analytics.service";
import { ConfigurableEnumModule } from "./core/basic-datatypes/configurable-enum/configurable-enum.module";
import { FaIconLibrary } from "@fortawesome/angular-fontawesome";
import { fas } from "@fortawesome/free-solid-svg-icons";
import { far } from "@fortawesome/free-regular-svg-icons";
import { DatabaseModule } from "./core/database/database.module";
import { Angulartics2Matomo, Angulartics2Module } from "angulartics2";
import {
  DEFAULT_LANGUAGE,
  LANGUAGE_LOCAL_STORAGE_KEY,
} from "./core/language/language-statics";
import { DateAdapter, MAT_DATE_FORMATS } from "@angular/material/core";
import {
  DATE_FORMATS,
  DateAdapterWithFormatting,
} from "./core/language/date-adapter-with-formatting";
import { FileModule } from "./features/file/file.module";
import { LocationModule } from "./features/location/location.module";
import { LanguageModule } from "./core/language/language.module";
import { PermissionsModule } from "./core/permissions/permissions.module";
import { UiComponent } from "./core/ui/ui/ui.component";
import { MatSnackBarModule } from "@angular/material/snack-bar";
import { MatDialogModule } from "@angular/material/dialog";
import { componentRegistry, ComponentRegistry } from "./dynamic-components";
import { CoreModule } from "./core/core.module";
import {
  entityRegistry,
  EntityRegistry,
} from "./core/entity/database-entity.decorator";
import {
  LOCATION_TOKEN,
  NAVIGATOR_TOKEN,
  WINDOW_TOKEN,
} from "./utils/di-tokens";
import { AttendanceModule } from "./child-dev-project/attendance/attendance.module";
import { NotesModule } from "./child-dev-project/notes/notes.module";
import { MatchingEntitiesModule } from "./features/matching-entities/matching-entities.module";
import { ProgressDashboardWidgetModule } from "./features/dashboard-widgets/progress-dashboard-widget/progress-dashboard-widget.module";
import { ReportingModule } from "./features/reporting/reporting.module";
import { RouterModule } from "@angular/router";
import { TodosModule } from "./features/todos/todos.module";
import { waitForChangeTo } from "./core/session/session-states/session-utils";
import { LoginState } from "./core/session/session-states/login-state.enum";
import { APP_INITIALIZER_PROPAGATE_CONFIG_UPDATES } from "./core/config/config.app-initializer";
import { ImportModule } from "./core/import/import.module";
import { ShortcutDashboardWidgetModule } from "./features/dashboard-widgets/shortcut-dashboard-widget/shortcut-dashboard-widget.module";
import { EntityCountDashboardWidgetModule } from "./features/dashboard-widgets/entity-count-dashboard-widget/entity-count-dashboard-widget.module";
import { BirthdayDashboardWidgetModule } from "./features/dashboard-widgets/birthday-dashboard-widget/birthday-dashboard-widget.module";
import { MarkdownPageModule } from "./features/markdown-page/markdown-page.module";
import { LoginStateSubject } from "./core/session/session-type";
import { AdminModule } from "./core/admin/admin.module";
import { Logging } from "./core/logging/logging.service";
import { APP_INITIALIZER_DEMO_DATA } from "./core/demo-data/demo-data.app-initializer";
import { TemplateExportModule } from "./features/template-export/template-export.module";
import { initializeApp } from "firebase/app";
import { PublicFormModule } from "./features/public-form/public-form.module";

/**
 * Main entry point of the application.
 * Imports required modules and does basic setup.
 * Real functionality should be implemented in separate modules and imported here rather than being part of this module.
 */
@NgModule({
  declarations: [AppComponent],
  bootstrap: [AppComponent],
  imports: [
    // Global Angular modules
    ServiceWorkerModule.register("ngsw-worker.js"),
    Angulartics2Module.forRoot({
      developerMode: !environment.production,
    }),
    BrowserModule,
    BrowserAnimationsModule,
    RouterModule.forRoot(allRoutes),
    // Core modules
    CoreModule,
    ConfigurableEnumModule,
    DatabaseModule,
    LanguageModule,
    LatestChangesModule,
    PermissionsModule,
    SessionModule,
    // child-dev modules
    AttendanceModule,
    ChildrenModule,
    NotesModule,
    // feature module
    ImportModule,
    FileModule,
    MarkdownPageModule,
    LocationModule,
    MatchingEntitiesModule,
    ProgressDashboardWidgetModule,
    ShortcutDashboardWidgetModule,
    EntityCountDashboardWidgetModule,
    BirthdayDashboardWidgetModule,
    ReportingModule,
    TodosModule,
    AdminModule,
    TemplateExportModule,
    PublicFormModule,
    // top level component
    UiComponent,
    // Global Angular Material modules
    MatSnackBarModule,
    MatDialogModule,
  ],
  providers: [
    ...Logging.getAngularTracingProviders(),
    { provide: ComponentRegistry, useValue: componentRegistry },
    { provide: EntityRegistry, useValue: entityRegistry },
    { provide: WINDOW_TOKEN, useValue: window },
    { provide: LOCATION_TOKEN, useValue: window.location },
    { provide: NAVIGATOR_TOKEN, useValue: navigator },
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
    {
      provide: SwRegistrationOptions,
      useFactory: (loginState: LoginStateSubject) => ({
        enabled: environment.production,
        registrationStrategy: () =>
          loginState.pipe(waitForChangeTo(LoginState.LOGGED_IN)),
      }),
      deps: [LoginStateSubject],
    },
    APP_INITIALIZER_PROPAGATE_CONFIG_UPDATES,
    APP_INITIALIZER_DEMO_DATA,
    provideHttpClient(withInterceptorsFromDi()),
  ],
})
export class AppModule {
  constructor(icons: FaIconLibrary) {
    // Initialize the Firebase application component
    initializeApp(firebaseConfig);
    icons.addIconPacks(fas, far);
  }
}
