import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  resource,
  signal,
} from "@angular/core";
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
import { Logging } from "#src/app/core/logging/logging.service";

@RouteTarget("Reporting")
@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
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

  private reportsResource = resource({
    loader: () =>
      this.entityMapper
        .loadType(ReportEntity)
        .then((res) => res.sort((a, b) => a.title?.localeCompare(b.title))),
  });
  reports = this.reportsResource.value;

  currentReport = signal<ReportEntity | undefined>(undefined);
  mode = computed<ReportEntity["mode"]>(
    () => this.currentReport()?.mode ?? "reporting",
  );

  isLoading = signal(false);
  isError = signal(false);
  errorDetails = signal<string | null>(null);

  reportCalculation = signal<ReportCalculation | null>(null);
  localTime = computed<Date | undefined>(() => {
    const endDate = this.reportCalculation()?.endDate;
    if (!endDate) return undefined;
    // Convert the UTC to local timezone (as the date string doesn't include timezone information (e.g. ending with "Z") we have to handle this explicitly
    return moment.utc(endDate).local().toDate();
  });

  data = signal<any[]>([]);
  exportableData = computed<any>(() => {
    const data = this.data();
    if (data.length === 0) return undefined;
    const mode = this.mode();
    const report = this.currentReport();
    switch (mode) {
      case "reporting":
        return this.flattenReportRows(data);
      case "sql":
        return this.getSqlExportableData(data, report);
      default:
        return data;
    }
  });

  dateRangeOptions = signal<DateRangeFilterConfigOption[]>(
    this.loadDateRangeOptionsFromConfig(),
  );

  private loadDateRangeOptionsFromConfig(): DateRangeFilterConfigOption[] {
    const reportViewConfig = this.configService.getConfig<{
      config?: { filters?: DateRangeFilterConfig[] };
    }>("view:report")?.config;
    if (reportViewConfig?.filters?.length) {
      const periodFilter = reportViewConfig.filters.find(
        (f: DateRangeFilterConfig) => f.id === "reportPeriod",
      );
      if (periodFilter && Array.isArray(periodFilter.options)) {
        return periodFilter.options;
      }
    }
    return [];
  }

  async calculateResults(
    selectedReport: ReportEntity,
    fromDate: Date,
    toDate: Date,
  ): Promise<void> {
    this.isError.set(false);
    this.errorDetails.set(null);
    this.isLoading.set(true);
    this.data.set([]);

    const result = await this.getReportResults(
      selectedReport,
      fromDate,
      toDate,
    ).catch((reason: ReportCalculationError | Error) => {
      this.isError.set(true);
      this.errorDetails.set(
        (reason.message ?? reason) +
          " " +
          ((reason as ReportCalculationError)?.reportCalculation
            ?.errorDetails ?? ""),
      );
      Logging.warn(reason.message ?? "Report Calculation Error", reason);
      return { data: [] as any[], calculation: undefined };
    });

    this.currentReport.set(selectedReport);
    this.data.set(result.data);
    this.reportCalculation.set(result.calculation ?? null);
    this.isLoading.set(false);
  }

  private getSqlExportableData(
    data: any[],
    report: ReportEntity | undefined,
  ): any {
    return report?.version == 1
      ? data
      : this.sqlReportService.getCsvforV2(
          this.sqlReportService.flattenData(data),
        );
  }

  private async getReportResults(
    report: ReportEntity,
    from: Date,
    to: Date,
  ): Promise<{ data: any[]; calculation?: ReportCalculation }> {
    switch (report.mode) {
      case "exporting":
        // Add one day because to date is exclusive
        const dayAfterToDate = moment(to).add(1, "day").toDate();
        return {
          data: await this.dataTransformationService.queryAndTransformData(
            report.aggregationDefinitions,
            from,
            dayAfterToDate,
          ),
        };
      case "sql":
        const reportData = await this.sqlReportService.query(
          report,
          from,
          to,
          this.reportCalculation() !== null,
        );
        const calculation = await firstValueFrom(
          this.sqlReportService.fetchReportCalculation(
            reportData.calculation.id,
          ),
        );
        return { data: reportData.data, calculation };
      default:
        return {
          data: await this.dataAggregationService.calculateReport(
            report.aggregationDefinitions,
            from,
            to,
          ),
        };
    }
  }

  private flattenReportRows(rows: any[]): { label: string; result: any }[] {
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
    this.reportCalculation.set(null);
    this.data.set([]);
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
