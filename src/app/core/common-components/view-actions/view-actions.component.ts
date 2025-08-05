import {
  AfterViewInit,
  Component,
  TemplateRef,
  ViewChild,
  inject,
} from "@angular/core";
import { NgTemplateOutlet } from "@angular/common";
import { ViewComponentContext } from "../../ui/abstract-view/view-component-context";

/**
 * Building block for views, providing a consistent layout to action buttons and menus
 * for both dialog and routed views.
 */
@Component({
  selector: "app-view-actions",
  templateUrl: "./view-actions.component.html",
  imports: [NgTemplateOutlet],
})
export class ViewActionsComponent implements AfterViewInit {
  protected viewContext = inject(ViewComponentContext, { optional: true });

  @ViewChild("template") template: TemplateRef<any>;

  ngAfterViewInit(): void {
    if (this.viewContext) {
      setTimeout(() => (this.viewContext.actions = this));
    }
  }
}
