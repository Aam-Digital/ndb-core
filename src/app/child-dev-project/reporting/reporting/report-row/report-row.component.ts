import { Component, Input, OnInit } from "@angular/core";
import { ReportRow } from "../../reporting.service";

@Component({
  selector: "app-report-row",
  templateUrl: "./report-row.component.html",
  styleUrls: ["./report-row.component.scss"],
})
export class ReportRowComponent implements OnInit {
  @Input() rows: ReportRow[] = [];

  constructor() {}

  ngOnInit(): void {
    console.log("rows", this.rows);
  }
}
