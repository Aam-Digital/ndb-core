import {
  APP_INITIALIZER,
  Injector,
  ɵcreateInjector as createInjector,
} from "@angular/core";
import { ConfigService } from "./core/config/config.service";
import { RouterService } from "./core/config/dynamic-routing/router.service";
import { EntityConfigService } from "./core/entity/entity-config.service";
import { Router } from "@angular/router";
import { AnalyticsService } from "./core/analytics/analytics.service";
import { LoginState } from "./core/session/session-states/login-state.enum";
import { LoggingService } from "./core/logging/logging.service";
import { environment } from "../environments/environment";
import { LoginStateSubject } from "./core/session/session-type";
import { CurrentUserSubject } from "./core/user/user";

export const appInitializers = {
  provide: APP_INITIALIZER,
  useFactory:
    (
      injector: Injector,
      configService: ConfigService,
      routerService: RouterService,
      entityConfigService: EntityConfigService,
      router: Router,
      currentUser: CurrentUserSubject,
      analyticsService: AnalyticsService,
      loginState: LoginStateSubject,
    ) =>
    async () => {
      // Re-trigger services that depend on the config when something changes
      configService.configUpdates.subscribe(() => {
        routerService.initRouting();
        entityConfigService.setupEntitiesFromConfig();
        const url = location.href.replace(location.origin, "");
        router.navigateByUrl(url, { skipLocationChange: true });
      });

      // update the user context for remote error logging and tracking and load config initially
      loginState.subscribe((newState) => {
        if (newState === LoginState.LOGGED_IN) {
          const username = currentUser.value.name;
          LoggingService.setLoggingContextUser(username);
          analyticsService.setUser(username);
        } else {
          LoggingService.setLoggingContextUser(undefined);
          analyticsService.setUser(undefined);
        }
      });

      if (environment.production) {
        analyticsService.init();
      }
      if (environment.demo_mode) {
        const m = await import("./core/demo-data/demo-data.module");
        await createInjector(m.DemoDataModule, injector)
          .get(m.DemoDataModule)
          .publishDemoData();
      }
    },
  deps: [
    Injector,
    ConfigService,
    RouterService,
    EntityConfigService,
    Router,
    CurrentUserSubject,
    AnalyticsService,
    LoginStateSubject,
  ],
  multi: true,
};
