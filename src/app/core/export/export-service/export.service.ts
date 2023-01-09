import { Injectable } from "@angular/core";
import { Papa } from "ngx-papaparse";
import { getReadableValue } from "../../entity-components/entity-subrecord/entity-subrecord/value-accessor";
import { ExportColumnConfig } from "./export-column-config";
import { QueryService } from "../../../features/reporting/query.service";
import moment from "moment";
import { groupBy } from "../../../utils/utils";

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
    let readableExportRow: ExportRow[];
    if (data) {
      readableExportRow = await this.createExportOfData(data, config, from, to);
    } else {
      readableExportRow = await this.createExport(config, from, to);
    }

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

  async createExport(
    config: ExportColumnConfig[],
    from?: Date,
    to?: Date
  ): Promise<ExportRow[]> {
    const combinedResults: ExportRow[] = [];
    for (const c of config) {
      const baseData = await this.queryService.queryData(c.query, from, to);
      const result = await this.createExportOfData(
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

  /**
   * Creates a dataset with the provided values that can be used for a simple table or export.
   * @param data an array of elements. If not provided, the first query in `config` will be used to get the data.
   * @param config (Optional) config specifying how export should look
   * @param from (Optional) limits the data which is fetched from the database and is also available inside the query. If not provided, all data is fetched.
   * @param to (Optional) same as from.If not provided, today is used.
   * @param groupByProperty (optional) groups the data using the value at the given property and adds a column to the final table.
   * @returns array with the result of the queries and sub queries
   */
  async createExportOfData(
    data: any[],
    config: ExportColumnConfig[],
    from?: Date,
    to?: Date,
    groupByProperty?: { label: string; property: string }
  ): Promise<ExportRow[]> {
    let flattenedExportRows: ExportRow[];
    if (config) {
      flattenedExportRows = await this.generateExportRowsForData(
        data,
        config,
        from,
        to,
        groupByProperty
      );
    } else {
      flattenedExportRows = data;
    }
    return this.transformToReadableFormat(flattenedExportRows);
  }

  private async generateExportRowsForData(
    data: any[],
    config: ExportColumnConfig[],
    from: Date,
    to: Date,
    groupByProperty?: { label: string; property: string }
  ) {
    const result: ExportRow[] = [];
    if (groupByProperty) {
      const groups = groupBy(data, groupByProperty.property);
      for (const [group, values] of groups.entries()) {
        const groupColumn: ExportColumnConfig = {
          label: groupByProperty.label,
          query: `:setString(${getReadableValue(group)})`,
        };
        const rows = await this.generateExportRows(
          values,
          [groupColumn].concat(...config),
          from,
          to
        );
        result.push(...rows);
      }
    } else {
      for (const dataRow of data) {
        const rows = await this.generateExportRows(dataRow, config, from, to);
        result.push(...rows);
      }
    }
    return result;
  }

  private transformToReadableFormat(flattenedExportRows: ExportRow[]) {
    return flattenedExportRows.map((row) => {
      const readableRow = {};
      Object.entries(row).forEach(([key, value]) => {
        if (value instanceof Date) {
          // Export data according to local timezone offset - data is loaded through Entity Schema system and thereby has the correct date in the current device's timezone
          // TODO: make this output format configurable or use the different date schema types [GITHUB #1185]
          readableRow[key] = moment(value).format("YYYY-MM-DD");
        } else {
          readableRow[key] = getReadableValue(value);
        }
      });
      return readableRow;
    });
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
  private async generateExportRows(
    data: any | any[],
    config: ExportColumnConfig[],
    from: Date,
    to: Date
  ): Promise<ExportRow[]> {
    let exportRows: ExportRow[] = [{}];
    for (const exportColumnConfig of config) {
      const partialExportObjects: ExportRow[] =
        await this.getExportRowsForColumn(data, exportColumnConfig, from, to);

      exportRows = this.mergePartialExportRows(
        exportRows,
        partialExportObjects
      );
    }
    return exportRows;
  }

  /**
   * Generate one or more (partial) export row objects from a single property of the data
   * @param data
   * @param exportColumnConfig
   * @param from
   * @param to
   * @private
   */
  private async getExportRowsForColumn(
    data: any | any[],
    exportColumnConfig: ExportColumnConfig,
    from: Date,
    to: Date
  ): Promise<ExportRow[]> {
    const label =
      exportColumnConfig.label ?? exportColumnConfig.query.replace(".", "");
    const value = await this.getValueForQuery(
      exportColumnConfig,
      data,
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
      return this.generateExportRowsForData(
        value,
        exportColumnConfig.subQueries,
        from,
        to,
        exportColumnConfig.groupBy
      );
    }
  }

  private async getValueForQuery(
    exportColumnConfig: ExportColumnConfig,
    data: any | any[],
    from: Date,
    to: Date
  ): Promise<any> {
    const value = await this.queryService.queryData(
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
