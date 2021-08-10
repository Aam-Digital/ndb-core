import { Injectable } from "@angular/core";
import { Papa } from "ngx-papaparse";
import { entityListSortingAccessor } from "../../entity-components/entity-subrecord/entity-subrecord/sorting-accessor";
import { ExportColumnConfig } from "./export-column-config";

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

  constructor(private papa: Papa) {}

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
  createCsv(data: any[], config?: ExportColumnConfig[]): string {
    const allFields = new Set();
    const exportableData = [];

    data.forEach((element: any) => {
      const exportableObj = {};

      const currentRowConfig =
        config ??
        Object.keys(element).map((key) => ({ key: key } as ExportColumnConfig));
      for (const columnConfig of currentRowConfig) {
        const label = columnConfig.label ?? columnConfig.key;
        const value = entityListSortingAccessor(element, columnConfig.key);
        if (value?.toString().match(/\[object.*\]/) !== null) {
          // skip object values that cannot be converted to a meaningful string
          continue;
        }

        exportableObj[label] = value;
        allFields.add(label);
      }

      exportableData.push(exportableObj);
    });

    return this.papa.unparse(
      { data: exportableData, fields: [...allFields] },
      { quotes: true, header: true }
    );
  }
}
