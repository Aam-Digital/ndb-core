import { Component } from "@angular/core";
import { DataAggregationService } from "../data-aggregation.service";
import {
  getGroupingInformationString,
  GroupByDescription,
} from "../report-row";
import moment from "moment";
import { DatePipe, JsonPipe, NgIf } from "@angular/common";
import { ViewTitleComponent } from "../../../core/common-components/view-title/view-title.component";
import { SelectReportComponent } from "./select-report/select-report.component";
import { ReportRowComponent } from "./report-row/report-row.component";
import { ObjectTableComponent } from "./object-table/object-table.component";
import { DataTransformationService } from "../../../core/export/data-transformation-service/data-transformation.service";
import { EntityMapperService } from "../../../core/entity/entity-mapper/entity-mapper.service";
import { ReportEntity } from "../report-config";
import {
  ReportCalculation,
  SqlReportService,
} from "../sql-report/sql-report.service";
import { RouteTarget } from "../../../route-target";
import { firstValueFrom, lastValueFrom } from "rxjs";
import { map, switchMap } from "rxjs/operators";

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
    DatePipe,
    JsonPipe,
  ],
  standalone: true,
})
export class ReportingComponent {
  reports: ReportEntity[];
  mode: ReportEntity["mode"]; // "reporting" (default), "exporting", "sql"
  loading: boolean;

  reportCalculation: ReportCalculation | null = null;

  data: any[];
  exportableData: any[];

  constructor(
    private dataAggregationService: DataAggregationService,
    private dataTransformationService: DataTransformationService,
    private sqlReportService: SqlReportService,
    private entityMapper: EntityMapperService,
  ) {
    this.entityMapper.loadType(ReportEntity).then((res) => {
      this.reports = res.sort((a, b) => a.title?.localeCompare(b.title));
    });
  }

  async calculateResults(
    selectedReport: ReportEntity,
    fromDate: Date,
    toDate: Date,
  ) {
    this.loading = true;
    this.data = [];

    if (this.reportCalculation) {
      // trigger re-calculation
      await firstValueFrom(
        this.sqlReportService
          .createReportCalculation(selectedReport.getId(), fromDate, toDate)
          .pipe(
            map((value) => value.id),
            switchMap((id) =>
              lastValueFrom(this.sqlReportService.waitForReportData(id)),
            ),
            switchMap((value) =>
              // todo handle FINISHED_ERROR case
              this.sqlReportService.fetchReportCalculationData(value.id),
            ),
          ),
      );
    }

    this.data = await this.getReportResults(selectedReport, fromDate, toDate);
    this.mode = selectedReport.mode ?? "reporting";
    this.exportableData =
      this.mode === "reporting" ? this.flattenReportRows() : this.data;
    this.loading = false;
  }

  private async getReportResults(report: ReportEntity, from: Date, to: Date) {
    switch (report.mode) {
      case "exporting":
        // Add one day because to date is exclusive
        const dayAfterToDate = moment(to).add(1, "day").toDate();
        return this.dataTransformationService.queryAndTransformData(
          report.aggregationDefinitions,
          from,
          dayAfterToDate,
        );
      case "sql":
        let reportData = await this.sqlReportService.query(report, from, to);

        this.reportCalculation = await firstValueFrom(
          this.sqlReportService.fetchReportCalculation(
            reportData.calculation.id,
          ),
        );

        return reportData.data;
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
