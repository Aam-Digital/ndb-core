import { Injectable } from "@angular/core";
import { QueryService } from "../../core/export/query.service";
import { GroupByDescription, ReportRow } from "./report-row";

export interface Aggregation {
  query: string;
  groupBy?: string[];
  label?: string;
  aggregations?: Aggregation[];
}

@Injectable({
  providedIn: "root",
})
export class DataAggregationService {
  private fromDate: Date;
  private toDate: Date;

  constructor(private queryService: QueryService) {}

  public calculateReport(
    aggregations: Aggregation[],
    from?: Date,
    to?: Date
  ): Promise<ReportRow[]> {
    this.fromDate = from;
    this.toDate = to;
    return this.calculateAggregations(aggregations);
  }

  private async calculateAggregations(
    aggregations: Aggregation[] = [],
    data?: any[],
    additionalValues: GroupByDescription[] = []
  ): Promise<ReportRow[]> {
    const resultRows: ReportRow[] = [];
    let currentSubRows = resultRows;
    for (const aggregation of aggregations) {
      const queryResult = await this.queryService.queryData(
        aggregation.query,
        this.fromDate,
        this.toDate,
        data
      );

      if (aggregation.label) {
        const newRow = {
          header: {
            label: aggregation.label,
            groupedBy: additionalValues,
            result: queryResult?.length,
          },
          subRows: [],
        };
        resultRows.push(newRow);
        currentSubRows = newRow.subRows;
      }
      if (aggregation.aggregations) {
        currentSubRows.push(
          ...(await this.calculateAggregations(
            aggregation.aggregations,
            queryResult,
            additionalValues
          ))
        );
      }
      if (aggregation.groupBy) {
        currentSubRows.push(
          ...(await this.calculateGroupBy(
            aggregation.groupBy,
            aggregation.aggregations,
            aggregation.label,
            queryResult,
            additionalValues
          ))
        );
      }
    }
    return resultRows;
  }

  private async calculateGroupBy(
    properties: string[],
    aggregations: any[],
    label: string,
    data: any[],
    additionalValues: GroupByDescription[]
  ): Promise<ReportRow[]> {
    const resultRows: ReportRow[] = [];
    for (let i = properties.length; i > 0; i--) {
      const currentProperty = properties[i - 1];
      const remainingProperties = properties.slice(i);
      const groupingResults = this.groupBy(data, currentProperty);
      for (const grouping of groupingResults) {
        const groupingValues = additionalValues.concat({
          property: currentProperty,
          value: grouping.value,
        });
        const newRow: ReportRow = {
          header: {
            label: label,
            groupedBy: groupingValues,
            result: grouping.data.length,
          },
          subRows: [],
        };
        newRow.subRows.push(
          ...(await this.calculateAggregations(
            aggregations,
            grouping.data,
            groupingValues
          ))
        );
        newRow.subRows.push(
          ...(await this.calculateGroupBy(
            remainingProperties,
            aggregations,
            label,
            grouping.data,
            groupingValues
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
      let existingGroup = allGroups.find(
        (group) => group.value === currentValue
      );
      if (!existingGroup) {
        existingGroup = { value: currentValue, data: [] };
        allGroups.push(existingGroup);
      }
      existingGroup.data.push(currentElement);
      return allGroups;
    }, new Array<{ value: ENTITY[PROPERTY]; data: ENTITY[] }>());
  }
}
