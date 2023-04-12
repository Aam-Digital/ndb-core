import { Injectable } from "@angular/core";
import { QueryService } from "../../core/export/query.service";
import { GroupByDescription, ReportRow } from "./report-row";
import { groupBy } from "../../utils/utils";
import { ExportColumnConfig } from "../../core/export/data-transformation-service/export-column-config";

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
      const fullQuery = this.concatQueries(aggregation);
      await this.queryService.cacheRequiredData(
        fullQuery,
        this.fromDate,
        this.toDate
      );
      const queryResult = this.queryService.queryData(
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

  concatQueries(config: Aggregation) {
    return (config.aggregations ?? []).reduce(
      (query, c) => query + this.concatQueries(c),
      config.query
    );
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
      const groupingResults = groupBy(data, currentProperty);
      for (const [group, entries] of groupingResults) {
        const groupingValues = additionalValues.concat({
          property: currentProperty,
          value: group,
        });
        const newRow: ReportRow = {
          header: {
            label: label,
            groupedBy: groupingValues,
            result: entries.length,
          },
          subRows: [],
        };
        newRow.subRows.push(
          ...(await this.calculateAggregations(
            aggregations,
            entries,
            groupingValues
          ))
        );
        newRow.subRows.push(
          ...(await this.calculateGroupBy(
            remainingProperties,
            aggregations,
            label,
            entries,
            groupingValues
          ))
        );
        resultRows.push(newRow);
      }
    }
    return resultRows;
  }
}
