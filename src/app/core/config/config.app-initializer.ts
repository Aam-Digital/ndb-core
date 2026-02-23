import { DestroyRef, inject, provideAppInitializer } from "@angular/core";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { ConfigService } from "./config.service";
import { RouterService } from "./dynamic-routing/router.service";
import { EntityConfigService } from "../entity/entity-config.service";
import { Router } from "@angular/router";

export const APP_INITIALIZER_PROPAGATE_CONFIG_UPDATES = provideAppInitializer(
  () => {
    const configService = inject(ConfigService);
    const routerService = inject(RouterService);
    const entityConfigService = inject(EntityConfigService);
    const router = inject(Router);
    const destroyRef = inject(DestroyRef);

    // Re-trigger services that depend on the config when something changes
    configService.configUpdates
      .pipe(takeUntilDestroyed(destroyRef))
      .subscribe(() => {
        routerService.initRouting();
        entityConfigService.setupEntitiesFromConfig();
        const url = router.parseUrl(router.url);
        router.navigateByUrl(url, { skipLocationChange: true });
      });
  },
);
