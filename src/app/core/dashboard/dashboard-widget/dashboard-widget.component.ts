import { ChangeDetectionStrategy, Component, input } from "@angular/core";
import { IconName } from "@fortawesome/fontawesome-svg-core";
import { MatProgressSpinnerModule } from "@angular/material/progress-spinner";
import { FaDynamicIconComponent } from "../../common-components/fa-dynamic-icon/fa-dynamic-icon.component";
import { MatTooltipModule } from "@angular/material/tooltip";

export type DashboardTheme =
  | "general"
  | "child"
  | "attendance"
  | "note"
  | "class"
  | "school";

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: "app-dashboard-widget",
  templateUrl: "./dashboard-widget.component.html",
  styleUrls: ["./dashboard-widget.component.scss"],
  imports: [MatProgressSpinnerModule, FaDynamicIconComponent, MatTooltipModule],
})
export class DashboardWidgetComponent {
  subtitle = input<string>();
  icon = input<IconName>();
  theme = input<DashboardTheme>();

  title = input<string | number>();

  /** optional tooltip to explain detailed meaning of this widget / statistic */
  explanation = input<string>();
  headline = input<string>();

  /** Show a loading indicator until data is ready to be shown */
  loading = input(false);
}
