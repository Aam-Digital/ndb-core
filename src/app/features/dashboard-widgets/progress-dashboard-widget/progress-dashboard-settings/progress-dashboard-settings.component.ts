import { Component, ChangeDetectionStrategy } from "@angular/core";

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: "app-progress-dashboard-settings",
  imports: [],
  templateUrl: "./progress-dashboard-settings.component.html",
  styleUrls: ["./progress-dashboard-settings.component.scss"],
})
export class ProgressDashboardSettingsComponent {}
