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
  async createCsv(data: any[], config?: ExportColumnConfig[]): Promise<string> {
    const exportableData = [];
    const columns = new Set<string>(
      (config ?? []).map((c) => c.label ?? c.query)
    );

    for (const element of data) {
      const rowConfig =
        config ??
        Object.keys(element).map(
          (key) => ({ query: key } as ExportColumnConfig)
        );
      if (!config) {
        Object.keys(element).forEach((k) => columns.add(k));
      }

      const exportableElement = await this.prepareObjectForExport(
        element,
        rowConfig
      );

      const extendedExportableRows = this.extendIntoMultipleRows(
        exportableElement,
        rowConfig
      );
      extendedExportableRows.forEach((r) => exportableData.push(r));
    }

    return this.papa.unparse(
      { data: exportableData, fields: Array.from(columns.values()) },
      { quotes: true, header: true, newline: ExportService.SEPARATOR_ROW }
    );
  }

  private async prepareObjectForExport(
    element: any,
    config: ExportColumnConfig[]
  ) {
    const exportableObj = {};

    for (const columnConfig of config) {
      const label = columnConfig.label ?? columnConfig.query;
      let value;
      if (
        columnConfig.query.startsWith(".") ||
        columnConfig.query.startsWith(":")
      ) {
        value = await this.queryService.queryData(
          columnConfig.query,
          null,
          null,
          [element]
        );
      } else {
        value = entityListSortingAccessor(element, columnConfig.query);
      }

      if (value?.toString().match(/\[object.*\]/) !== null) {
        // skip object values that cannot be converted to a meaningful string
        continue;
      }

      exportableObj[label] = value;
    }

    return exportableObj;
  }

  private extendIntoMultipleRows(
    exportableElement: {},
    rowsToExtend: ExportColumnConfig[]
  ): any[] {
    const multiElementColumns = rowsToExtend.filter(
      (c) => c.extendIntoMultipleRows
    );

    if (multiElementColumns.length === 0) {
      return [exportableElement];
    }

    const multiProperty = multiElementColumns.pop();
    const extendedElements = exportableElement[multiProperty.label].map(
      (val) => {
        const multipliedRow = Object.assign({}, exportableElement);
        multipliedRow[multiProperty.label] = val;
        return multipliedRow;
      }
    );

    return [].concat(
      ...extendedElements.map((element) =>
        this.extendIntoMultipleRows(element, multiElementColumns)
      )
    );
  }
}
