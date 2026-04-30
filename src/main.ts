import { environment } from "./environments/environment";
import { enableProdMode } from "@angular/core";
import { platformBrowserDynamic } from "@angular/platform-browser-dynamic";
import { initEnvironmentConfig } from "./bootstrap-environment";
import { Logging } from "./app/core/logging/logging.service";
import { PwaInstallService } from "./app/core/pwa-install/pwa-install.service";
import { initLanguage } from "./bootstrap-i18n";
import { BackupService } from "./app/core/admin/backup/backup.service";

// Register before any async operations so the beforeinstallprompt event is not missed
PwaInstallService.registerPWAInstallListener();

bootstrap().catch((reason) => {
  Logging.error("Application Bootstrap failed", reason);
}); // top-level await not possible here yet, therefore wrapped in `bootstrap()` function

async function bootstrap() {
  // If a reset was requested, delete all databases before PouchDB opens any connections.
  await BackupService.runPendingReset();

  await initEnvironmentConfig();

  if (environment.production) {
    enableProdMode();
  }

  await initLanguage();

  await import("./app/app.module").then((m) =>
    platformBrowserDynamic().bootstrapModule(m.AppModule),
  );
}
