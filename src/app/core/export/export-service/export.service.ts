import { Injectable } from "@angular/core";
import { Papa } from "ngx-papaparse";
import { getReadableValue } from "../../entity-components/entity-subrecord/entity-subrecord/value-accessor";
import { ExportColumnConfig } from "./export-column-config";
import { QueryService } from "../../../features/reporting/query.service";
import moment from "moment";

/**
 * Prepare data for export in csv format.
 */
@Injectable({
  providedIn: "root",
})
export class ExportService {
  /** CSV row separator */
  static readonly SEPARATOR_ROW = "\n";
  /** CSV column/field separator */
  static readonly SEPARATOR_COL = ",";

  constructor(private papa: Papa, private queryService: QueryService) {}

  /**
   * Creates a JSON string of the given data.
   *
   * @param data the data which should be converted to JSON
   * @returns string containing all the values stringified elements of the input data
   */
  createJson(data): string {
    return JSON.stringify(data);
  }

  /**
   * Creates a CSV string of the input data
   *
   * @param data (Optional) an array of elements. If not provided, the queries in `config` will be used to get the initial data.
   * @param config (Optional) config specifying how export should look
   * @param from (Optional) limits the data which is fetched from the database and is also available inside the query. If not provided, all data is fetched.
   * @param to (Optional) same as from.If not provided, today is used.
   * @returns string a valid CSV string of the input data
   */
  async createCsv(
    data: any[],
    config?: ExportColumnConfig[],
    from?: Date,
    to?: Date
  ): Promise<string> {
    const readableExportRow = await this.runExportQuery(data, config, from, to);

    // Collect all properties because papa only uses the properties of the first object
    const keys = new Set<string>();
    readableExportRow.forEach((row) =>
      Object.keys(row).forEach((key) => keys.add(key))
    );
    return this.papa.unparse(readableExportRow, {
      quotes: true,
      header: true,
      newline: ExportService.SEPARATOR_ROW,
      columns: [...keys],
    });
  }

  /**
   * Creates a dataset with the provided values that can be used for a simple table or export.
   * @param data (Optional) an array of elements. If not provided, the first query in `config` will be used to get the data.
   * @param config (Optional) config specifying how export should look
   * @param from (Optional) limits the data which is fetched from the database and is also available inside the query. If not provided, all data is fetched.
   * @param to (Optional) same as from.If not provided, today is used.
   * @returns array with the result of the queries and sub queries
   */
  async runExportQuery(
    data: any[],
    config?: ExportColumnConfig[],
    from?: Date,
    to?: Date
  ): Promise<ExportRow[]> {
    if (!data) {
      // The query of each first level ExportColumnConfig is used as data-basis for the further subQueries
      const combinedResults: ExportRow[] = [];
      for (const c of config) {
        const baseData = await this.queryService.queryData(c.query, from, to);
        const result = await this.runExportQuery(
          baseData,
          c.subQueries,
          from,
          to
        );
        combinedResults.push(...result);
      }
      return combinedResults;
    }

    const flattenedExportRows: ExportRow[] = [];
    if (config) {
      for (const dataRow of data) {
        const extendedExportableRows = await this.generateExportRows(
          dataRow,
          config,
          from,
          to
        );
        flattenedExportRows.push(...extendedExportableRows);
      }
    } else {
      flattenedExportRows.push(...data);
    }
    return this.transformToReadableFormat(flattenedExportRows);
  }

  private transformToReadableFormat(flattenedExportRows: ExportRow[]) {
    return flattenedExportRows.map((row) => {
      const readableRow = {};
      Object.keys(row).forEach((key) => {
        if (row[key] instanceof Date) {
          // Export data according to local timezone offset
          readableRow[key] = moment(row[key]).toISOString(true);
        } else {
          readableRow[key] = getReadableValue(row, key);
        }
      });
      return readableRow;
    });
  }

  /**
   * Generate one or more export row objects from the given data object and config.
   * @param object A single data object to be exported as one or more export row objects
   * @param config
   * @param from
   * @param to
   * @returns array of one or more export row objects (as simple {key: value})
   * @private
   */
  private async generateExportRows(
    object: Object,
    config: ExportColumnConfig[],
    from: Date,
    to: Date
  ): Promise<ExportRow[]> {
    let exportRows: ExportRow[] = [{}];
    for (const exportColumnConfig of config) {
      const partialExportObjects: ExportRow[] = await this.getExportRowsForColumn(
        object,
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
   * Generate one or more (partial) export row objects from a single property of the data object
   * @param object
   * @param exportColumnConfig
   * @param from
   * @param to
   * @private
   */
  private async getExportRowsForColumn(
    object: Object,
    exportColumnConfig: ExportColumnConfig,
    from: Date,
    to: Date
  ): Promise<ExportRow[]> {
    const label =
      exportColumnConfig.label ?? exportColumnConfig.query.replace(".", "");
    const value = await this.getValueForQuery(
      exportColumnConfig,
      object,
      from,
      to
    );

    if (!exportColumnConfig.subQueries) {
      return [{ [label]: value }];
    } else if (value.length === 0) {
      return this.generateExportRows(
        {},
        exportColumnConfig.subQueries,
        from,
        to
      );
    } else {
      const additionalRows: ExportRow[] = [];
      for (const v of value) {
        const addRows = await this.generateExportRows(
          v,
          exportColumnConfig.subQueries,
          from,
          to
        );
        additionalRows.push(...addRows);
      }
      return additionalRows;
    }
  }

  private async getValueForQuery(
    exportColumnConfig: ExportColumnConfig,
    object: Object,
    from: Date,
    to: Date
  ): Promise<any> {
    const value = await this.queryService.queryData(
      exportColumnConfig.query,
      from,
      to,
      [object]
    );

    if (!exportColumnConfig.subQueries && value.length === 1) {
      // queryData() always returns an array, simple queries should be a direct value however
      return value[0];
    }
    return value.filter((val) => val !== undefined);
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
