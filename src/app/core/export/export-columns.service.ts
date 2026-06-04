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
  exportConfig?: ExportColumnConfig[] | undefined;
}

export interface BuildExportColumnsResult {
  allAvailableColumns: ExportColumnConfig[];
  preselectedExportConfig: ExportColumnConfig[];
}

@Injectable({ providedIn: "root" })
export class ExportColumnsService {
  private readonly entitySchemaService = inject(EntitySchemaService);

  buildExportColumns(
    opts: BuildExportColumnsOptions,
  ): BuildExportColumnsResult {
    const { schema, visibleColIds, availableColumns, exportConfig } = opts;

    // use shared normalizer
    const toQueryKey = normalizeQueryKey;

    const isFormFieldConfig = (v: unknown): v is FormFieldConfig =>
      typeof v === "object" && v !== null && "id" in v;

    const isExportColumnConfig = (v: unknown): v is ExportColumnConfig =>
      typeof v === "object" && v !== null && "query" in v;

    const visibleColumnsSelection: ExportColumnConfig[] = visibleColIds.map(
      (colId) => {
        const colConfig = availableColumns.find((c) => {
          if (typeof c === "string") return c === colId;
          if (isFormFieldConfig(c)) return c.id === colId;
          if (isExportColumnConfig(c)) return toQueryKey(c.query) === colId;
          return false;
        });

        let label: string | undefined = undefined;
        if (isFormFieldConfig(colConfig)) {
          label = colConfig.label;
        } else if (isExportColumnConfig(colConfig)) {
          label = colConfig.label;
        }

        if (!label && schema && schema.has(colId)) {
          label = schema.get(colId)?.label;
        }

        return { query: `.${colId}`, label } as ExportColumnConfig;
      },
    );

    const initialExportConfig = [
      ...visibleColumnsSelection,
      ...(exportConfig ?? []),
    ];

    const appendUnique = (
      list: ExportColumnConfig[],
      col: ExportColumnConfig,
    ) => {
      const key = toQueryKey(col.query);
      if (!list.some((c) => toQueryKey(c.query) === key)) {
        list.push(col);
      }
    };

    const allAvailableColumns = (() => {
      const result: ExportColumnConfig[] = [];

      for (const col of initialExportConfig) {
        appendUnique(result, col);
      }

      if (!schema) return result;

      for (const [key, field] of schema.entries()) {
        if (key.startsWith("_")) continue;
        if (field?.isInternalField) continue;
        appendUnique(result, { query: `.${key}`, label: field?.label });
      }

      const resolvers = buildExportColumnResolvers(
        schema,
        this.entitySchemaService,
      );
      for (const r of resolvers) {
        const keySuffix = r.column.keySuffix ?? "";
        if (keySuffix === "") continue;
        appendUnique(result, {
          query: `.${r.sourceFieldId}${keySuffix}`,
          label: r.column.label,
        });
      }

      return result;
    })();

    const visibleQueries = new Set(
      visibleColumnsSelection.map((c) => toQueryKey(c.query)),
    );
    const preselectedExportConfig = allAvailableColumns.filter((c) =>
      visibleQueries.has(toQueryKey(c.query)),
    );

    return { allAvailableColumns, preselectedExportConfig };
  }
}
