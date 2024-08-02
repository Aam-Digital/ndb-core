import { APP_INITIALIZER } from "@angular/core";
import { ConfigService } from "./config.service";
import { RouterService } from "./dynamic-routing/router.service";
import { EntityConfigService } from "../entity/entity-config.service";
import { Router } from "@angular/router";

export const APP_INITIALIZER_PROPAGATE_CONFIG_UPDATES = {
  provide: APP_INITIALIZER,
  useFactory:
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
        const url = location.href.replace(location.origin, "");
        router.navigateByUrl(url, { skipLocationChange: true });
      });
    },
  deps: [ConfigService, RouterService, EntityConfigService, Router],
  multi: true,
};
