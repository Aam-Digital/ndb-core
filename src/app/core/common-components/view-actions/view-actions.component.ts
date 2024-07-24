import {
  AfterViewInit,
  Component,
  Optional,
  TemplateRef,
  ViewChild,
} from "@angular/core";
import { NgTemplateOutlet } from "@angular/common";
import { ViewComponentContext } from "../../ui/abstract-view/abstract-view.component";

/**
 * Building block for views, providing a consistent layout to action buttons and menus
 * for both dialog and routed views.
 */
@Component({
  selector: "app-view-actions",
  templateUrl: "./view-actions.component.html",
  imports: [NgTemplateOutlet],
  standalone: true,
})
export class ViewActionsComponent implements AfterViewInit {
  @ViewChild("template") template: TemplateRef<any>;

  constructor(@Optional() protected viewContext: ViewComponentContext) {}

  ngAfterViewInit(): void {
    if (this.viewContext) {
      setTimeout(() => (this.viewContext.actions = this));
    }
  }
}
