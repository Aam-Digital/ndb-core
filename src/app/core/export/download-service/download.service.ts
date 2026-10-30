import { Injectable, inject } from "@angular/core";
import { Logging } from "../../logging/logging.service";
import { resolveLocaleText } from "../../language/active-locale";
import {
  ExportColumnConfig,
  normalizeQueryKey,
} from "../data-transformation-service/export-column-config";
import { Papa } from "ngx-papaparse";
import { EntityConstructor } from "app/core/entity/model/entity";
import { ExportContext } from "app/core/entity/default-datatype/default.datatype";
import { EntitySchemaService } from "app/core/entity/schema/entity-schema.service";
import { Workbook } from "exceljs";
import { mapInBatches } from "app/utils/utils";
import { EXPORT_BATCH_SIZE } from "../readable-entity-name";
import {
  buildExportColumnResolvers,
  ExportColumnResolver,
} from "../export-column-resolvers";
import { toExportValue } from "../export-value";

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
        if (!Array.isArray(data) && typeof data !== "string") {
          Logging.warn(
            "XLSX export requires an array of records or a CSV string.",
          );
          return new Blob([""]);
        }
        return this.createXlsx(data, selectedColumns);
      case "pdf":
        return new Blob([data], { type: "application/pdf" });
      case "zip":
        return new Blob([data], { type: "application/zip" });
      default:
        Logging.warn("Export format not supported", { format });
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
   * Creates an XLSX Blob from the input data.
   *
   * Accepts either an array of records (transformed via the shared export data
   * preparation) or a raw, pre-formatted CSV string (e.g. a hierarchical SQL
   * report). The raw-string path mirrors {@link getFormattedBlobData}'s CSV
   * handling so the same data can be exported to both CSV and XLSX.
   */
  async createXlsx(
    data: any[] | string,
    selectedColumns?: ExportColumnConfig[],
  ): Promise<Blob> {
    const rows =
      typeof data === "string"
        ? this.parseCsvToRows(data)
        : await this.prepareExportData(data, selectedColumns);
    return this.buildXlsxBlob(rows);
  }

  /** Parses a raw CSV string into an array of row arrays for XLSX output. */
  private parseCsvToRows(csv: string): any[][] {
    const parsed = this.papa.parse(csv, { skipEmptyLines: true });
    return (parsed?.data as any[][]) ?? [];
  }

  /** Builds a styled XLSX workbook Blob from an array of row arrays. */
  private async buildXlsxBlob(rows: any[][]): Promise<Blob> {
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
      const label = resolveLocaleText(c.label);
      if (label) labelOverrides.set(normalizeQueryKey(c.query), label);
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
            toExportValue(value),
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

    // Keep selected columns that have no schema resolver (e.g. runtime-attached
    // fields like a Child's `schoolId`, or configured query-expression columns)
    // and read their value directly from the entity, so they are not silently
    // dropped from the export.
    const columnKeys = selectedKeys ?? Array.from(columnLabels.keys());

    // Only resolve the selected columns: resolving a column can require loading
    // referenced entities, which is wasted effort for columns that are not exported.
    const selectedResolvers = new Map(
      columnKeys
        .filter((key) => columnResolvers.has(key))
        .map((key) => [key, columnResolvers.get(key)]),
    );
    const exportContext: ExportContext = { entityNameCache: new Map() };
    const exportEntities = await mapInBatches(data, EXPORT_BATCH_SIZE, (item) =>
      this.mapEntityToExportRow(item, selectedResolvers, exportContext),
    );

    const headers = columnKeys.map(
      (key) => labelOverrides.get(key) ?? columnLabels.get(key) ?? key,
    );
    return [
      headers,
      ...data.map((item, i) =>
        columnKeys.map((key) =>
          columnResolvers.has(key)
            ? exportEntities[i][key]
            : toExportValue(item[key]),
        ),
      ),
    ];
  }

  private async mapEntityToExportRow(
    item: any,
    columnResolvers: Map<string, ExportColumnResolver>,
    exportContext: ExportContext,
  ): Promise<Object> {
    const newItem = {};

    for (const [columnId, resolver] of columnResolvers.entries()) {
      const formattedValue = await resolver.column.resolveValue(
        item[resolver.sourceFieldId],
        resolver.schemaField,
        exportContext,
      );
      newItem[columnId] = toExportValue(formattedValue);
    }

    return newItem;
  }
}
