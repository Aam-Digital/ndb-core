import { Component, Input } from "@angular/core";
import { ReportRow } from "../../reporting.service";

@Component({
  selector: "app-report-row",
  templateUrl: "./report-row.component.html",
  styleUrls: ["./report-row.component.scss"],
})
export class ReportRowComponent {
  @Input() rows: ReportRow[] = [];
}
