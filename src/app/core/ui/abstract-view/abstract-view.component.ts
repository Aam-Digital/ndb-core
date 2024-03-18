import { Injector } from "@angular/core";

/**
 * Base class for wrapper components like RoutedViewComponent or DialogViewComponent
 */
export abstract class AbstractViewComponent {
  viewContext: ViewComponentContext = new ViewComponentContext(true);
  componentInjector: Injector | undefined;

  constructor(injector: Injector) {
    this.componentInjector = Injector.create({
      providers: [
        { provide: ViewComponentContext, useValue: this.viewContext },
      ],
      parent: injector,
    });
  }
}

/**
 * Implement for components that can be used both in dialogs (wrapped by DialogViewComponent)
 * and in full screen (wrapped by RoutedViewComponent).
 */
export interface ViewComponent {
  viewContext: ViewComponentContext;
}
export class ViewComponentContext {
  constructor(public isDialog: boolean) {}
}
