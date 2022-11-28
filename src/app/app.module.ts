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
import { FormsModule } from "@angular/forms";
import { HttpClientModule } from "@angular/common/http";

import { AppComponent } from "./app.component";
import { UiModule } from "./core/ui/ui.module";
import { RouteRegistry, routesRegistry, routing } from "./app.routing";
import { AlertsModule } from "./core/alerts/alerts.module";
import { SessionModule } from "./core/session/session.module";
import { SyncStatusModule } from "./core/sync-status/sync-status.module";
import { NavigationModule } from "./core/navigation/navigation.module";
import { LatestChangesModule } from "./core/latest-changes/latest-changes.module";
import { UserModule } from "./core/user/user.module";

import { ProgressDashboardWidgetModule } from "./features/progress-dashboard-widget/progress-dashboard-widget.module";
import { ChildrenModule } from "./child-dev-project/children/children.module";
import { SchoolsModule } from "./child-dev-project/schools/schools.module";
import { ServiceWorkerModule } from "@angular/service-worker";
import { environment } from "../environments/environment";
import { AdminModule } from "./core/admin/admin.module";
import { EntityModule } from "./core/entity/entity.module";
import { MarkdownPageModule } from "./core/markdown-page/markdown-page.module";
import { DemoDataModule } from "./core/demo-data/demo-data.module";
import { LoggingErrorHandler } from "./core/logging/logging-error-handler";
import { DemoChildGenerator } from "./child-dev-project/children/demo-data-generators/demo-child-generator.service";
import { DemoSchoolGenerator } from "./child-dev-project/schools/demo-school-generator.service";
import { DemoChildSchoolRelationGenerator } from "./child-dev-project/children/demo-data-generators/demo-child-school-relation-generator.service";
import { DemoNoteGeneratorService } from "./child-dev-project/notes/demo-data/demo-note-generator.service";
import { DemoAserGeneratorService } from "./child-dev-project/children/aser/demo-aser-generator.service";
import { DemoEducationalMaterialGeneratorService } from "./child-dev-project/children/educational-material/demo-educational-material-generator.service";
import { DemoHealthCheckGeneratorService } from "./child-dev-project/children/health-checkup/demo-data/demo-health-check-generator.service";
import { DemoProgressDashboardWidgetGeneratorService } from "./features/progress-dashboard-widget/demo-progress-dashboard-widget-generator.service";
import { DemoUserGeneratorService } from "./core/user/demo-user-generator.service";
import { ConfirmationDialogModule } from "./core/confirmation-dialog/confirmation-dialog.module";
import { FormDialogModule } from "./core/form-dialog/form-dialog.module";
import { AnalyticsService } from "./core/analytics/analytics.service";
import { ViewModule } from "./core/view/view.module";
import { DashboardModule } from "./core/dashboard/dashboard.module";
import { EntityDetailsModule } from "./core/entity-components/entity-details/entity-details.module";
import { EntitySubrecordModule } from "./core/entity-components/entity-subrecord/entity-subrecord.module";
import { EntityListModule } from "./core/entity-components/entity-list/entity-list.module";
import { AttendanceModule } from "./child-dev-project/attendance/attendance.module";
import { DemoActivityGeneratorService } from "./child-dev-project/attendance/demo-data/demo-activity-generator.service";
import { ConfigurableEnumModule } from "./core/configurable-enum/configurable-enum.module";
import { ConfigModule } from "./core/config/config.module";
import { DemoActivityEventsGeneratorService } from "./child-dev-project/attendance/demo-data/demo-activity-events-generator.service";
import { MatPaginatorIntl } from "@angular/material/paginator";
import { ReportingModule } from "./features/reporting/reporting.module";
import { DashboardShortcutWidgetModule } from "./core/dashboard-shortcut-widget/dashboard-shortcut-widget.module";
import { HistoricalDataModule } from "./features/historical-data/historical-data.module";
import { EntityUtilsModule } from "./core/entity-components/entity-utils/entity-utils.module";
import { DemoHistoricalDataGenerator } from "./features/historical-data/demo-historical-data-generator";
import { TranslatableMatPaginator } from "./core/language/TranslatableMatPaginator";
import { FaIconLibrary } from "@fortawesome/angular-fontawesome";
import { fas } from "@fortawesome/free-solid-svg-icons";
import { far } from "@fortawesome/free-regular-svg-icons";
import { DemoPermissionGeneratorService } from "./core/permissions/demo-permission-generator.service";
import { SupportModule } from "./core/support/support.module";
import { DemoConfigGeneratorService } from "./core/config/demo-config-generator.service";
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
import { ConfigSetupModule } from "./core/config-setup/config-setup.module";

/**
 * Main entry point of the application.
 * Imports required modules and does basic setup.
 * Real functionality should be implemented in separate modules and imported here rather than being part of this module.
 */
@NgModule({
  declarations: [AppComponent],
  imports: [
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
    ViewModule,
    FormsModule,
    ConfirmationDialogModule,
    FormDialogModule,
    AlertsModule,
    EntityModule,
    SessionModule,
    ConfigModule,
    ConfigSetupModule,
    UiModule,
    SyncStatusModule,
    LatestChangesModule,
    NavigationModule,
    UserModule,
    DashboardModule,
    ProgressDashboardWidgetModule,
    ChildrenModule,
    SchoolsModule,
    AdminModule,
    MarkdownPageModule,
    EntitySubrecordModule,
    EntityListModule,
    EntityDetailsModule,
    ConfigurableEnumModule,
    ReportingModule,
    EntityUtilsModule,
    FileModule,
    DemoDataModule.forRoot([
      ...DemoConfigGeneratorService.provider(),
      ...DemoChildGenerator.provider({ count: 120 }),
      ...DemoSchoolGenerator.provider({ count: 8 }),
      ...DemoChildSchoolRelationGenerator.provider(),
      ...DemoActivityGeneratorService.provider(),
      ...DemoActivityEventsGeneratorService.provider({ forNLastYears: 1 }),
      ...DemoNoteGeneratorService.provider({
        minNotesPerChild: 2,
        maxNotesPerChild: 6,
        groupNotes: 3,
      }),
      ...DemoAserGeneratorService.provider(),
      ...DemoEducationalMaterialGeneratorService.provider({
        minCount: 3,
        maxCount: 8,
      }),
      ...DemoHealthCheckGeneratorService.provider(),
      ...DemoProgressDashboardWidgetGeneratorService.provider(),
      ...DemoUserGeneratorService.provider(),
      ...DemoHistoricalDataGenerator.provider({
        minCountAttributes: 2,
        maxCountAttributes: 5,
      }),
      ...DemoPermissionGeneratorService.provider(),
    ]),
    AttendanceModule,
    DashboardShortcutWidgetModule,
    HistoricalDataModule,
    SupportModule,
    DatabaseModule,
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
