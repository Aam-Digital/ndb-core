import { Injectable } from "@angular/core";
import { QueryService } from "./query.service";
import { ReportRow } from "./reporting/reporting.component";
import { GroupingService } from "./grouping.service";

export interface Aggregation {
  query: string;
  groupBy?: string[];
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

  constructor(
    private queryService: QueryService,
    private groupingService: GroupingService
  ) {}

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
    data?: any[]
  ): Promise<ReportRow[]> {
    const results: ReportRow[] = [];
    for (const aggregation of aggregations) {
      const result = await this.queryService.queryData(
        this.getQueryWithDates(aggregation.query),
        data
      );
      if (aggregation.groupBy) {
        results.push(...(await this.calculateGroupBy(aggregation, result)));
        continue;
      }

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

  private async calculateGroupBy(
    aggregation: Aggregation,
    data: any[]
  ): Promise<ReportRow[]> {
    const grouping = this.groupingService.groupBy(data, ...aggregation.groupBy);
    console.log("groupings", grouping);
    const results: ReportRow[] = [];
    if (aggregation.label) {
      grouping.forEach((group) => {
        results.push({
          label: this.createGroupingLabel(aggregation.label, group.values),
          result: group.data.length,
        });
      });
    }
    if (aggregation.aggregations) {
      for (const group of grouping) {
        const aggregationResults = await this.calculateAggregations(
          aggregation.aggregations,
          group.data
        );
        aggregationResults.forEach(
          (res) =>
            (res.label = this.createGroupingLabel(res.label, group.values))
        );
        results.push(...aggregationResults);
      }
    }
    return results;
  }

  private createGroupingLabel(label: string, values: any) {
    let groupingLabel = label;
    const valuesArray = Object.values(values);
    if (valuesArray.length > 0) {
      groupingLabel = groupingLabel + " (" + valuesArray.join(", ") + ")";
    }
    return groupingLabel;
  }
}
