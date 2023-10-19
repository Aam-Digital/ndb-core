import { Injectable } from "@angular/core";
import { ExportColumnConfig } from "../data-transformation-service/export-column-config";
import { ExportDataFormat } from "../export-data-directive/export-data.directive";
import { LoggingService } from "../../logging/logging.service";
import { DataTransformationService } from "../data-transformation-service/data-transformation.service";
import { transformToReadableFormat } from "../../common-components/entity-subrecord/entity-subrecord/value-accessor";
import { Papa } from "ngx-papaparse";

/**
 * This service allows to start a download process from the browser.
 * Depending on the browser and the setting this might open a popup or directly download the file.
 */
@Injectable({ providedIn: "root" })
export class DownloadService {
  /** CSV row separator */
  static readonly SEPARATOR_ROW = "\n";
  /** CSV column/field separator */
  static readonly SEPARATOR_COL = ",";

  constructor(
    private dataTransformationService: DataTransformationService,
    private papa: Papa,
    private loggingService: LoggingService,
  ) {}

  /**
   * Starts the download process with the provided data
   * @param data content of the file that will be downloaded
   * @param format extension of the file that will be downloaded, support is 'csv' and 'json'
   * @param filename of the file that will be downloaded
   * @param exportConfig special configuration that will be applied to the 'data' before triggering the download
   */
  async triggerDownload(
    data: any,
    format: ExportDataFormat,
    filename: string,
    exportConfig?: ExportColumnConfig[],
  ) {
    const blobData = await this.getFormattedBlobData(
      data,
      format,
      exportConfig,
    );
    const filenameWithExtension = filename + "." + format.toLowerCase();
    const link = this.createDownloadLink(blobData, filenameWithExtension);
    link.click();
  }

  private async getFormattedBlobData(
    data: any,
    format: ExportDataFormat,
    exportConfig?: ExportColumnConfig[],
  ): Promise<Blob> {
    let result = "";

    if (exportConfig) {
      data = await this.dataTransformationService.transformData(
        data,
        exportConfig,
      );
    }

    switch (format.toLowerCase()) {
      case "json":
        result = JSON.stringify(data); // TODO: support exportConfig for json format
        return new Blob([result], { type: "application/json" });
      case "csv":
        result = await this.createCsv(data);
        return new Blob([result], { type: "text/csv" });
      default:
        this.loggingService.warn(`Not supported format: ${format}`);
        return new Blob([""]);
    }
  }

  private createDownloadLink(blobData, filename: string): HTMLAnchorElement {
    const link = document.createElement("a");
    link.setAttribute("style", "display:none;");
    document.body.appendChild(link);
    link.href = window.URL.createObjectURL(blobData);
    link.download = filename;
    link.addEventListener("click", () => window.URL.revokeObjectURL(blobData));
    return link;
  }

  /**
   * Creates a CSV string of the input data
   *
   * @param data an array of elements
   * @returns string a valid CSV string of the input data
   */
  async createCsv(data: any[]): Promise<string> {
    let entityConstructor: any;

    if (data.length > 0 && typeof data[0]?.getConstructor === 'function') {
        entityConstructor = data[0].getConstructor();
    }
    const keys = new Set<string>();
    data.forEach((row) => Object.keys(row).forEach((key) => keys.add(key)));

    data = data.map(transformToReadableFormat);
   
    if (!entityConstructor) {
      return this.papa.unparse(data, {
        quotes: true,
        header: true,
        newline: DownloadService.SEPARATOR_ROW,
        columns: [...keys],
      });
    }

    const result = this.exportFile(data, entityConstructor);
    return result;
  }

  exportFile(data: any[], entityConstructor: { schema: any; }) {
    const entitySchema = [entityConstructor.schema];
    const columnLabel = {};

    entitySchema[0].forEach((value: { value: string, label: string }, key: string) => {
        if (value.label) columnLabel[key] = value.label;
    });

    const exportEntities = data.map((item) => {
      for (const key in item) {
        if (!columnLabel.hasOwnProperty(key)) delete item[key];
      }
      return item;
    });

    const columnKeys = Object.keys(columnLabel);
    const columnLabels:string[] = Object.values(columnLabel);
    const orderedData = [];

    exportEntities.forEach((item) => {
      const orderedItem = [];
      columnKeys.forEach((key) => {
        orderedItem.push(item[key]);
      });
      orderedData.push(orderedItem);
    });

    return this.papa.unparse({
      fields: columnLabels,
      data: orderedData
    });
  }
}
