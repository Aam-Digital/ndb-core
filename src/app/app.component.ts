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

import { Component, ViewContainerRef } from "@angular/core";
import { AnalyticsService } from "./core/analytics/analytics.service";
import { ConfigService } from "./core/config/config.service";
import { RouterService } from "./core/view/dynamic-routing/router.service";
import { EntityConfigService } from "./core/entity/entity-config.service";
import { SessionService } from "./core/session/session-service/session.service";
import { SyncState } from "./core/session/session-states/sync-state.enum";
import { ActivatedRoute, Router } from "@angular/router";
import { environment } from "../environments/environment";
import { Child } from "./child-dev-project/children/model/child";
import { School } from "./child-dev-project/schools/model/school";
import { DemoDataInitializerService } from "./core/demo-data/demo-data-initializer.service";
import { AppConfig } from "./core/app-config/app-config";
import { LoginState } from "./core/session/session-states/login-state.enum";
import { LoggingService } from "./core/logging/logging.service";
import { EntityRegistry } from "./core/entity/database-entity.decorator";
import { filter } from "rxjs/operators";

/**
 * Component as the main entry point for the app.
 * Actual logic and UI structure is defined in other modules.
 */
@Component({
  selector: "app-root",
  template: "<app-ui></app-ui>",
})
export class AppComponent {
  constructor(
    private viewContainerRef: ViewContainerRef, // need this small hack in order to catch application root view container ref
    private analyticsService: AnalyticsService,
    private configService: ConfigService,
    private routerService: RouterService,
    private entityConfigService: EntityConfigService,
    private sessionService: SessionService,
    private activatedRoute: ActivatedRoute,
    private router: Router,
    private demoDataInitializer: DemoDataInitializerService,
    private entities: EntityRegistry
  ) {
    this.initBasicServices();
  }

  private async initBasicServices() {
    // TODO: remove this with issue #886
    // This needs to be in the app module (as opposed to the dynamic entity service)
    // to prevent circular dependencies
    this.entities.add("Participant", Child);
    this.entities.add("Team", School);

    // first register to events

    // Reload config once the database is synced after someone logged in
    this.sessionService.syncState
      .pipe(filter((state) => state === SyncState.COMPLETED))
      .subscribe(() => this.configService.loadConfig());

    // Re-trigger services that depend on the config when something changes
    let lastConfig: string;
    this.configService.configUpdates.subscribe((config) => {
      console.log("updated config", config);
      this.routerService.initRouting();
      this.entityConfigService.setupEntitiesFromConfig();
      const configString = JSON.stringify(config);
      if (this.sessionService.isLoggedIn() && configString !== lastConfig) {
        this.router.navigate([], { relativeTo: this.activatedRoute });
        lastConfig = configString;
      }
    });

    // update the user context for remote error logging and tracking and load config initially
    this.sessionService.loginState.subscribe((newState) => {
      if (newState === LoginState.LOGGED_IN) {
        const username = this.sessionService.getCurrentUser().name;
        LoggingService.setLoggingContextUser(username);
        this.analyticsService.setUser(username);
        this.configService.loadConfig();
      } else {
        LoggingService.setLoggingContextUser(undefined);
        this.analyticsService.setUser(undefined);
      }
    });

    if (environment.production) {
      this.analyticsService.init();
    }

    if (AppConfig.settings.demo_mode) {
      await this.demoDataInitializer.run();
    }
  }
}
