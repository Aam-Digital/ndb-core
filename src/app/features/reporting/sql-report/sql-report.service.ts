import { Injectable } from "@angular/core";
import { SqlReport } from "../report-config";
import { HttpClient } from "@angular/common/http";
import moment from "moment";
import { map, switchMap, takeWhile } from "rxjs/operators";
import { firstValueFrom, interval, lastValueFrom, Observable } from "rxjs";

/**
 * represents a TableRow of a SqlReportDataEntry
 */
export interface SqlReportRow {
  key: string;
  value: any[] | object | string | number;
  level: number;
}

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
    ).catch((error) => {
      if (!forceCalculation) {
        return this.query(report, from, to, true);
      } else {
        throw error;
      }
    });
  }

  /**
   * Handle ReportCalculation data and transform into ReportRow.
   *
   * example data:
   * [
   *   [
   *     {
   *       "New students": 6
   *     }
   *   ],
   *   {
   *     "Students gender": [
   *       [
   *         {
   *           "male": 6
   *         }
   *       ],
   *       [
   *         {
   *           "female": 4
   *         }
   *       ]
   *     ]
   *   },
   *   [
   *     {
   *       "count": 3,
   *       "project": "FOO",
   *       "school": "SchoolA"
   *     },
   *     {
   *       "anzahl": 1,
   *       "project": "BAR",
   *       "school": "SchoolB"
   *     }
   *   ]
   * ]
   *
   * @param data raw ReportCalculationData or sub-array
   * @param level each level will add some left-padding to visualize hierarchy
   */
  flattenData(data: any[], level = 0): SqlReportRow[] {
    const result: SqlReportRow[] = [];

    data.forEach((item: any[] | object) => {
      if (Array.isArray(item)) {
        result.push(...this.flattenData(item, level));
      } else if (typeof item === "object") {
        let keys: string[] = Object.keys(item);

        if (keys.length === 1) {
          const key = keys[0];
          const value = item[key];
          if (Array.isArray(value)) {
            result.push({
              key,
              value: this.sumChildValues(value),
              level,
            });

            result.push(...this.flattenData(value, level + 1));
          } else {
            result.push({ key, value, level });
          }
        }

        if (keys.length > 1) {
          // assume a GROUP BY statement
          result.push(...this.mapGroupByRow(item, level));
        }
      }
    });

    return result;
  }

  /**
   * sum of all number values of this item
   *
   * @param value any object array
   */
  private sumChildValues(value: any[]): number {
    return value
      .flatMap((it) => it)
      .flatMap((it) => Object.values(it))
      .filter((valueType) => typeof valueType === "number")
      .reduce((p, n) => p + n);
  }

  /**
   * map a multi value object to a ReportRow.
   * Attention: assumes, that the first key is the numeric value of this block.
   *
   * @param item object to transform
   * @param level current hierarchy level of this row
   * @private
   */
  private mapGroupByRow(item: object, level: number) {
    let keys = Object.keys(item);
    return [
      {
        key: keys
          .slice(1)
          .map((key) => key + ": " + (item[key] || "N/A"))
          .join(", "),
        value: Object.values(item)[0],
        level,
      },
    ];
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

  getCsv(sqlData: SqlReportRow[]): any {
    let deepestLevel: number = sqlData.reduce(
      (previousValue, currentValue) =>
        Math.max(previousValue, currentValue.level),
      0,
    );

    let csv = "";

    csv += "Name" + ",".repeat(deepestLevel + 1) + "Value\n";

    for (const row of sqlData) {
      csv +=
        ",".repeat(row.level) +
        '"' +
        row.key +
        '"' +
        ",".repeat(deepestLevel + 1 - row.level) +
        '"' +
        row.value +
        '"' +
        "\n";
    }

    return csv;
  }
}
