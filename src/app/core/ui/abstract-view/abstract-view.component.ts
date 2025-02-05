import { Injector } from "@angular/core";
import { ViewComponentContext } from "./ViewComponentContext";

/**
 * Base class for wrapper components like RoutedViewComponent or DialogViewComponent
 */
export abstract class AbstractViewComponent {
  viewContext: ViewComponentContext;
  componentInjector: Injector | undefined;

  constructor(injector: Injector, isDialog: boolean) {
    this.viewContext = new ViewComponentContext(isDialog);

    this.componentInjector = Injector.create({
      providers: [
        { provide: ViewComponentContext, useValue: this.viewContext },
      ],
      parent: injector,
    });
  }
}
