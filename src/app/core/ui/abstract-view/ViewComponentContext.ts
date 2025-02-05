import { ViewActionsComponent } from "app/core/common-components/view-actions/view-actions.component";
import { ViewTitleComponent } from "app/core/common-components/view-title/view-title.component";

/**
 * Service to share context for components that can be used both
 * in dialogs (wrapped by DialogViewComponent) and
 * in full screen (wrapped by RoutedViewComponent).
 */

export class ViewComponentContext {
  title: ViewTitleComponent;
  actions: ViewActionsComponent;

  constructor(public isDialog: boolean) { }
}
