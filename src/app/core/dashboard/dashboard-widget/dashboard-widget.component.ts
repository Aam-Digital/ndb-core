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
  @Input() title: string | number;
  @Input() subtitle: string;
  @Input() icon: string;
  @Input() theme: DashboardTheme;
  @Input() isLoading: boolean;

  /** optional tooltip to explain detailed meaning of this widget / statistic */
  @Input() explanation: string;
}
