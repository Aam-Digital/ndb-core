import { Injectable } from "@angular/core";
import { ExportColumnConfig } from "../data-transformation-service/export-column-config";
import { ExportDataFormat } from "../export-data-directive/export-data.directive";
import { LoggingService } from "../../logging/logging.service";
import { DataTransformationService } from "../data-transformation-service/data-transformation.service";
import { transformToReadableFormat } from "../../common-components/entity-subrecord/entity-subrecord/value-accessor";
import { Papa } from "ngx-papaparse";
import { Child } from "app/child-dev-project/children/model/child";
import { School } from "app/child-dev-project/schools/model/school";

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
      filename,
      data,
      format,
      exportConfig,
    );
    const filenameWithExtension = filename + "." + format.toLowerCase();
    const link = this.createDownloadLink(blobData, filenameWithExtension);
    link.click();
  }

  private async getFormattedBlobData(
    filename :string,
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
        result = await this.createCsv(data,filename);
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
  async createCsv(data: any[],filename: string): Promise<string> {
   // Collect all properties because papa only uses the properties of the first object  
    let fields =[]
    if(filename === "Schools"){
      fields = [School.schema]
    }
   if(filename === "Children"){
    fields = [Child.schema]
   }
    const shemaData = fields[0];
    let  columnLabel ={}
    shemaData.forEach((value, key) => {
      if (value.label) {
        columnLabel[key] =value.label;
      }
    });
   
    const keys = new Set<string>();
     // Add label as a key in json data
     data = data.map(transformToReadableFormat);
     const newData = data.map((item) => {
      const newItem = {};
      for (const key in item) {
        if (columnLabel.hasOwnProperty(key)) {
          newItem[columnLabel[key]] = item[key];
        }
      }
      return newItem;
    });
   
    newData.forEach((row) => Object.keys(row).forEach((key) => keys.add(key)));

    return this.papa.unparse(newData, {
      quotes: true,
      header: true,
      newline: DownloadService.SEPARATOR_ROW,
      columns: [...keys],
    });
  }
}
