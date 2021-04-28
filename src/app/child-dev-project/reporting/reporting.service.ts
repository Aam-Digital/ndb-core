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
    const resultRows: ReportRow[] = [];
    let currentSubRows = resultRows;
    for (const aggregation of aggregations) {
      const queryResult = await this.queryService.queryData(
        this.getQueryWithDates(aggregation.query),
        data
      );
      if (aggregation.label) {
        const newRow = {
          header: { label: aggregation.label, result: queryResult?.length },
          subRows: [],
        };
        resultRows.push(newRow);
        currentSubRows = newRow.subRows;
      }
      if (aggregation.aggregations) {
        currentSubRows.push(
          ...(await this.calculateAggregations(
            aggregation.aggregations,
            queryResult
          ))
        );
      }
      if (aggregation.groupBy) {
        currentSubRows.push(
          ...(await this.calculateGroupBy(
            aggregation.groupBy,
            aggregation.aggregations,
            aggregation.label,
            queryResult
          ))
        );
      }
    }
    return resultRows;
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
    properties: string[],
    aggregations: any[],
    label: string,
    data: any[]
  ): Promise<ReportRow[]> {
    const resultRows: ReportRow[] = [];
    for (let i = properties.length; i > 0; i--) {
      const currentProperty = properties[i - 1];
      const remainingProperties = properties.slice(i);
      const groupingResults = this.groupBy(data, currentProperty);
      for (const grouping of groupingResults) {
        const newRow: ReportRow = {
          header: {
            label: label,
            values: [this.getValueDescription(grouping.value, currentProperty)],
            result: grouping.data.length,
          },
          subRows: [],
        };
        newRow.subRows.push(
          ...(await this.calculateAggregations(aggregations, grouping.data))
        );
        newRow.subRows.push(
          ...(await this.calculateGroupBy(
            remainingProperties,
            aggregations,
            label,
            grouping.data
          ))
        );
        resultRows.push(newRow);
      }
    }
    return resultRows;
  }

  private groupBy<ENTITY, PROPERTY extends keyof ENTITY>(
    data: ENTITY[],
    groupByProperty: PROPERTY
  ): { value: ENTITY[PROPERTY]; data: ENTITY[] }[] {
    return data.reduce((allGroups, currentElement) => {
      const currentValue = currentElement[groupByProperty];
      let existingGroup = allGroups.find((group) => group.value === currentValue);
      if (!existingGroup) {
        existingGroup = { value: currentValue, data: [] };
        allGroups.push(existingGroup);
      }
      existingGroup.data.push(currentElement);
      return allGroups;
    }, new Array<{ value: ENTITY[PROPERTY]; data: ENTITY[] }>());
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
