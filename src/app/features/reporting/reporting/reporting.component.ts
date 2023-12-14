import { Component } from "@angular/core";
import { DataAggregationService } from "../data-aggregation.service";
import {
  getGroupingInformationString,
  GroupByDescription,
} from "../report-row";
import moment from "moment";
import { NgIf } from "@angular/common";
import { ViewTitleComponent } from "../../../core/common-components/view-title/view-title.component";
import { SelectReportComponent } from "./select-report/select-report.component";
import { ReportRowComponent } from "./report-row/report-row.component";
import { ObjectTableComponent } from "./object-table/object-table.component";
import { DataTransformationService } from "../../../core/export/data-transformation-service/data-transformation.service";
import { EntityMapperService } from "../../../core/entity/entity-mapper/entity-mapper.service";
import { ReportConfig, ReportType } from "../report-config";
import { SqlReportService } from "../sql-report/sql-report.service";
import { RouteTarget } from "../../../route-target";

@RouteTarget("Reporting")
@Component({
  selector: "app-reporting",
  templateUrl: "./reporting.component.html",
  styleUrls: ["./reporting.component.scss"],
  imports: [
    NgIf,
    ViewTitleComponent,
    SelectReportComponent,
    ReportRowComponent,
    ObjectTableComponent,
  ],
  standalone: true,
})
export class ReportingComponent {
  reports: ReportType[];
  mode: ReportType["mode"];
  loading: boolean;

  data: any[];
  exportableData: any[];

  constructor(
    private dataAggregationService: DataAggregationService,
    private dataTransformationService: DataTransformationService,
    private sqlReportService: SqlReportService,
    private entityMapper: EntityMapperService,
  ) {
    this.entityMapper
      .loadType(ReportConfig)
      .then((res) => (this.reports = res as ReportType[]));
  }

  async calculateResults(
    selectedReport: ReportType,
    fromDate: Date,
    toDate: Date,
  ) {
    this.loading = true;
    this.data = [];

    // Wait for change detection
    await new Promise((res) => setTimeout(res));

    // Add one day because to date is exclusive
    const dayAfterToDate = moment(toDate).add(1, "day").toDate();
    this.data = await this.getReportResults(
      selectedReport,
      fromDate,
      dayAfterToDate,
    );
    this.mode = selectedReport.mode ?? "reporting";
    this.exportableData =
      this.mode === "reporting" ? this.flattenReportRows() : this.data;
    this.loading = false;
  }

  private getReportResults(report: ReportType, from: Date, to: Date) {
    switch (report.mode) {
      case "exporting":
        return this.dataTransformationService.queryAndTransformData(
          report.aggregationDefinitions,
          from,
          to,
        );
      case "sql":
        // TODO check/ensure "to" date is also exclusive
        return this.sqlReportService.query(report, from, to);
      default:
        return this.dataAggregationService.calculateReport(
          report.aggregationDefinitions,
          from,
          to,
        );
    }
  }

  private flattenReportRows(
    rows = this.data,
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
