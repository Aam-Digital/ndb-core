import { Injectable, inject } from "@angular/core";
import { ExportColumnConfig } from "../data-transformation-service/export-column-config";
import { Logging } from "../../logging/logging.service";
import { DataTransformationService } from "../data-transformation-service/data-transformation.service";
import { Papa } from "ngx-papaparse";
import { EntityConstructor } from "app/core/entity/model/entity";
import { ExportColumnMapping } from "app/core/entity/default-datatype/default.datatype";
import { EntitySchemaField } from "app/core/entity/schema/entity-schema-field";
import { EntitySchemaService } from "app/core/entity/schema/entity-schema.service";
import { Workbook } from "exceljs";

export interface ExportColumnResolver {
  sourceFieldId: string;
  schemaField: EntitySchemaField;
  column: ExportColumnMapping;
}

/**
 * Build export column resolvers for all fields in a schema.
 *
 * Iterates the schema, looks up each field's datatype, and collects
 * the columns the datatype contributes via `getExportColumns`.
 *
 * @param useFieldIdAsFallbackLabel When true, fields without an explicit label
 *   use the field id as label (useful for embedded schemas like attendance items).
 */
export function buildExportColumnResolvers(
  schema: Map<string, EntitySchemaField>,
  entitySchemaService: EntitySchemaService,
  useFieldIdAsFallbackLabel = false,
): ExportColumnResolver[] {
  const resolvers: ExportColumnResolver[] = [];

  for (const [fieldId, field] of schema.entries()) {
    if (field.isInternalField) continue;

    const schemaField: EntitySchemaField = {
      ...field,
      id: field.id ?? fieldId,
      label: field.label || (useFieldIdAsFallbackLabel ? fieldId : undefined),
    };

    const datatype =
      entitySchemaService.getDatatypeOrDefault(schemaField.dataType, true) ??
      entitySchemaService.getDatatypeOrDefault(undefined);

    for (const column of datatype.getExportColumns(schemaField)) {
      resolvers.push({ sourceFieldId: fieldId, schemaField, column });
    }
  }

  return resolvers;
}

export type FileDownloadFormat = "csv" | "json" | "pdf" | "xlsx";

/**
 * This service allows to start a download process from the browser.
 * Depending on the browser and the setting this might open a popup or directly download the file.
 */
@Injectable({ providedIn: "root" })
export class DownloadService {
  private readonly dataTransformationService = inject(
    DataTransformationService,
  );
  private readonly papa = inject(Papa);
  private readonly entitySchemaService = inject(EntitySchemaService);

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
    const objectUrl = globalThis.URL.createObjectURL(blobData);
    const link = document.createElement("a");
    link.setAttribute("style", "display:none;");
    link.href = objectUrl;
    link.download = filenameWithExtension;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    // defer revocation so the browser has time to initiate the download
    setTimeout(() => globalThis.URL.revokeObjectURL(objectUrl), 1000);
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
      case "xlsx":
        if (!Array.isArray(data)) {
          Logging.warn("XLSX export requires an array of records.");
          return new Blob([""]);
        }
        return this.createXlsx(data);
      case "pdf":
        return new Blob([data], { type: "application/pdf" });
      default:
        Logging.warn(`Not supported format: ${format}`);
        return new Blob([""]);
    }
  }

  /**
   * Creates a CSV string of the input data using the shared export data preparation.
   *
   * @param data an array of elements
   * @returns string a valid CSV string of the input data
   */
  async createCsv(data: any[]): Promise<string> {
    const [headers, ...rows] = await this.prepareExportData(data);
    return this.papa.unparse(
      { fields: headers, data: rows },
      {
        quotes: true,
        newline: DownloadService.SEPARATOR_ROW,
      },
    );
  }

  /**
   * Creates an XLSX Blob from the input data using the shared export data preparation.
   */
  async createXlsx(data: any[]): Promise<Blob> {
    const rows = await this.prepareExportData(data);
    const wb = new Workbook();
    const ws = wb.addWorksheet("Export");
    for (const row of rows) {
      ws.addRow(row);
    }
    const headerRow = ws.getRow(1);
    headerRow.font = { bold: true };
    headerRow.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FFD3D3D3" },
    };
    headerRow.commit();
    const buffer = await wb.xlsx.writeBuffer();
    return new Blob([buffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });
  }

  /**
   * Prepares export data as row arrays (header row + data rows) for use with any export format.
   *
   * For entity data: uses schema column resolvers to produce human-readable headers and values.
   * For plain objects: the first row contains the object keys as headers.
   */
  async prepareExportData(data: any[]): Promise<any[][]> {
    let entityConstructor: EntityConstructor | undefined;
    if (data.length > 0 && typeof data[0]?.getConstructor === "function") {
      entityConstructor = data[0].getConstructor();
    }

    if (!entityConstructor) {
      const mapped = data.map((row) =>
        Object.fromEntries(
          Object.entries(row).map(([key, value]) => [
            key,
            this.ensureCsvFriendlyValue(value),
          ]),
        ),
      );
      const keys =
        mapped.length > 0
          ? Array.from(new Set(mapped.flatMap((r) => Object.keys(r))))
          : [];
      return [keys, ...mapped.map((r) => keys.map((k) => r[k]))];
    }

    const entitySchema = entityConstructor.schema;
    const columnLabels = new Map<string, string>();
    const columnResolvers = new Map<string, ExportColumnResolver>();

    for (const resolver of buildExportColumnResolvers(
      entitySchema,
      this.entitySchemaService,
    )) {
      const columnId = resolver.sourceFieldId + resolver.column.keySuffix;
      columnLabels.set(columnId, resolver.column.label);
      columnResolvers.set(columnId, resolver);
    }

    const exportEntities = await Promise.all(
      data.map((item) => this.mapEntityToExportRow(item, columnResolvers)),
    );

    const columnKeys = Array.from(columnLabels.keys());
    const headers = Array.from(columnLabels.values());
    return [
      headers,
      ...exportEntities.map((item) => columnKeys.map((key) => item[key])),
    ];
  }

  private async mapEntityToExportRow(
    item: any,
    columnResolvers: Map<string, ExportColumnResolver>,
  ): Promise<Object> {
    const newItem = {};

    for (const [columnId, resolver] of columnResolvers.entries()) {
      const formattedValue = await resolver.column.resolveValue(
        item[resolver.sourceFieldId],
        resolver.schemaField,
      );
      newItem[columnId] = this.ensureCsvFriendlyValue(formattedValue);
    }

    return newItem;
  }

  /**
   * Avoid broken CSV output such as "[object Object]" by serializing only when needed.
   */
  private ensureCsvFriendlyValue(value: any): any {
    if (value === null || value === undefined) {
      return value;
    }

    if (Array.isArray(value)) {
      return value.some((entry) => String(entry) === "[object Object]")
        ? JSON.stringify(value)
        : value;
    }

    if (typeof value === "object" && String(value) === "[object Object]") {
      return JSON.stringify(value);
    }

    return value;
  }
}
