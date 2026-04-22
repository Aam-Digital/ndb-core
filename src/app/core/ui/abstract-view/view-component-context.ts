import { ViewActionsComponent } from "app/core/common-components/view-actions/view-actions.component";
import { ViewTitleComponent } from "app/core/common-components/view-title/view-title.component";
import { Subject } from "rxjs";

/**
 * Service to share context for components that can be used both
 * in dialogs (wrapped by DialogViewComponent) and
 * in full screen (wrapped by RoutedViewComponent).
 */
export class ViewComponentContext {
  title: ViewTitleComponent;
  actions: ViewActionsComponent;
  private readonly changes = new Subject<void>();
  readonly changes$ = this.changes.asObservable();

  constructor(public isDialog: boolean) {}

  setTitle(title: ViewTitleComponent) {
    this.title = title;
    this.changes.next();
  }

  setActions(actions: ViewActionsComponent) {
    this.actions = actions;
    this.changes.next();
  }
}
