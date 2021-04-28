import { Component, Input, OnInit } from "@angular/core";
import { ReportRow } from "../../reporting.service";

@Component({
  selector: "app-report-row",
  templateUrl: "./report-row.component.html",
  styleUrls: ["./report-row.component.scss"],
})
export class ReportRowComponent implements OnInit {
  @Input() rows: ReportRow[] = [];
  @Input() values: string[];

  constructor() {}

  ngOnInit(): void {
    if (this.values) {
      this.rows.forEach((row) => {
        if (!row.header.values) {
          row.header.values = [];
        }
        row.header.values.push(...this.values);
      });
    }
  }
}
