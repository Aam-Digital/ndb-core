import { DestroyRef, inject, provideAppInitializer } from "@angular/core";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { ConfigService } from "./config.service";
import { RouterService } from "./dynamic-routing/router.service";
import { EntityConfigService } from "../entity/entity-config.service";
import { Router } from "@angular/router";
import { ComponentRegistry } from "../../dynamic-components";
import { Logging } from "../logging/logging.service";

export const APP_INITIALIZER_PROPAGATE_CONFIG_UPDATES = provideAppInitializer(
  () => {
    const configService = inject(ConfigService);
    const routerService = inject(RouterService);
    const entityConfigService = inject(EntityConfigService);
    const router = inject(Router);
    const destroyRef = inject(DestroyRef);
    const componentRegistry = inject(ComponentRegistry);

    // Re-trigger services that depend on the config when something changes
    configService.configUpdates
      .pipe(takeUntilDestroyed(destroyRef)) // especially for tests, this ensures cleanup
      .subscribe(() => {
        routerService.initRouting();
        entityConfigService.setupEntitiesFromConfig();
        const url = router.parseUrl(router.url);
        router.navigateByUrl(url, { skipLocationChange: true });

        // Preload all dynamic component chunks in the background for offline availability
        preloadDynamicComponents(componentRegistry);
      });
  },
);

/**
 * Preload all components registered in the ComponentRegistry so their JS chunks
 * are cached by the service worker and available offline even before the user
 * has visited every page.
 *
 * Runs once in an idle callback to avoid blocking the main thread after login.
 */
let preloadScheduled = false;
function preloadDynamicComponents(registry: ComponentRegistry) {
  if (preloadScheduled) {
    return;
  }
  preloadScheduled = true;

  const load = () => {
    for (const loadFn of registry.values()) {
      loadFn().catch((e) =>
        Logging.debug("Failed to preload dynamic component chunk", e),
      );
    }
  };

  if ("requestIdleCallback" in window) {
    requestIdleCallback(load, { timeout: 10_000 });
  } else {
    setTimeout(load, 3_000);
  }
}
