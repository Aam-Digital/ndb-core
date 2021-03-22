import { Injectable } from "@angular/core";
import { ConfigService } from "../../core/config/config.service";
import { QueryService } from "./query.service";

export interface Disaggregation {
  baseQuery: string;
  aggregations: { label: string; query: string }[];
}

@Injectable({
  providedIn: "root",
})
export class ReportingService {
  public static DISAGGREGATIONS_CONFIG_KEY = "reporting:DISAGGREGATIONS";
  private disaggregations: Disaggregation[] = [];

  constructor(
    private configService: ConfigService,
    private queryService: QueryService
  ) {}

  public loadDisaggregationsFromConfig() {
    this.disaggregations = this.configService.getConfig(
      ReportingService.DISAGGREGATIONS_CONFIG_KEY
    );
  }

  public async calculateDisaggregations(
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
