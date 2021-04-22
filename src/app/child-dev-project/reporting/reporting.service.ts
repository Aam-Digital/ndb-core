import { Injectable } from "@angular/core";
import { QueryService } from "./query.service";
import { GroupingService } from "./grouping.service";

export interface Aggregation {
  query: string;
  groupBy?: string[];
  label?: string;
  aggregations?: Aggregation[];
}

export interface ReportRow {
  header: { label: string; result: any };
  subRows?: ReportRow[];
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
        results.push({ header: { label: aggregation.label, result: result } });
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
    const grouping = this.groupingService.groupBy(
      data,
      ...aggregation.groupBy
    ) as any;
    const results: ReportRow[] = [];
    for (const group of grouping) {
      let aggregationSubgroups: ReportRow[];
      if (aggregation.aggregations) {
        const aggregationResults = await this.calculateAggregations(
          aggregation.aggregations,
          group.data
        );
        aggregationResults.forEach(
          (res) =>
            (res.header.label = this.createGroupingLabel(
              res.header.label,
              group.values
            ))
        );
        aggregationSubgroups = aggregationResults.filter(
          (aggregation) =>
            !results.some(
              (res) => res.header.label === aggregation.header.label
            )
        );
      }
      if (aggregation.label) {
        results.push({
          header: {
            label: this.createGroupingLabel(aggregation.label, group.values),
            result: group.data.length,
          },
          subRows: aggregationSubgroups,
        });
      } else {
        results.push(...aggregationSubgroups);
      }
    }
    return results;
  }

  private createGroupingLabel(label: string, values: any) {
    let groupingLabel = label;
    let valuesString = Object.keys(values)
      .map((key) => {
        let value = values[key];
        if (value?.hasOwnProperty("label")) {
          value = value.label;
        }
        if (!value) {
          value = `without ${key}`;
        }
        return value;
      })
      .join(", ");
    if (valuesString) {
      if (label.endsWith(")")) {
        // TODO Bug when a bracket is in the label
        const afterBracketPos = label.lastIndexOf("(") + 1;
        const firstPart = label.slice(0, afterBracketPos);
        const secondPart = label.slice(afterBracketPos);
        groupingLabel = firstPart + valuesString + ", " + secondPart;
      } else {
        groupingLabel = groupingLabel + " (" + valuesString + ")";
      }
    }
    return groupingLabel;
  }
}
