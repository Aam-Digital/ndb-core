import { Component, Input, OnInit } from "@angular/core";
import { MatTableDataSource } from "@angular/material/table";

@Component({
  selector: "app-dashboard-table",
  templateUrl: "./dashboard-table.component.html",
  styleUrls: ["./dashboard-table.component.scss"],
})
export class DashboardTableComponent implements OnInit {
  @Input() dataSource: MatTableDataSource<any>;
  @Input() columnCount: number;

  constructor() {}

  count(numberOfTimes: number): number[] {
    return Array(numberOfTimes).map((value, idx) => idx);
  }

  intToString(num: number): string {
    return `${num}`;
  }

  ngOnInit(): void {}
}
