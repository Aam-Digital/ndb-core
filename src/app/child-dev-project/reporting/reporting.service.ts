import { Injectable } from "@angular/core";
import { QueryService } from "./query.service";

export interface Aggregation {
  query: string;
  groupBy?: string[];
  label?: string;
  aggregations?: Aggregation[];
}

export interface ReportRow {
  header: { label: string; values?: any[]; result: number };
  subRows?: ReportRow[];
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
    aggregations: Aggregation[] = [],
    data?: any[]
  ): Promise<ReportRow[]> {
    const results: ReportRow[] = [];
    let currentRow = results;
    for (const aggregation of aggregations) {
      const result = await this.queryService.queryData(
        this.getQueryWithDates(aggregation.query),
        data
      );
      if (aggregation.label) {
        const newRow = {
          header: { label: aggregation.label, result: result?.length },
          subRows: [],
        };
        results.push(newRow);
        currentRow = newRow.subRows;
      }
      if (aggregation.aggregations) {
        currentRow.push(
          ...(await this.calculateAggregations(
            aggregation.aggregations,
            result
          ))
        );
      }
      if (aggregation.groupBy) {
        currentRow.push(
          ...(await this.suffixGroupBy(
            aggregation.groupBy,
            aggregation.aggregations,
            aggregation.label,
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

  private async suffixGroupBy(
    properties: string[],
    aggregations: any[],
    label: string,
    data: any[]
  ): Promise<ReportRow[]> {
    const resultRows: ReportRow[] = [];
    for (let i = properties.length; i > 0; i--) {
      const suffix = properties.slice(i);
      const property = properties[i - 1];
      const groupingResults = this.groupBy(data, property);
      for (const grouping of groupingResults) {
        const newRow: ReportRow = {
          header: {
            label: label,
            values: [this.getValueDescription(grouping.value, property)],
            result: grouping.data.length,
          },
          subRows: [],
        };
        newRow.subRows.push(
          ...(await this.calculateAggregations(aggregations, grouping.data))
        );
        const nestedGroupingResults = await this.suffixGroupBy(
          suffix,
          aggregations,
          label,
          grouping.data
        );
        newRow.subRows.push(...nestedGroupingResults);
        resultRows.push(newRow);
      }
    }
    return resultRows;
  }

  private groupBy<T, K extends keyof T>(
    data: T[],
    property: K
  ): { value: T[K]; data: T[] }[] {
    return data.reduce((groups, element) => {
      const value = element[property];
      let existing = groups.find((group) => group.value === value);
      if (!existing) {
        existing = { value: value, data: [] };
        groups.push(existing);
      }
      existing.data.push(element);
      return groups;
    }, new Array<{ value: T[K]; data: T[] }>());
  }

  private getValueDescription(value: any, property: string): string {
    if (typeof value === "boolean") {
      return value ? property : "not " + property;
    } else if (!value) {
      return "without " + property;
    } else if (value.hasOwnProperty("label")) {
      return value.label;
    } else return value;
  }
}
