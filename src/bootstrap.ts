import { AppConfig } from "./app/core/app-config/app-config";
import { platformBrowserDynamic } from "@angular/platform-browser-dynamic";
import { AppModule } from "./app/app.module";

export function bootstrap(): Promise<void> {
  /**
   * Loading AppConfig before bootstrap process (see {@link https://stackoverflow.com/a/66957293/10713841})
   */
  return AppConfig.load().then(() => {
    // Bootstrap app
    platformBrowserDynamic()
      .bootstrapModule(AppModule)
      .catch((err) => console.error(err));
  });
}
