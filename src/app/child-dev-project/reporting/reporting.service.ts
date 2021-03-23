import { Injectable } from "@angular/core";
import { QueryService } from "./query.service";

export interface Disaggregation {
  baseQuery: string;
  aggregations: { label: string; query: string }[];
}

@Injectable({
  providedIn: "root",
})
export class ReportingService {
  private disaggregations: Disaggregation[] = [];

  constructor(
    private queryService: QueryService
  ) {}

  public setDisaggregations(disaggregations: Disaggregation[]) {
    this.disaggregations = disaggregations;
  }

  public async calculateReport(
    from?: Date,
    to?: Date
  ): Promise<{ label: string; result: any }[]> {
    const results: { label: string; result: any }[] = [];
    for (let disaggregation of this.disaggregations) {
      const base = await this.queryService.queryAllData(
        this.getQueryWithDates(disaggregation.baseQuery, from, to)
      );
      for (let aggregation of disaggregation.aggregations) {
        const value = await this.queryService.queryData(
          this.getQueryWithDates(aggregation.query, from, to),
          base
        );
        results.push({ label: aggregation.label, result: value });
      }
    }
    return results;
  }

  private getQueryWithDates(query: string, from?: Date, to?: Date): any[] {
    const resultQuery: any[] = [query];
    if (from) {
      resultQuery.push(from);
    }
    if (to) {
      resultQuery.push(to);
    }
    return resultQuery;
  }
}
