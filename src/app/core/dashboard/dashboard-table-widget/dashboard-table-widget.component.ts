import { Component, Input, OnInit } from "@angular/core";
import { DashboardTheme } from "../dashboard-widget/dashboard-widget.component";

@Component({
  selector: "app-dashboard-table-widget",
  templateUrl: "./dashboard-table-widget.component.html",
  styleUrls: ["./dashboard-table-widget.component.scss"],
})
export class DashboardTableWidgetComponent implements OnInit {
  @Input() subtitle: string;
  @Input() icon: string;
  @Input() theme: DashboardTheme;
  /** optional tooltip to explain detailed meaning of this widget / statistic */
  @Input() explanation: string;
  @Input() data: any[];

  constructor() {}

  ngOnInit(): void {}
}
