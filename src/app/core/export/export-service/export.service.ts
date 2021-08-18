import { Injectable } from "@angular/core";
import { Papa } from "ngx-papaparse";
import { entityListSortingAccessor } from "../../entity-components/entity-subrecord/entity-subrecord/sorting-accessor";
import { ExportColumnConfig } from "./export-column-config";
import { QueryService } from "../../../features/reporting/query.service";

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
  async createCsv<T = any>(
    data: T[],
    config?: ExportColumnConfig[]
  ): Promise<string> {
    if (!config) {
      config = this.generateExportConfigFromData(data);
    }

    const exportableData = [];
    for (const dataRow of data) {
      const extendedExportableRows = await this.generateExportRows(
        dataRow,
        config
      );
      exportableData.push(...extendedExportableRows);
    }

    return this.papa.unparse(
      { data: exportableData },
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
    const generatedConfig = [];
    for (const dataRow of data) {
      const newConfigFromRow = Object.keys(dataRow)
        .filter(
          (query) => !generatedConfig.find((config) => config.query === query)
        )
        .map((key) => ({ query: key } as ExportColumnConfig));

      generatedConfig.push(...newConfigFromRow);
    }

    return generatedConfig;
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
    const label = exportColumnConfig.label ?? exportColumnConfig.query;
    const value = await this.getValueForQuery(exportColumnConfig, object);

    if (!exportColumnConfig.aggregations) {
      const result = {};
      result[label] = value;
      return [result];
    } else {
      const additionalRows: ExportRow[] = [];
      for (const v of value) {
        const addRows = await this.generateExportRows(
          v,
          exportColumnConfig.aggregations
        );
        additionalRows.push(...addRows);
      }
      return additionalRows;
    }
  }

  private async getValueForQuery(
    exportColumnConfig: ExportColumnConfig,
    object: Object
  ) {
    if (!isQuery(exportColumnConfig.query)) {
      return entityListSortingAccessor(object, exportColumnConfig.query);
    } else {
      const value = await this.queryService.queryData(
        exportColumnConfig.query,
        null,
        null,
        [object]
      );

      if (!exportColumnConfig.aggregations && value.length === 1) {
        // queryData() always returns an array, simple queries should be a direct value however
        return value[0];
      }
      return value;
    }

    function isQuery(queryKey) {
      return queryKey.startsWith(".") || queryKey.startsWith(":");
    }
  }

  /**
   * Combine two arrays of export row objects.
   * Every additional row is merge with every row of the first array (combining properties),
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
