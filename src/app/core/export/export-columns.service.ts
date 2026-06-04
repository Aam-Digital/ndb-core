import { Injectable, inject } from "@angular/core";
import {
  ExportColumnConfig,
  normalizeQueryKey,
} from "./data-transformation-service/export-column-config";
import { EntitySchemaService } from "../entity/schema/entity-schema.service";
import { FormFieldConfig } from "../common-components/entity-form/FormConfig";
import { buildExportColumnResolvers } from "./download-service/download.service";

export interface BuildExportColumnsOptions {
  schema: Map<string, any> | undefined;
  visibleColIds: string[];
  availableColumns: Array<string | ExportColumnConfig | FormFieldConfig>;
  exportConfig?: ExportColumnConfig[];
}

export interface BuildExportColumnsResult {
  allAvailableColumns: ExportColumnConfig[];
  preselectedExportConfig: ExportColumnConfig[];
}

@Injectable({ providedIn: "root" })
export class ExportColumnsService {
  private readonly entitySchemaService = inject(EntitySchemaService);
  /**
   * Build a list of export columns available for selection and which of those
   * should be preselected based on the currently visible list columns.
   */
  buildExportColumns(
    opts: BuildExportColumnsOptions,
  ): BuildExportColumnsResult {
    const { schema, visibleColIds, availableColumns, exportConfig } = opts;

    const visibleColumnsSelection = this.buildVisibleSelection(
      schema,
      visibleColIds,
      availableColumns,
    );

    const initialExportConfig = [
      ...visibleColumnsSelection,
      ...(exportConfig ?? []),
    ];

    const allAvailableColumns = (() => {
      const result: ExportColumnConfig[] = [];

      for (const col of initialExportConfig) {
        this.appendUnique(result, col);
      }

      if (!schema) return result;

      for (const [key, field] of schema.entries()) {
        if (key.startsWith("_")) continue;
        if (field?.isInternalField) continue;
        this.appendUnique(result, { query: `.${key}`, label: field?.label });
      }

      const resolvers = buildExportColumnResolvers(
        schema,
        this.entitySchemaService,
      );
      for (const r of resolvers) {
        const keySuffix = r.column.keySuffix ?? "";
        if (keySuffix === "") continue;
        this.appendUnique(result, {
          query: `.${r.sourceFieldId}${keySuffix}`,
          label: r.column.label,
        });
      }

      return result;
    })();

    const visibleQueries = new Set(
      visibleColumnsSelection.map((c) => normalizeQueryKey(c.query)),
    );

    const preselectedExportConfig = allAvailableColumns.filter((c) =>
      visibleQueries.has(normalizeQueryKey(c.query)),
    );

    return { allAvailableColumns, preselectedExportConfig };
  }

  /**
   * Derive ExportColumnConfig entries from visible column ids. Prefer any
   * matching `FormFieldConfig` or `ExportColumnConfig` from `availableColumns`
   * to preserve labels and then fall back to schema labels.
   */
  private buildVisibleSelection(
    schema: Map<string, any> | undefined,
    visibleColIds: string[],
    availableColumns: Array<string | ExportColumnConfig | FormFieldConfig>,
  ): ExportColumnConfig[] {
    return visibleColIds.map((colId) => {
      const colConfig = availableColumns.find((c) => {
        if (typeof c === "string") return c === colId;
        if (this.isFormFieldConfig(c)) return c.id === colId;
        if (this.isExportColumnConfig(c))
          return normalizeQueryKey(c.query) === colId;
        return false;
      });

      let label: string | undefined = undefined;
      if (
        this.isFormFieldConfig(colConfig) ||
        this.isExportColumnConfig(colConfig)
      ) {
        label = colConfig.label;
      }

      if (!label && schema?.has(colId)) {
        label = schema.get(colId)?.label;
      }

      return { query: `.${colId}`, label } as ExportColumnConfig;
    });
  }

  private appendUnique(list: ExportColumnConfig[], col: ExportColumnConfig) {
    const key = normalizeQueryKey(col.query);
    if (!list.some((c) => normalizeQueryKey(c.query) === key)) {
      list.push(col);
    }
  }

  private isFormFieldConfig(v: unknown): v is FormFieldConfig {
    return typeof v === "object" && v !== null && "id" in v;
  }

  private isExportColumnConfig(v: unknown): v is ExportColumnConfig {
    return typeof v === "object" && v !== null && "query" in v;
  }
}
