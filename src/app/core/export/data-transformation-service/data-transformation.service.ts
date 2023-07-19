import { Injectable } from "@angular/core";
import {
  getReadableValue,
  transformToReadableFormat,
} from "../../entity-components/entity-subrecord/entity-subrecord/value-accessor";
import { ExportColumnConfig } from "./export-column-config";
import { QueryService } from "../query.service";
import { groupBy } from "../../../utils/utils";

/**
 * Prepare data for export or analysis
 */
@Injectable({
  providedIn: "root",
})
export class DataTransformationService {
  constructor(private queryService: QueryService) {}

  async queryAndTransformData(
    config: ExportColumnConfig[],
    from?: Date,
    to?: Date
  ): Promise<ExportRow[]> {
    const combinedResults: ExportRow[] = [];
    for (const c of config) {
      await this.queryService.cacheRequiredData(c.query, from, to);
      const baseData = this.queryService.queryData(c.query, from, to);
      const result = await this.transformData(
        baseData,
        c.subQueries,
        from,
        to,
        c.groupBy
      );
      combinedResults.push(...result);
    }
    return combinedResults;
  }

  private concatQueries(config: ExportColumnConfig) {
    return (config.subQueries ?? []).reduce(
      (query, c) => query + this.concatQueries(c),
      config.query
    );
  }

  /**
   * Creates a dataset with the provided values that can be used for a simple table or export.
   * @param data an array of elements. If not provided, the first query in `config` will be used to get the data.
   * @param config (Optional) config specifying how export should look
   * @param from (Optional) limits the data which is fetched from the database and is also available inside the query. If not provided, all data is fetched.
   * @param to (Optional) same as from.If not provided, today is used.
   * @param groupByProperty (optional) groups the data using the value at the given property and adds a column to the final table.
   * @returns array with the result of the queries and sub queries
   */
  async transformData(
    data: any[],
    config: ExportColumnConfig[],
    from?: Date,
    to?: Date,
    groupByProperty?: { label: string; property: string }
  ): Promise<ExportRow[]> {
    const fullQuery = config.map((c) => this.concatQueries(c)).join("");
    await this.queryService.cacheRequiredData(fullQuery, from, to);
    return this.generateRows(data, config, from, to, groupByProperty).map(
      transformToReadableFormat
    );
  }

  private generateRows(
    data: any[],
    config: ExportColumnConfig[],
    from: Date,
    to: Date,
    groupByProperty?: { label: string; property: string }
  ) {
    const result: ExportRow[] = [];
    if (groupByProperty) {
      const groups = groupBy(data, groupByProperty.property);
      for (const [group, values] of groups) {
        const groupColumn: ExportColumnConfig = {
          label: groupByProperty.label,
          query: `:setString(${getReadableValue(group)})`,
        };
        const rows = this.generateColumnsForRow(
          values,
          [groupColumn].concat(...config),
          from,
          to
        );
        result.push(...rows);
      }
    } else {
      for (const dataRow of data) {
        const rows = this.generateColumnsForRow(dataRow, config, from, to);
        result.push(...rows);
      }
    }
    return result;
  }

  /**
   * Generate one or more export row objects from the given data data and config.
   * @param data A data to be exported as one or more export row objects
   * @param config
   * @param from
   * @param to
   * @returns array of one or more export row objects (as simple {key: value})
   * @private
   */
  private generateColumnsForRow(
    data: any | any[],
    config: ExportColumnConfig[],
    from: Date,
    to: Date
  ): ExportRow[] {
    let exportRows: ExportRow[] = [{}];
    for (const exportColumnConfig of config) {
      const partialExportObjects = this.buildValueRecursively(
        data,
        exportColumnConfig,
        from,
        to
      );

      exportRows = this.mergePartialExportRows(
        exportRows,
        partialExportObjects
      );
    }
    return exportRows;
  }

  /**
   * Generate one or more (partial) export row objects from a single property of the data
   * @param data one single data item
   * @param exportColumnConfig
   * @param from
   * @param to
   * @private
   */
  private buildValueRecursively(
    data: any | any[],
    exportColumnConfig: ExportColumnConfig,
    from: Date,
    to: Date
  ): ExportRow[] {
    const label =
      exportColumnConfig.label ?? exportColumnConfig.query.replace(".", "");
    const value = this.getValueForQuery(exportColumnConfig, data, from, to);

    if (!exportColumnConfig.subQueries) {
      return [{ [label]: value }];
    } else if (value.length === 0) {
      return this.generateColumnsForRow(
        {},
        exportColumnConfig.subQueries,
        from,
        to
      );
    } else {
      return this.generateRows(
        value,
        exportColumnConfig.subQueries,
        from,
        to,
        exportColumnConfig.groupBy
      );
    }
  }

  private getValueForQuery(
    exportColumnConfig: ExportColumnConfig,
    data: any | any[],
    from: Date,
    to: Date
  ): any {
    const value = this.queryService.queryData(
      exportColumnConfig.query,
      from,
      to,
      Array.isArray(data) ? data : [data]
    );

    if (!Array.isArray(value)) {
      return value;
    } else if (!exportColumnConfig.subQueries && value.length === 1) {
      return value[0];
    } else {
      return value.filter((val) => val !== undefined);
    }
  }

  /**
   * Combine two arrays of export row objects.
   * Every additional row is merged with every row of the first array (combining properties),
   * resulting in n*m export rows.
   *
   * @param exportRows
   * @param additionalExportRows
   * @private
   */
  private mergePartialExportRows(
    exportRows: ExportRow[],
    additionalExportRows: ExportRow[]
  ): ExportRow[] {
    const rowsOfRows: ExportRow[][] = additionalExportRows.map((addRow) =>
      exportRows.map((row) => Object.assign({}, row, addRow))
    );
    // return flattened array
    return rowsOfRows.reduce((acc, rowOfRows) => acc.concat(rowOfRows), []);
  }
}

interface ExportRow {
  [key: string]: any;
}
