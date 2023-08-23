import { Component, Input } from "@angular/core";
import { IconName } from "@fortawesome/fontawesome-svg-core";
import { NgIf } from "@angular/common";
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
  selector: "app-dashboard-widget",
  templateUrl: "./dashboard-widget.component.html",
  styleUrls: ["./dashboard-widget.component.scss"],
  imports: [
    NgIf,
    MatProgressSpinnerModule,
    FaDynamicIconComponent,
    MatTooltipModule,
  ],
  standalone: true,
})
export class DashboardWidgetComponent {
  @Input() subtitle: string;
  @Input() icon: IconName;
  @Input() theme: DashboardTheme;

  @Input() title: string | number;

  /** optional tooltip to explain detailed meaning of this widget / statistic */
  @Input() explanation: string;
  @Input() headline: string;

  /** Show a loading indicator until data is ready to be shown */
  @Input() loading = false;
}
