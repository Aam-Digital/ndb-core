import { Component, Input } from "@angular/core";
import { IconName } from "@fortawesome/fontawesome-svg-core";
import { isPromise } from "../../../utils/utils";

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
  @Input() icon: IconName;
  @Input() theme: DashboardTheme;

  _title: string | number;
  titleReady = true;

  /** optional tooltip to explain detailed meaning of this widget / statistic */
  @Input() explanation: string;
  @Input() set title(
    title: PromiseLike<string | number> | string | number | undefined
  ) {
    this.titleReady = false;
    if (isPromise(title)) {
      title.then((value) => {
        this._title = value;
        this.titleReady = true;
      });
    } else {
      this._title = title;
      this.titleReady = title !== undefined && title !== null;
    }
  }
  @Input() headline: string;

  /** Show a loading indicator until data is ready to be shown */
  @Input() loading = false;
}
