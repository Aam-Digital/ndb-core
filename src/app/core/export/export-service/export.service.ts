import { Injectable } from "@angular/core";
import { Papa } from "ngx-papaparse";
import { entityListSortingAccessor } from "../../entity-components/entity-subrecord/entity-subrecord/sorting-accessor";

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
    let res = "";
    data.forEach((r) => {
      res += JSON.stringify(r) + ExportService.SEPARATOR_ROW;
    });

    return res.trim();
  }

  /**
   * Creates a CSV string of the input data
   *
   * @param data an array of elements
   * @returns string a valid CSV string of the input data
   */
  createCsv(data: any[]): string {
    const allFields = new Set();
    const exportableData = [];

    data.forEach((element: any) => {
      const exportableObj = {};
      Object.keys(element).forEach((key: string) => {
        const res = entityListSortingAccessor(element, key);

        if (res?.toString().match(/\[object.*\]/) === null) {
          allFields.add(key);
          exportableObj[key] = res;
        }
      });

      exportableData.push(exportableObj);
    });

    return this.papa.unparse(
      { data: exportableData, fields: [...new Set(allFields)] },
      { quotes: true, header: true }
    );
  }
}
