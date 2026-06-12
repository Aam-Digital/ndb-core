import { Injectable, inject } from "@angular/core";
import { Logging } from "../../logging/logging.service";
import {
  ExportColumnConfig,
  normalizeQueryKey,
} from "../data-transformation-service/export-column-config";
import { Papa } from "ngx-papaparse";
import { EntityConstructor } from "app/core/entity/model/entity";
import { ExportColumnMapping } from "app/core/entity/default-datatype/default.datatype";
import { EntitySchemaField } from "app/core/entity/schema/entity-schema-field";
import { EntitySchemaService } from "app/core/entity/schema/entity-schema.service";
import { Workbook } from "exceljs";
import moment from "moment";

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

export type FileDownloadFormat = "csv" | "json" | "pdf" | "xlsx" | "zip";

/**
 * This service allows to start a download process from the browser.
 * Depending on the browser and the setting this might open a popup or directly download the file.
 */
@Injectable({ providedIn: "root" })
export class DownloadService {
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
   * @param selectedColumns optional list of export column keys to restrict (and order) the exported columns
   */
  async triggerDownload(
    data: any,
    format: FileDownloadFormat,
    filename: string,
    selectedColumns?: ExportColumnConfig[],
  ) {
    const blobData = await this.getFormattedBlobData(
      data,
      format,
      selectedColumns,
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
    selectedColumns?: ExportColumnConfig[],
  ): Promise<Blob> {
    let result = "";

    switch (format.toLowerCase()) {
      case "json":
        result = typeof data === "string" ? data : JSON.stringify(data); // TODO: support column selection for json format
        return new Blob([result], { type: "application/json" });
      case "csv":
        if (Array.isArray(data)) {
          result = await this.createCsv(data, selectedColumns);
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
        return this.createXlsx(data, selectedColumns);
      case "pdf":
        return new Blob([data], { type: "application/pdf" });
      case "zip":
        return new Blob([data], { type: "application/zip" });
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
  async createCsv(
    data: any[],
    selectedColumns?: ExportColumnConfig[],
  ): Promise<string> {
    const [headers, ...rows] = await this.prepareExportData(
      data,
      selectedColumns,
    );
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
  async createXlsx(
    data: any[],
    selectedColumns?: ExportColumnConfig[],
  ): Promise<Blob> {
    const rows = await this.prepareExportData(data, selectedColumns);
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
  async prepareExportData(
    data: any[],
    selectedColumns?: ExportColumnConfig[],
  ): Promise<any[][]> {
    // map of selected column key -> custom label (e.g. the list view column label)
    const selectedKeys = selectedColumns?.map((c) =>
      normalizeQueryKey(c.query),
    );
    const labelOverrides = new Map<string, string>();
    for (const c of selectedColumns ?? []) {
      if (c.label) labelOverrides.set(normalizeQueryKey(c.query), c.label);
    }

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
      const allKeys =
        mapped.length > 0
          ? Array.from(new Set(mapped.flatMap((r) => Object.keys(r))))
          : [];
      const keys = selectedKeys
        ? selectedKeys.filter((k) => allKeys.includes(k))
        : allKeys;
      const headers = keys.map((k) => labelOverrides.get(k) ?? k);
      return [headers, ...mapped.map((r) => keys.map((k) => r[k]))];
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

    // Keep selected columns that have no schema resolver (e.g. runtime-attached
    // fields like a Child's `schoolId`, or configured query-expression columns)
    // and read their value directly from the entity, so they are not silently
    // dropped from the export.
    const columnKeys = selectedKeys ?? Array.from(columnLabels.keys());
    const headers = columnKeys.map(
      (key) => labelOverrides.get(key) ?? columnLabels.get(key) ?? key,
    );
    return [
      headers,
      ...data.map((item, i) =>
        columnKeys.map((key) =>
          columnResolvers.has(key)
            ? exportEntities[i][key]
            : this.ensureCsvFriendlyValue(item[key]),
        ),
      ),
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
   * Convert a value to a CSV/XLSX-friendly primitive, applying the same readable
   * transformations as the UI (dates as YYYY-MM-DD, enum labels, location strings).
   */
  private ensureCsvFriendlyValue(value: any): any {
    if (value === null || value === undefined) {
      return value;
    }

    if (value instanceof Date) {
      return moment(value).format("YYYY-MM-DD");
    }

    if (Array.isArray(value)) {
      return value.map((entry) => this.ensureCsvFriendlyValue(entry)).join(",");
    }

    if (typeof value === "object") {
      if ("label" in value) {
        return value.label;
      }
      if ("locationString" in value) {
        return value.locationString;
      }
      return JSON.stringify(value);
    }

    return value;
  }
}
