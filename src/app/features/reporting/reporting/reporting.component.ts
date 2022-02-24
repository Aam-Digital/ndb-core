import { Component, OnInit } from "@angular/core";
import { ActivatedRoute } from "@angular/router";
import { ReportingService } from "../reporting.service";
import {
  getGroupingInformationString,
  GroupByDescription,
  ReportRow,
} from "../report-row";
import {
  ReportConfig,
  ReportingComponentConfig,
} from "./reporting-component-config";
import moment from "moment";
import { RouteData } from "../../../core/view/dynamic-routing/view-config.interface";

@Component({
  selector: "app-reporting",
  templateUrl: "./reporting.component.html",
  styleUrls: ["./reporting.component.scss"],
})
export class ReportingComponent implements OnInit {
  availableReports: ReportConfig[];

  results: ReportRow[];
  exportableTable: { label: string; result: any }[];

  loading: boolean;

  constructor(
    private activatedRoute: ActivatedRoute,
    private reportingService: ReportingService
  ) {}

  ngOnInit() {
    this.activatedRoute.data.subscribe(
      (data: RouteData<ReportingComponentConfig>) => {
        this.availableReports = data.config?.reports;
      }
    );
  }

  async calculateResults(
    selectedReport: ReportConfig,
    fromDate: Date,
    toDate: Date
  ) {
    this.loading = true;

    // Add one day because to date is exclusive
    const dayAfterToDate = moment(toDate).add(1, "day").toDate();

    this.results = await this.reportingService.calculateReport(
      selectedReport.aggregationDefinitions,
      fromDate,
      dayAfterToDate
    );
    this.exportableTable = this.flattenReportRows();

    this.loading = false;
  }

  private flattenReportRows(
    rows = this.results
  ): { label: string; result: any }[] {
    const tableRows: { label: string; result: any }[] = [];
    rows.forEach((result) => {
      tableRows.push(this.createExportableRow(result.header));
      tableRows.push(...this.flattenReportRows(result.subRows));
    });
    return tableRows;
  }

  private createExportableRow(header: {
    label: string;
    groupedBy: GroupByDescription[];
    result: any;
  }): { label: string; result: any } {
    let resultLabel = header.label;
    const groupByString = getGroupingInformationString(header.groupedBy);
    if (groupByString) {
      resultLabel += " " + groupByString;
    }
    return { label: resultLabel, result: header.result };
  }
}
