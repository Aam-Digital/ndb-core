import { Injectable } from "@angular/core";
import { QueryService } from "./query.service";
import { ReportRow } from "./reporting/reporting.component";

export interface Aggregation {
  query: string;
  label?: string;
  aggregations?: Aggregation[];
}

@Injectable({
  providedIn: "root",
})
export class ReportingService {
  private aggregations: Aggregation[] = [];
  private fromDate: Date;
  private toDate: Date;

  constructor(private queryService: QueryService) {}

  public setAggregations(aggregations: Aggregation[]) {
    this.aggregations = aggregations;
  }

  public calculateReport(from?: Date, to?: Date): Promise<ReportRow[]> {
    this.queryService.loadData();
    this.fromDate = from;
    this.toDate = to;
    return this.calculateAggregations(this.aggregations);
  }

  private async calculateAggregations(
    aggregations: Aggregation[],
    data?: any
  ): Promise<ReportRow[]> {
    const results: ReportRow[] = [];
    for (let aggregation of aggregations) {
      const result = await this.queryService.queryData(
        this.getQueryWithDates(aggregation.query),
        data
      );
      if (aggregation.label) {
        results.push({ label: aggregation.label, result: result });
      }
      if (aggregation.aggregations) {
        results.push(
          ...(await this.calculateAggregations(
            aggregation.aggregations,
            result
          ))
        );
      }
    }
    return results;
  }

  private getQueryWithDates(query: string): any[] {
    const resultQuery: any[] = [query];
    if (this.fromDate) {
      resultQuery.push(this.fromDate);
    }
    if (this.toDate) {
      resultQuery.push(this.toDate);
    }
    return resultQuery;
  }
}
