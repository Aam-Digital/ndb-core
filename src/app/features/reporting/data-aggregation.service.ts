import { Injectable } from "@angular/core";
import { QueryService } from "../../core/export/query.service";
import { GroupByDescription, ReportRow } from "./report-row";
import { groupBy } from "../../utils/utils";

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

  public async calculateReport(
    aggregations: Aggregation[],
    from?: Date,
    to?: Date,
  ): Promise<ReportRow[]> {
    this.fromDate = from;
    this.toDate = to;
    const fullQuery = aggregations.map((a) => this.concatQueries(a)).join("|");
    await this.queryService.cacheRequiredData(
      fullQuery,
      this.fromDate,
      this.toDate,
    );
    return this.calculateAggregations(aggregations);
  }

  private concatQueries(config: Aggregation) {
    return (config.aggregations ?? []).reduce(
      (query, c) => query + this.concatQueries(c),
      config.query,
    );
  }

  private calculateAggregations(
    aggregations: Aggregation[] = [],
    data?: any[],
    additionalValues: GroupByDescription[] = [],
  ): ReportRow[] {
    const resultRows: ReportRow[] = [];
    let currentSubRows = resultRows;
    for (const aggregation of aggregations) {
      const queryResult = this.queryService.queryData(
        aggregation.query,
        this.fromDate,
        this.toDate,
        data,
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
          ...this.calculateAggregations(
            aggregation.aggregations,
            queryResult,
            additionalValues,
          ),
        );
      }
      if (aggregation.groupBy) {
        currentSubRows.push(
          ...this.calculateGroupBy(
            aggregation.groupBy,
            aggregation.aggregations,
            aggregation.label,
            queryResult,
            additionalValues,
          ),
        );
      }
    }
    return resultRows;
  }

  private calculateGroupBy(
    properties: string[],
    aggregations: any[],
    label: string,
    data: any[],
    additionalValues: GroupByDescription[],
  ): ReportRow[] {
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
          ...this.calculateAggregations(aggregations, entries, groupingValues),
        );
        newRow.subRows.push(
          ...this.calculateGroupBy(
            remainingProperties,
            aggregations,
            label,
            entries,
            groupingValues,
          ),
        );
        resultRows.push(newRow);
      }
    }
    return resultRows;
  }
}
