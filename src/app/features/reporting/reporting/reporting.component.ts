import { Component, OnInit } from "@angular/core";
import { ActivatedRoute } from "@angular/router";
import { Aggregation, ReportingService } from "../reporting.service";
import {
  getGroupingInformationString,
  GroupByDescription,
  ReportRow,
} from "../report-row";

export interface ReportingComponentConfig {
  aggregationDefinitions?: Aggregation[];
}

@Component({
  selector: "app-reporting",
  templateUrl: "./reporting.component.html",
  styleUrls: ["./reporting.component.scss"],
})
export class ReportingComponent implements OnInit {
  config: ReportingComponentConfig;
  results: ReportRow[];
  fromDate: Date;
  toDate: Date;
  exportableTable: { label: string; result: any }[];

  constructor(
    private activatedRoute: ActivatedRoute,
    private reportingService: ReportingService
  ) {}

  ngOnInit() {
    this.activatedRoute.data.subscribe((config) => (this.config = config));
  }

  async calculateResults() {
    this.reportingService.setAggregations(this.config.aggregationDefinitions);
    this.results = await this.reportingService.calculateReport(
      this.fromDate,
      this.toDate
    );
    this.exportableTable = this.flattenReportRows();
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
