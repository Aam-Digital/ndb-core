import { Injectable } from "@angular/core";
import { SqlTables, SqlType, SqsSchema } from "./sqs-schema";
import { EntityRegistry } from "../../../core/entity/database-entity.decorator";
import { EntitySchemaField } from "../../../core/entity/schema/entity-schema-field";
import { NumberDatatype } from "../../../core/basic-datatypes/number/number.datatype";
import { BooleanDatatype } from "../../../core/basic-datatypes/boolean/boolean.datatype";
import { SqlReport } from "../report-config";
import { HttpClient } from "@angular/common/http";
import moment from "moment";
import { EntityMapperService } from "../../../core/entity/entity-mapper/entity-mapper.service";
import { isEqual } from "lodash-es";
import { map, switchMap, takeWhile } from "rxjs/operators";
import { firstValueFrom, interval, lastValueFrom, Observable } from "rxjs";

export interface ReportData {
  id: string;
  report: {
    id: string;
  };
  calculation: {
    id: string;
  };
  data: any[];
}

export interface ReportCalculation {
  id: string;
  startDate: string;
  endDate: string;
  args: Map<String, String>[];
  status: "PENDING" | "RUNNING" | "FINISHED_SUCCESS" | "FINISHED_ERROR";
}

/**
 * Service that handles management of necessary SQS configurations
 */
@Injectable({
  providedIn: "root",
})
export class SqlReportService {
  static QUERY_PROXY = "/query";
  constructor(
    private entities: EntityRegistry,
    private http: HttpClient,
    private entityMapper: EntityMapperService,
  ) {}

  /**
   * Get the combines results of the SQL statements in the report
   * @param report
   * @param from
   * @param to
   */
  async query(report: SqlReport, from: Date, to: Date): Promise<ReportData> {
    await this.updateSchemaIfNecessary();

    return firstValueFrom(
      this.http
        .get<
          ReportCalculation[]
        >(`${SqlReportService.QUERY_PROXY}/api/v1/reporting/report-calculation/report/${report.getId()}`)
        .pipe(
          switchMap((reportDetails) => {
            let lastReports = reportDetails
              .filter((value) => {
                return this.filterFromToDates(value, from, to);
              })
              .sort((a: ReportCalculation, b: ReportCalculation) =>
                this.sortByEndDate(a, b),
              );

            if (lastReports.length === 0) {
              return this.createReportCalculation(
                report.getId(),
                from,
                to,
              ).pipe(
                map((value) => value.id),
                switchMap((id) => lastValueFrom(this.waitForReportData(id))),
                switchMap((value: ReportCalculation) => {
                  return this.handleReportCalculationResponse(value);
                }),
              );
            } else {
              return this.http.get<ReportData>(
                `${SqlReportService.QUERY_PROXY}/api/v1/reporting/report-calculation/${lastReports[0].id}/data`,
              );
            }
          }),
        ),
    );
  }

  createReportCalculation(reportId: string, from: Date, to: Date) {
    return this.http.post<{
      id: string;
    }>(
      `${SqlReportService.QUERY_PROXY}/api/v1/reporting/report-calculation/report/${reportId}`,
      {},
      {
        params: {
          from: moment(from).format("YYYY-MM-DD"),
          to: moment(to).format("YYYY-MM-DD"),
        },
      },
    );
  }

  fetchReportCalculation(reportId: string): Observable<ReportCalculation> {
    return this.http.get<ReportCalculation>(
      `${SqlReportService.QUERY_PROXY}/api/v1/reporting/report-calculation/${reportId}`,
    );
  }

  waitForReportData(reportCalculationId: string) {
    return interval(2000).pipe(
      switchMap(() => this.fetchReportCalculation(reportCalculationId)),
      takeWhile((response) => this.pollCondition(response), true),
    );
  }

  fetchReportCalculationData(reportId: string): Observable<ReportData> {
    return this.http.get<ReportData>(
      `${SqlReportService.QUERY_PROXY}/api/v1/reporting/report-calculation/${reportId}/data`,
    );
  }

  /**
   * Create a valid SQS schema object for all registered entities
   */
  generateSchema(): SqsSchema {
    const tables: SqlTables = {};
    for (const [name, ctr] of this.entities.entries()) {
      tables[name] = {};
      for (const [attr, attrSchema] of ctr.schema) {
        if (attr === "_rev") {
          // skip internal property
          continue;
        }
        tables[name][attr] = this.getSqlType(attrSchema);
      }
    }
    return SqsSchema.create(tables);
  }

  private handleReportCalculationResponse(value: ReportCalculation) {
    switch (value.status) {
      case "FINISHED_SUCCESS":
        return this.fetchReportCalculationData(value.id);
      default:
        throw new Error("Invalid ReportCalculation outcome.");
    }
  }

  private sortByEndDate(a: ReportCalculation, b: ReportCalculation) {
    return new Date(b.endDate).getTime() - new Date(a.endDate).getTime();
  }

  private pollCondition(reportCalculation: ReportCalculation) {
    return (
      reportCalculation.status !== "FINISHED_SUCCESS" &&
      reportCalculation.status !== "FINISHED_ERROR"
    );
  }

  /**
   * Update SQS schema if entities have changed
   * @private
   */
  private async updateSchemaIfNecessary() {
    const existing = await this.entityMapper
      .load(SqsSchema, SqsSchema.SQS_SCHEMA_ID)
      .catch(() => new SqsSchema());

    const newSchema = this.generateSchema();
    if (isEqual(newSchema.sql, existing.sql)) {
      return;
    }

    existing.sql = newSchema.sql;
    await this.entityMapper.save(existing);
  }

  private filterFromToDates(
    value: ReportCalculation,
    from: Date,
    to: Date,
  ): boolean {
    return (
      moment(value.args["from"]).format("YYYY-MM-DD") ==
        moment(from).format("YYYY-MM-DD") &&
      moment(value.args["to"]).format("YYYY-MM-DD") ==
        moment(to).format("YYYY-MM-DD")
    );
  }

  private getSqlType(schema: EntitySchemaField): SqlType {
    switch (schema.dataType) {
      case NumberDatatype.dataType:
      case BooleanDatatype.dataType:
        return "INTEGER";
      default:
        return "TEXT";
    }
  }
}
