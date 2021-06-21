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

import { Component, OnInit, ViewContainerRef } from "@angular/core";
import { AppConfig } from "./core/app-config/app-config";
import { MatDialog } from "@angular/material/dialog";
import { DemoDataGeneratingProgressDialogComponent } from "./core/demo-data/demo-data-generating-progress-dialog.component";
import { AnalyticsService } from "./core/analytics/analytics.service";
import { EntityMapperService } from "./core/entity/entity-mapper.service";
import { ConfigService } from "./core/config/config.service";
import { RouterService } from "./core/view/dynamic-routing/router.service";
import { EntityConfigService } from "./core/entity/entity-config.service";
import { Child } from "./child-dev-project/children/model/child";
import { SessionService } from "./core/session/session-service/session.service";
import { SyncState } from "./core/session/session-states/sync-state.enum";
import { ActivatedRoute, Router } from "@angular/router";
import { RecurringActivity } from "./child-dev-project/attendance/model/recurring-activity";
import { School } from "./child-dev-project/schools/model/school";
import { HistoricalEntityData } from "./features/historical-data/historical-entity-data";
import { waitForChangeTo } from "./core/session/session-service/session-utils";

/**
 * Component as the main entry point for the app.
 * Actual logic and UI structure is defined in other modules.
 */
@Component({
  selector: "app-root",
  template: "<app-ui></app-ui>",
})
export class AppComponent implements OnInit {
  constructor(
    private viewContainerRef: ViewContainerRef, // need this small hack in order to catch application root view container ref
    private dialog: MatDialog,
    private analyticsService: AnalyticsService,
    private configService: ConfigService,
    private entityMapper: EntityMapperService,
    private routerService: RouterService,
    private entityConfigService: EntityConfigService,
    private sessionService: SessionService,
    private activatedRoute: ActivatedRoute,
    private router: Router
  ) {
    // If loading the config earlier (in a module constructor or through APP_INITIALIZER) a runtime error occurs.
    // The EntityMapperService needs the SessionServiceProvider which needs the AppConfig to be set up.
    // If the EntityMapperService is requested to early (through DI), the AppConfig is not ready yet.
    // TODO fix this with https://github.com/Aam-Digital/ndb-core/issues/595
    configService.loadConfig(entityMapper);
    // Reload config once the database is synced
    sessionService.syncStateStream
      .pipe(waitForChangeTo(SyncState.COMPLETED, true))
      .toPromise()
      .then(() => configService.loadConfig(entityMapper))
      .then(() => router.navigate([], { relativeTo: this.activatedRoute }));
    // These functions will be executed whenever a new config is available
    configService.configUpdated.subscribe(() => {
      routerService.initRouting();
      entityConfigService.addConfigAttributes(Child);
      entityConfigService.addConfigAttributes(School);
      entityConfigService.addConfigAttributes(RecurringActivity);
      entityConfigService.addConfigAttributes(HistoricalEntityData);
    });
    this.analyticsService.init();
  }

  ngOnInit() {
    this.loadDemoData();
  }

  // TODO: move loading of demo data to a more suitable place
  private loadDemoData() {
    if (AppConfig.settings.demo_mode) {
      DemoDataGeneratingProgressDialogComponent.loadDemoDataWithLoadingDialog(
        this.dialog
      );
    }
  }
}
