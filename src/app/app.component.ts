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
import { SessionService } from "./core/session/session-service/session.service";
import { SyncState } from "./core/session/session-states/sync-state.enum";
import { ActivatedRoute, Router } from "@angular/router";
import { waitForChangeTo } from "./core/session/session-states/session-utils";
import { environment } from "../environments/environment";
import { DynamicEntityService } from "./core/entity/dynamic-entity.service";

@Component({
  selector: "app-root",
  template: "<app-ui></app-ui>",
})
/**
 * Component as the main entry point for the app.
 * Actual logic and UI structure is defined in other modules.
 */
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
    private router: Router,
    private dynamicEntityService: DynamicEntityService
  ) {
    this.initBasicServices();
  }

  private async initBasicServices() {
    // first register to events

    // Reload config once the database is synced
    this.sessionService.syncState
      .pipe(waitForChangeTo(SyncState.COMPLETED))
      .toPromise()
      .then(() => this.configService.loadConfig(this.entityMapper))
      .then(() =>
        this.router.navigate([], { relativeTo: this.activatedRoute })
      );

    // These functions will be executed whenever a new config is available
    this.configService.configUpdates.subscribe(() => {
      this.routerService.initRouting();
      for (const ctor of this.dynamicEntityService.allConstructors) {
        this.entityConfigService.addConfigAttributes(ctor);
      }
    });

    // If loading the config earlier (in a module constructor or through APP_INITIALIZER) a runtime error occurs.
    // The EntityMapperService needs the SessionServiceProvider which needs the AppConfig to be set up.
    // If the EntityMapperService is requested to early (through DI), the AppConfig is not ready yet.
    // TODO fix this with https://github.com/Aam-Digital/ndb-core/issues/595
    await this.configService.loadConfig(this.entityMapper);

    if (environment.production) {
      this.analyticsService.init();
    }
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
