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
      const groupingResults = this.groupingService.groupBy(data, property);
      for (const grouping of groupingResults) {
        const newRow: ReportRow = {
          header: {
            label: label,
            values: Object.values(grouping.values),
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

  private async createGroupByResult(
    aggregation: Aggregation,
    data: any[]
  ): Promise<ReportRow[]> {
    const results: ReportRow[] = [];
    const groupings = (this.groupingService.groupBy(
      data,
      aggregation.groupBy[0]
    ) as unknown) as { values: { [key in string]: any }; data: any[] }[];
    let currentRow = results;
    for (const group of groupings) {
      const groupValues = Object.values(group.values);
      if (aggregation.label) {
        const newRow = {
          header: {
            label: aggregation.label,
            values: groupValues,
            result: group.data.length,
          },
          subRows: [],
        };
        results.push(newRow);
        currentRow = newRow.subRows;
      }
      if (aggregation.aggregations) {
        const aggregationResults = await this.calculateAggregations(
          aggregation.aggregations,
          group.data
        );
        aggregationResults.forEach((row) =>
          row.header.values
            ? row.header.values.push(...groupValues)
            : (row.header.values = groupValues)
        );
        currentRow.push(...aggregationResults);
      }
    }
    return results;
  }
}
