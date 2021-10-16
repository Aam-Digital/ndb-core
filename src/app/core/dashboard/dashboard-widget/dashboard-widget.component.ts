import { Component, Input } from "@angular/core";

export type DashboardTheme =
  | "general"
  | "child"
  | "attendance"
  | "note"
  | "class"
  | "school";

@Component({
  selector: "app-dashboard-widget",
  templateUrl: "./dashboard-widget.component.html",
  styleUrls: ["./dashboard-widget.component.scss"],
})
export class DashboardWidgetComponent {
  @Input() subtitle: string;
  @Input() icon: string;
  @Input() theme: DashboardTheme;

  _title: Promise<any>;
  _loading: boolean;

  /** optional tooltip to explain detailed meaning of this widget / statistic */
  @Input() explanation: string;
  @Input() set title(title: PromiseLike<any> | any) {
    if (title && typeof title["then"] === "function") {
      this._loading = true;
      title.then((value) => {
        this._title = value;
        this._loading = false;
      });
    } else {
      this._title = title;
    }
  }
}
