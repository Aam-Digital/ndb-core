import { environment } from "./environments/environment";
import { enableProdMode } from "@angular/core";
import { platformBrowserDynamic } from "@angular/platform-browser-dynamic";
import { initEnvironmentConfig } from "./bootstrap-environment";
import { Logging } from "./app/core/logging/logging.service";
import { PwaInstallService } from "./app/core/pwa-install/pwa-install.service";
import { initLanguage } from "./bootstrap-i18n";

if (environment.production) {
  enableProdMode();
}

// Initialize remote logging
Logging.initRemoteLogging({
  dsn: environment.remoteLoggingDsn,
  environment: environment.production ? "production" : "development",
});

// Listening to event as soon as possible
PwaInstallService.registerPWAInstallListener();

bootstrap().catch((reason) => {
  Logging.error("Application Bootstrap failed", reason);
}); // top-level await not possible here yet, therefore wrapped in `bootstrap()` function

async function bootstrap() {
  await initLanguage();

  await initEnvironmentConfig();

  await import("./app/app.module").then((m) =>
    platformBrowserDynamic().bootstrapModule(m.AppModule),
  );
}
