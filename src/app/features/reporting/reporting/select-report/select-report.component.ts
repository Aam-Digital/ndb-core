import {
  Component,
  EventEmitter,
  Input,
  OnChanges,
  Output,
  SimpleChanges,
} from "@angular/core";
import { ReportConfig } from "../reporting-component-config";

@Component({
  selector: "app-select-report",
  templateUrl: "./select-report.component.html",
  styleUrls: ["./select-report.component.scss"],
})
export class SelectReportComponent implements OnChanges {
  @Input() reports: ReportConfig[];
  @Input() loading: boolean;
  @Input() exportableData: any;
  @Output() calculateClick = new EventEmitter<CalculateReportOptions>();

  selectedReport: ReportConfig;
  fromDate: Date;
  toDate: Date;

  ngOnChanges(changes: SimpleChanges): void {
    if (changes.hasOwnProperty("reports"))
      if (this.reports?.length === 1) {
        this.selectedReport = this.reports[0];
      }
  }
}

interface CalculateReportOptions {
  report: ReportConfig;
  from: Date;
  to: Date;
}
