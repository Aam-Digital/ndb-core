import { environment } from "./environments/environment";
import { enableProdMode } from "@angular/core";
import { platformBrowserDynamic } from "@angular/platform-browser-dynamic";
import { initEnvironmentConfig } from "./bootstrap-environment";
import { Logging } from "./app/core/logging/logging.service";
import { NamedError } from "./app/core/logging/reported-errors";
import { registerPWAInstallListener } from "./bootstrap-pwa-install";
import { initLanguage } from "./bootstrap-i18n";
import { runPendingReset } from "./bootstrap-reset";

// Register before any async operations so the beforeinstallprompt event is not missed
registerPWAInstallListener();

bootstrap().catch((reason) => {
  // a named error, so that a bootstrap failure keeps an issue of its own even
  // when caused by a network failure (e.g. a code chunk that could not be loaded)
  Logging.error(
    new NamedError("AppBootstrapError", "Application Bootstrap failed", {
      cause: reason,
    }),
  );
}); // top-level await not possible here yet, therefore wrapped in `bootstrap()` function

async function bootstrap() {
  // If a reset was requested, delete all databases before PouchDB opens any connections.
  await runPendingReset();

  await initEnvironmentConfig();

  if (environment.production) {
    enableProdMode();
  }

  await initLanguage();

  await import("./app/app.module").then((m) =>
    platformBrowserDynamic().bootstrapModule(m.AppModule),
  );
}
