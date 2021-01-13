import { APP_INITIALIZER, ModuleWithProviders, NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";
import { DynamicComponentDirective } from "./dynamic-components/dynamic-component.directive";
import { RouterService } from "./dynamic-routing/router.service";

/**
 * Generic components and services to allow assembling the app dynamically from config objects.
 */
@NgModule({
  declarations: [DynamicComponentDirective],
  imports: [CommonModule],
  exports: [DynamicComponentDirective],
})
export class ViewModule {
  static forRoot(): ModuleWithProviders<ViewModule> {
    return {
      ngModule: ViewModule,
      providers: [
        {
          provide: APP_INITIALIZER,
          useFactory: (routerService: RouterService) => {
            return () => routerService.initRouting();
          },
          deps: [RouterService],
          multi: true,
        },
      ],
    };
  }
}
