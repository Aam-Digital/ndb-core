import { Injectable } from "@angular/core";
import { ExportColumnConfig } from "../data-transformation-service/export-column-config";
import { ExportDataFormat } from "../export-data-directive/export-data.directive";
import { LoggingService } from "../../logging/logging.service";
import { DataTransformationService } from "../data-transformation-service/data-transformation.service";
import { transformToReadableFormat } from "../../common-components/entities-table/value-accessor/value-accessor";
import { Papa } from "ngx-papaparse";
import { EntitySchemaField } from "app/core/entity/schema/entity-schema-field";
import { Entity } from "app/core/entity/model/entity";
import { EntityDatatype } from "app/core/basic-datatypes/entity/entity.datatype";
import { DefaultDatatype } from "app/core/entity/default-datatype/default.datatype";
import { EntityArrayDatatype } from "app/core/basic-datatypes/entity-array/entity-array.datatype";
import { EntityMapperService } from "app/core/entity/entity-mapper/entity-mapper.service";

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
    private entityMapperService: EntityMapperService,
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
    console.log(
      "trigger download with data: ",
      data,
      "; format: ",
      format,
      "; filename: ",
      filename,
      "; exportConfig: ",
      exportConfig,
    );
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
        result = typeof data === "string" ? data : JSON.stringify(data); // TODO: support exportConfig for json format
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

    if (data.length > 0 && typeof data[0]?.getConstructor === "function") {
      entityConstructor = data[0].getConstructor();
    }
    console.log("entity constructor: ", entityConstructor);
    const keys = new Set<string>();
    console.log("data: ", data);
    data.forEach((row) => Object.keys(row).forEach((key) => keys.add(key)));

    data = data.map(transformToReadableFormat);

    console.log("data after map: ", data);

    if (!entityConstructor) {
      return this.papa.unparse(data, {
        quotes: true,
        header: true,
        newline: DownloadService.SEPARATOR_ROW,
        columns: [...keys],
      });
    }

    const result = await this.exportFile(data, entityConstructor);
    console.log("result: ", result);
    return result;
  }

  async exportFile(data: any[], entityConstructor: { schema: any }) {
    const entitySchema = entityConstructor.schema;
    const columnLabels = new Map<string, string>();

    console.log("entitySchema: ", entitySchema);

    entitySchema.forEach((value: EntitySchemaField, key: string) => {
      if (value.label) {
        columnLabels.set(key, value.label);
        if (value.dataType === EntityDatatype.dataType) {
          console.log("EntityDataType bei", value.label);
          columnLabels.set(key + "_readable", value.label + "_readable");
        }
        if (value.dataType === EntityArrayDatatype.dataType) {
          console.log("EntityArrayDataType bei", value.label);
          columnLabels.set(key + "_readable", value.label + "_readable");
        }
      }
    });

    console.log("columnLabels: ", columnLabels);

    const exportEntities = await Promise.all(
      data.map(async (item) => this.mapEntity(item, columnLabels)),
    );

    console.log("exportEntities; ", exportEntities);

    const columnKeys: string[] = Array.from(columnLabels.keys());
    const labels: any[] = Array.from(columnLabels.values());
    const orderedData: any[] = exportEntities.map((item) =>
      columnKeys.map((key) => item[key]),
    );

    console.log("orderedData:", orderedData);

    return this.papa.unparse(
      {
        fields: labels,
        data: orderedData,
      },
      {
        quotes: true,
        newline: DownloadService.SEPARATOR_ROW,
      },
    );
  }

  private async mapEntity(item: Entity, columnLabels): Promise<Object> {
    let newItem = {};
    for (const key in item) {
      console.log("Peter prüft key:", key);
      if (columnLabels.has(key)) {
        newItem[key] = item[key];
      }
      if (columnLabels.has(key + "_readable")) {
        let relatedEntitiesIdArray: string[] = [];
        let relatedEntitiesToStringArray: string[] = [];
        if (Array.isArray(item[key])) {
          relatedEntitiesIdArray = item[key];
        } else {
          relatedEntitiesIdArray = [...item[key]];
        }
        relatedEntitiesIdArray.forEach(async (relatedEntityId) => {
          console.log("   Peter ist hier", key);
          const type = Entity.extractTypeFromId(relatedEntityId);
          console.log(
            "   Peter type:",
            type,
            "; relatedEntityId: ",
            relatedEntityId,
          );
          let relatedEntity: Entity = await this.entityMapperService.load(
            type,
            relatedEntityId,
          );
          console.log("Peter entity", relatedEntity);
          console.log("Peter entity.toString()", relatedEntity.toString());
          relatedEntitiesToStringArray.push(relatedEntity.toString());
        });
        newItem[key + "_readable"] = relatedEntitiesToStringArray;
      }
    }
    return newItem;
  }
}
