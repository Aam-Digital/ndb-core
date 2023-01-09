import { Component, OnInit } from "@angular/core";
import { ActivatedRoute } from "@angular/router";
import { Aggregation, ReportingService } from "../reporting.service";
import {
  getGroupingInformationString,
  GroupByDescription,
} from "../report-row";
import {
  ReportConfig,
  ReportingComponentConfig,
} from "./reporting-component-config";
import moment from "moment";
import { RouteData } from "../../../core/view/dynamic-routing/view-config.interface";
import { ExportService } from "../../../core/export/export-service/export.service";
import { ExportColumnConfig } from "../../../core/export/export-service/export-column-config";
import { RouteTarget } from "../../../app.routing";
import { NgIf } from "@angular/common";
import { ViewTitleComponent } from "../../../core/entity-components/entity-utils/view-title/view-title.component";
import { SelectReportComponent } from "./select-report/select-report.component";
import { ReportRowComponent } from "./report-row/report-row.component";
import { ObjectTableComponent } from "./object-table/object-table.component";

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
export class ReportingComponent implements OnInit {
  availableReports: ReportConfig[];
  mode: "exporting" | "reporting" = "exporting";
  loading: boolean;

  data: any[];
  exportableData: any[];

  constructor(
    private activatedRoute: ActivatedRoute,
    private reportingService: ReportingService,
    private exportService: ExportService
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

    if (selectedReport.mode === "exporting") {
      await this.createExport(
        selectedReport.aggregationDefinitions as ExportColumnConfig[],
        fromDate,
        dayAfterToDate
      );
      this.mode = "exporting";
    } else {
      await this.createReport(
        selectedReport.aggregationDefinitions as Aggregation[],
        fromDate,
        dayAfterToDate
      );
      this.mode = "reporting";
    }

    this.loading = false;
  }

  private async createExport(
    exportConfig: ExportColumnConfig[],
    fromDate: Date,
    toDate: Date
  ) {
    this.data = await this.exportService.createExport(
      exportConfig,
      fromDate,
      toDate
    );
    this.exportableData = this.data;
  }

  private async createReport(
    aggregationDefinitions: Aggregation[],
    fromDate: Date,
    toDate: Date
  ) {
    this.data = await this.reportingService.calculateReport(
      aggregationDefinitions,
      fromDate,
      toDate
    );
    this.exportableData = this.flattenReportRows();
  }

  private flattenReportRows(
    rows = this.data
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
