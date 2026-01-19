import { Component, inject } from "@angular/core";
import { DataAggregationService } from "../data-aggregation.service";
import {
  getGroupingInformationString,
  GroupByDescription,
} from "../report-row";
import moment from "moment";
import { JsonPipe } from "@angular/common";
import { CustomDatePipe } from "../../../core/basic-datatypes/date/custom-date.pipe";
import { ViewTitleComponent } from "../../../core/common-components/view-title/view-title.component";
import { SelectReportComponent } from "./select-report/select-report.component";
import { ReportRowComponent } from "./report-row/report-row.component";
import { ObjectTableComponent } from "./object-table/object-table.component";
import { DataTransformationService } from "../../../core/export/data-transformation-service/data-transformation.service";
import { EntityMapperService } from "../../../core/entity/entity-mapper/entity-mapper.service";
import { ReportEntity } from "../report-config";
import {
  ReportCalculation,
  ReportCalculationError,
  SqlReportService,
} from "../sql-report/sql-report.service";
import { RouteTarget } from "../../../route-target";
import { firstValueFrom } from "rxjs";
import { SqlV2TableComponent } from "./sql-v2-table/sql-v2-table.component";
import { ConfigService } from "app/core/config/config.service";
import {
  DateRangeFilterConfig,
  DateRangeFilterConfigOption,
} from "app/core/entity-list/EntityListConfig";
import { FaIconComponent } from "@fortawesome/angular-fontawesome";
import { ViewActionsComponent } from "#src/app/core/common-components/view-actions/view-actions.component";
import { MatIconButton } from "@angular/material/button";
import { MatMenu, MatMenuItem, MatMenuTrigger } from "@angular/material/menu";
import { Angulartics2Module } from "angulartics2";
import { DisableEntityOperationDirective } from "#src/app/core/permissions/permission-directive/disable-entity-operation.directive";
import { JsonEditorService } from "#src/app/core/admin/json-editor/json-editor.service";
import { MatTooltip } from "@angular/material/tooltip";

@RouteTarget("Reporting")
@Component({
  selector: "app-reporting",
  templateUrl: "./reporting.component.html",
  styleUrls: ["./reporting.component.scss"],
  imports: [
    ViewTitleComponent,
    SelectReportComponent,
    ReportRowComponent,
    ObjectTableComponent,
    CustomDatePipe,
    JsonPipe,
    SqlV2TableComponent,
    FaIconComponent,
    ViewActionsComponent,
    MatIconButton,
    MatMenuTrigger,
    Angulartics2Module,
    DisableEntityOperationDirective,
    MatMenu,
    MatMenuItem,
    MatTooltip,
  ],
})
export class ReportingComponent {
  private dataAggregationService = inject(DataAggregationService);
  private dataTransformationService = inject(DataTransformationService);
  private sqlReportService = inject(SqlReportService);
  private entityMapper = inject(EntityMapperService);
  private readonly jsonEditorService = inject(JsonEditorService);
  private configService = inject(ConfigService);

  reports: ReportEntity[];
  mode: ReportEntity["mode"]; // "reporting" (default), "exporting", "sql"

  currentReport: ReportEntity;

  isLoading: boolean;
  isError: boolean = false;
  errorDetails: string | null = null;
  localTime: Date;

  reportCalculation: ReportCalculation | null = null;

  data: any[];
  exportableData: any;
  dateRangeOptions: DateRangeFilterConfigOption[] = [];

  constructor() {
    this.entityMapper.loadType(ReportEntity).then((res) => {
      this.reports = res.sort((a, b) => a.title?.localeCompare(b.title));
      this.loadDateRangeOptionsFromConfig();
    });
  }

  private loadDateRangeOptionsFromConfig() {
    const reportViewConfig = this.configService.getConfig<{
      config?: { filters?: DateRangeFilterConfig[] };
    }>("view:report")?.config;
    if (reportViewConfig?.filters?.length) {
      const periodFilter = reportViewConfig.filters.find(
        (f: DateRangeFilterConfig) => f.id === "reportPeriod",
      );
      if (periodFilter && Array.isArray(periodFilter.options)) {
        this.dateRangeOptions = periodFilter.options;
      }
    }
  }

  async calculateResults(
    selectedReport: ReportEntity,
    fromDate: Date,
    toDate: Date,
  ): Promise<void> {
    this.isError = false;
    this.errorDetails = null;
    this.isLoading = true;
    this.data = [];

    this.data = await this.getReportResults(
      selectedReport,
      fromDate,
      toDate,
    ).catch((reason: ReportCalculationError | Error) => {
      this.isLoading = false;
      this.isError = true;
      this.errorDetails =
        (reason.message ?? reason) +
        " " +
        ((reason as ReportCalculationError)?.reportCalculation?.errorDetails ??
          "");
      return Promise.reject(reason.message || reason);
    });

    this.currentReport = selectedReport;

    this.mode = selectedReport.mode ?? "reporting";

    switch (this.mode) {
      case "reporting":
        this.exportableData = this.flattenReportRows();
        break;
      case "sql":
        this.exportableData = this.getSqlExportableData();
        break;
      default:
        this.exportableData = this.data;
    }

    this.isLoading = false;
  }

  private getSqlExportableData() {
    return this.currentReport.version == 1
      ? this.data
      : this.sqlReportService.getCsvforV2(
          this.sqlReportService.flattenData(this.data),
        );
  }

  private async getReportResults(
    report: ReportEntity,
    from: Date,
    to: Date,
  ): Promise<any[]> {
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
        let reportData = await this.sqlReportService.query(
          report,
          from,
          to,
          this.reportCalculation !== null,
        );
        this.reportCalculation = await firstValueFrom(
          this.sqlReportService.fetchReportCalculation(
            reportData.calculation.id,
          ),
        );
        if (this.reportCalculation?.endDate) {
          // Convert the UTC to local timezone (as the date string doesn't include timezone information (e.g. ending with "Z") we have to handle this explicitly
          this.localTime = moment
            .utc(this.reportCalculation.endDate)
            .local()
            .toDate();
        }
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

  onReportCriteriaChange() {
    this.reportCalculation = null;
    this.data = [];
  }

  selectedReportChanged(selectedReport: ReportEntity) {
    this.currentReport = selectedReport;
  }

  editReportConfig(report: ReportEntity) {
    const reportDetails: Partial<ReportEntity> = {
      title: report.title,
      mode: report.mode,
    };
    // explicitly map the relevant properties
    if (report.version) reportDetails.version = report.version;
    if (report.reportDefinition)
      reportDetails.reportDefinition = report.reportDefinition;
    if (report.aggregationDefinition)
      reportDetails.aggregationDefinition = report.aggregationDefinition;
    if (report.aggregationDefinitions)
      reportDetails.aggregationDefinitions = report.aggregationDefinitions;

    this.jsonEditorService
      .openJsonEditorDialog(reportDetails)
      .subscribe(async (result) => {
        if (!result) {
          return;
        }

        await this.entityMapper.save(Object.assign(report, result));
      });
  }
}
