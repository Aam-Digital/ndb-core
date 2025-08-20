import { inject, provideAppInitializer } from "@angular/core";
import { ConfigService } from "./config.service";
import { RouterService } from "./dynamic-routing/router.service";
import { EntityConfigService } from "../entity/entity-config.service";
import { Router } from "@angular/router";

export const APP_INITIALIZER_PROPAGATE_CONFIG_UPDATES = provideAppInitializer(
  () => {
    const initializerFn = (
      (
        configService: ConfigService,
        routerService: RouterService,
        entityConfigService: EntityConfigService,
        router: Router,
      ) =>
      async () => {
        // Re-trigger services that depend on the config when something changes
        configService.configUpdates.subscribe(() => {
          routerService.initRouting();
          entityConfigService.setupEntitiesFromConfig();
          const url = router.parseUrl(router.url);
          router.navigateByUrl(url, { skipLocationChange: true });
        });
      }
    )(
      inject(ConfigService),
      inject(RouterService),
      inject(EntityConfigService),
      inject(Router),
    );
    return initializerFn();
  },
);
