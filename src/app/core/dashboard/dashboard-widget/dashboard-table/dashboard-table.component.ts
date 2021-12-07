import { Component, Input } from "@angular/core";
import { MatTableDataSource } from "@angular/material/table";

@Component({
  selector: "app-dashboard-table",
  templateUrl: "./dashboard-table.component.html",
})
export class DashboardTableComponent {
  @Input() dataSource: MatTableDataSource<any>;
  @Input() columnCount: number;

  count(numberOfTimes: number): number[] {
    return Array(numberOfTimes).map((value, idx) => idx);
  }

  intToString(num: number): string {
    return `${num}`;
  }
}
