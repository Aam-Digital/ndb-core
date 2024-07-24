import { Injector } from "@angular/core";
import { ViewTitleComponent } from "../../common-components/view-title/view-title.component";
import { ViewActionsComponent } from "../../common-components/view-actions/view-actions.component";

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

/**
 * Service to share context for components that can be used both
 * in dialogs (wrapped by DialogViewComponent) and
 * in full screen (wrapped by RoutedViewComponent).
 */
export class ViewComponentContext {
  title: ViewTitleComponent;
  actions: ViewActionsComponent;

  constructor(public isDialog: boolean) {}
}
