import { Injectable } from "@angular/core";
import { Papa } from "ngx-papaparse";
import { entityListSortingAccessor } from "../../entity-components/entity-subrecord/entity-subrecord/sorting-accessor";
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
   * @param data an array of elements
   * @param config (Optional) config specifying which fields should be exported
   * @returns string a valid CSV string of the input data
   */
  async createCsv(
    data: any[],
    config: ExportColumnConfig[] = this.generateExportConfigFromData(data)
  ): Promise<string> {
    if (!data) {
      const newData = await this.queryService.queryData(config[0].query);
      return this.createCsv(newData, config[0].subQueries);
    }
    const flattenedExportRows: ExportRow[] = [];
    for (const dataRow of data) {
      const extendedExportableRows = await this.generateExportRows(
        dataRow,
        config
      );
      flattenedExportRows.push(...extendedExportableRows);
    }

    // Apply entitySortingDataAccessor to transform values into human readable format
    const readableExportRow = flattenedExportRows.map((row) => {
      const readableRow = {};
      Object.keys(row).forEach((key) => {
        if (row[key] instanceof Date) {
          // Export data according to local timezone offset
          readableRow[key] = moment(row[key]).toISOString(true);
        } else {
          readableRow[key] = entityListSortingAccessor(row, key);
        }
      });
      return readableRow;
    });

    return this.papa.unparse(
      { data: readableExportRow },
      { quotes: true, header: true, newline: ExportService.SEPARATOR_ROW }
    );
  }

  /**
   * Infer a column export config from the given data.
   * Includes all properties of the data objects,
   * if different objects are in the data a config for the superset across all objects' properties is returned.
   *
   * @param data objects to be exported, each object can have different properties
   * @private
   */
  private generateExportConfigFromData(data: Object[]): ExportColumnConfig[] {
    const uniqueKeys = new Set<string>();
    data.forEach((obj) =>
      Object.keys(obj).forEach((key) => uniqueKeys.add(key))
    );

    const columnConfigs: ExportColumnConfig[] = [];
    uniqueKeys.forEach((key) => columnConfigs.push({ query: "." + key }));

    return columnConfigs;
  }

  /**
   * Generate one or more export row objects from the given data object and config.
   * @param object A single data object to be exported as one or more export row objects
   * @param config
   * @returns array of one or more export row objects (as simple {key: value})
   * @private
   */
  private async generateExportRows(
    object: Object,
    config: ExportColumnConfig[]
  ): Promise<ExportRow[]> {
    let exportRows: ExportRow[] = [{}];
    for (const exportColumnConfig of config) {
      const partialExportObjects: ExportRow[] = await this.getExportRowsForColumn(
        object,
        exportColumnConfig
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
   * @private
   */
  private async getExportRowsForColumn(
    object: Object,
    exportColumnConfig: ExportColumnConfig
  ): Promise<ExportRow[]> {
    const label =
      exportColumnConfig.label ?? exportColumnConfig.query.replace(".", "");
    const value = await this.getValueForQuery(exportColumnConfig, object);

    if (!exportColumnConfig.subQueries) {
      return [{ [label]: value }];
    } else if (value.length === 0) {
      return this.generateExportRows({}, exportColumnConfig.subQueries);
    } else {
      const additionalRows: ExportRow[] = [];
      for (const v of value) {
        const addRows = await this.generateExportRows(
          v,
          exportColumnConfig.subQueries
        );
        additionalRows.push(...addRows);
      }
      return additionalRows;
    }
  }

  private async getValueForQuery(
    exportColumnConfig: ExportColumnConfig,
    object: Object
  ): Promise<any> {
    const value = await this.queryService.queryData(
      exportColumnConfig.query,
      null,
      null,
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
