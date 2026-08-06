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
        preloadDynamicComponents(componentRegistry, destroyRef);
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
function preloadDynamicComponents(
  registry: ComponentRegistry,
  destroyRef: DestroyRef,
) {
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

  const useIdleCallback = "requestIdleCallback" in window;
  const handle = useIdleCallback
    ? requestIdleCallback(load, { timeout: 10_000 })
    : setTimeout(load, 3_000);

  // Cancel if the app (or, in tests, the TestBed injector) goes away first.
  // Otherwise this fires seconds later and dynamically imports every registered
  // component. A unit test is long gone by then, so those imports land after
  // Vitest tore the environment down and fail an unrelated spec file with
  // "EnvironmentTeardownError: Cannot load '/chunk-....js' ...".
  destroyRef.onDestroy(() => {
    if (useIdleCallback) {
      cancelIdleCallback(handle as number);
    } else {
      clearTimeout(handle as ReturnType<typeof setTimeout>);
    }
  });
}
