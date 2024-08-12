import { Injectable } from "@angular/core";
import { SqlReport } from "../report-config";
import { HttpClient } from "@angular/common/http";
import moment from "moment";
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
  report: {
    id: string;
  };
  startDate: string | null;
  endDate: string | null;
  args: { [key: string]: string };
  status: "PENDING" | "RUNNING" | "FINISHED_SUCCESS" | "FINISHED_ERROR";
  outcome: {
    result_hash: string;
  };
}

/**
 * Service that handles management of necessary SQS configurations
 */
@Injectable({
  providedIn: "root",
})
export class SqlReportService {
  static QUERY_PROXY = "/query";

  constructor(private http: HttpClient) {}

  /**
   * Get the combines results of the SQL statements in the report
   * @param report
   * @param from
   * @param to
   * @param forceCalculation Creates a new Calculation, even when an existing calculation is available
   */
  async query(
    report: SqlReport,
    from: Date,
    to: Date,
    forceCalculation = false,
  ): Promise<ReportData> {
    if (forceCalculation) {
      return firstValueFrom(
        this.createReportCalculation(report.getId(), from, to),
      );
    }

    return firstValueFrom(
      this.http
        .get<
          ReportCalculation[]
        >(`${SqlReportService.QUERY_PROXY}/api/v1/reporting/report-calculation/report/${report.getId()}`)
        .pipe(
          switchMap((reportDetails) => {
            let lastReports = this.getLastReports(reportDetails, from, to);

            if (lastReports.length === 0) {
              return this.createReportCalculation(report.getId(), from, to);
            } else {
              return this.fetchReportCalculationData(lastReports[0].id);
            }
          }),
        ),
    );
  }

  private getLastReports(
    reportDetails: ReportCalculation[],
    from: Date,
    to: Date,
  ) {
    return reportDetails
      .filter((value) => {
        return this.filterFromToDates(value, from, to);
      })
      .sort((a: ReportCalculation, b: ReportCalculation) =>
        this.sortByEndDate(a, b),
      );
  }

  private createReportCalculation(
    reportId: string,
    from: Date,
    to: Date,
  ): Observable<ReportData> {
    let params = {};
    if (from && to) {
      params = {
        from: moment(from).format("YYYY-MM-DD"),
        to: moment(to).format("YYYY-MM-DD"),
      };
    }

    return this.http
      .post<{
        id: string;
      }>(
        `${SqlReportService.QUERY_PROXY}/api/v1/reporting/report-calculation/report/${reportId}`,
        {},
        {
          params: params,
        },
      )
      .pipe(
        map((value) => value.id),
        switchMap((id) => lastValueFrom(this.waitForReportData(id))),
        switchMap((value: ReportCalculation) => {
          return this.handleReportCalculationResponse(value);
        }),
      );
  }

  fetchReportCalculation(reportId: string): Observable<ReportCalculation> {
    return this.http.get<ReportCalculation>(
      `${SqlReportService.QUERY_PROXY}/api/v1/reporting/report-calculation/${reportId}`,
    );
  }

  private waitForReportData(
    reportCalculationId: string,
  ): Observable<ReportCalculation> {
    return interval(1500).pipe(
      switchMap(() => this.fetchReportCalculation(reportCalculationId)),
      takeWhile((response) => this.pollCondition(response), true),
    );
  }

  private fetchReportCalculationData(reportId: string): Observable<ReportData> {
    return this.http.get<ReportData>(
      `${SqlReportService.QUERY_PROXY}/api/v1/reporting/report-calculation/${reportId}/data`,
    );
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

  private filterFromToDates(
    value: ReportCalculation,
    from: Date,
    to: Date,
  ): boolean {
    let argFrom = value.args["from"];
    let argTo = value.args["to"];

    if (!argFrom || !argTo) {
      return false;
    }

    return (
      moment(argFrom.toString()).format("YYYY-MM-DD") ==
        moment(from).format("YYYY-MM-DD") &&
      moment(argTo.toString()).format("YYYY-MM-DD") ==
        moment(to).format("YYYY-MM-DD")
    );
  }
}
