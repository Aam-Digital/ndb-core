import { enableProdMode } from "@angular/core";
import { platformBrowserDynamic } from "@angular/platform-browser-dynamic";
import { LoggingService } from "app/core/logging/logging.service";
import { PwaInstallService } from "app/core/pwa-install/pwa-install.service";

import { AppModule } from "./app/app.module";
import { environment } from "./environments/environment";

if (environment.production) {
  enableProdMode();
}
PwaInstallService.registerPWAInstallListener();
// Initialize remote logging
LoggingService.initRemoteLogging({
  dsn: environment.remoteLoggingDsn,
});
platformBrowserDynamic()
  .bootstrapModule(AppModule)
  .catch((err) => console.error(err));
