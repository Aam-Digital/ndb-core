import { Component, ChangeDetectionStrategy } from "@angular/core";

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: "app-todos-dashboard-settings",
  standalone: true,
  imports: [],
  templateUrl: "./todos-dashboard-settings.component.html",
  styleUrls: ["./todos-dashboard-settings.component.scss"],
})
export class TodosDashboardSettingsComponent {}
