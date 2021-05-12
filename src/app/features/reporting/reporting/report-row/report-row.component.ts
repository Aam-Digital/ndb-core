import { Component, Input } from "@angular/core";
import { getGroupingInformationString, ReportRow } from "../../report-row";

@Component({
  selector: "app-report-row",
  templateUrl: "./report-row.component.html",
  styleUrls: ["./report-row.component.scss"],
})
export class ReportRowComponent {
  @Input() rows: ReportRow[] = [];

  getGroupedByString = getGroupingInformationString;
}
