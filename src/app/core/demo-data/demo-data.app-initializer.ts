import {
  APP_INITIALIZER,
  Injector,
  ɵcreateInjector as createInjector,
} from "@angular/core";
import { environment } from "../../../environments/environment";

/**
 * Provide this in the app module to run the demo data generation with lazy-loading
 * (no download of module code if not in demo mode).
 */
export const APP_INITIALIZER_DEMO_DATA = {
  provide: APP_INITIALIZER,
  useFactory: (injector: Injector) => async () => {
    if (environment.demo_mode) {
      const m = await import("./demo-data.module");
      await createInjector(m.DemoDataModule, injector)
        .get(m.DemoDataModule)
        .publishDemoData();
    }
  },
  deps: [Injector],
  multi: true,
};
