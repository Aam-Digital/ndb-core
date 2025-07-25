import { Injectable, inject } from "@angular/core";
import { ExportColumnConfig } from "../data-transformation-service/export-column-config";
import { Logging } from "../../logging/logging.service";
import { DataTransformationService } from "../data-transformation-service/data-transformation.service";
import { transformToReadableFormat } from "../../common-components/entities-table/value-accessor/value-accessor";
import { Papa } from "ngx-papaparse";
import { Entity, EntityConstructor } from "app/core/entity/model/entity";
import { EntityDatatype } from "app/core/basic-datatypes/entity/entity.datatype";
import { EntityMapperService } from "app/core/entity/entity-mapper/entity-mapper.service";

export type FileDownloadFormat = "csv" | "json" | "pdf";

/**
 * This service allows to start a download process from the browser.
 * Depending on the browser and the setting this might open a popup or directly download the file.
 */
@Injectable({ providedIn: "root" })
export class DownloadService {
  private dataTransformationService = inject(DataTransformationService);
  private papa = inject(Papa);
  private entityMapperService = inject(EntityMapperService);

  /** CSV row separator */
  static readonly SEPARATOR_ROW = "\n";
  /** CSV column/field separator */
  static readonly SEPARATOR_COL = ",";

  /**
   * Starts the download process with the provided data
   * @param data content of the file that will be downloaded
   * @param format extension of the file that will be downloaded, support is 'csv' and 'json'
   * @param filename of the file that will be downloaded
   * @param exportConfig special configuration that will be applied to the 'data' before triggering the download
   */
  async triggerDownload(
    data: any,
    format: FileDownloadFormat,
    filename: string,
    exportConfig?: ExportColumnConfig[],
  ) {
    const blobData = await this.getFormattedBlobData(
      data,
      format,
      exportConfig,
    );
    const filenameWithExtension = filename.endsWith("." + format)
      ? filename
      : filename + "." + format;
    const link = this.createDownloadLink(blobData, filenameWithExtension);
    link.click();
  }

  private async getFormattedBlobData(
    data: any,
    format: FileDownloadFormat,
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
        if (Array.isArray(data)) {
          result = await this.createCsv(data);
        } else {
          // assume raw csv data
          result = data;
        }
        return new Blob([result], { type: "text/csv" });
      case "pdf":
        return new Blob([data], { type: "application/pdf" });
      default:
        Logging.warn(`Not supported format: ${format}`);
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

    const result = await this.exportFile(data, entityConstructor);
    return result;
  }

  async exportFile(data: any[], entityConstructor: EntityConstructor) {
    const entitySchema = entityConstructor.schema;
    const columnLabels = new Map<string, string>();

    for (const [id, field] of entitySchema.entries()) {
      if (!field.label) {
        // skip "technical" fields without an explicit label
        continue;
      }

      columnLabels.set(id, field.label);

      if (field.dataType === EntityDatatype.dataType) {
        columnLabels.set(id + "_readable", field.label + " (readable)");
      }
    }

    const exportEntities = await Promise.all(
      data.map((item) => this.mapEntityToExportRow(item, columnLabels)),
    );

    const columnKeys: string[] = Array.from(columnLabels.keys());
    const labels: any[] = Array.from(columnLabels.values());
    const orderedData: any[] = exportEntities.map((item) =>
      columnKeys.map((key) => item[key]),
    );

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

  private async mapEntityToExportRow(
    item: Entity,
    columnLabels: Map<string, string>,
  ): Promise<Object> {
    const newItem = {};
    for (const key in item) {
      if (columnLabels.has(key)) {
        newItem[key] = item[key];
      }

      if (columnLabels.has(key + "_readable")) {
        newItem[key + "_readable"] = await this.loadRelatedEntitiesToString(
          item[key],
        );
      }
    }
    return newItem;
  }

  private async loadRelatedEntitiesToString(
    value: string | string[],
  ): Promise<string[]> {
    if (!value) return [];

    const relatedEntitiesToStrings: string[] = [];

    const relatedEntitiesIds: string[] = Array.isArray(value) ? value : [value];
    for (const relatedEntityId of relatedEntitiesIds) {
      relatedEntitiesToStrings.push(
        (
          await this.entityMapperService
            .load(Entity.extractTypeFromId(relatedEntityId), relatedEntityId)
            .catch((e) => "<not_found>")
        ).toString(),
      );
    }

    return relatedEntitiesToStrings;
  }
}
