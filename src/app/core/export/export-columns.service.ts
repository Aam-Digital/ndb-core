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

    const allAvailableColumns: ExportColumnConfig[] = [];
    // export column config objects keyed by their column id (for label overrides)
    const columnById = new Map<string, ExportColumnConfig>();
    // export columns contributed by each schema field, keyed by field id
    const columnsByField = new Map<
      string,
      { columnId: string; keySuffix: string }[]
    >();
    if (schema) {
      const resolvers = buildExportColumnResolvers(
        schema,
        this.entitySchemaService,
      );
      for (const r of resolvers) {
        const keySuffix = r.column.keySuffix ?? "";
        const columnId = r.sourceFieldId + keySuffix;
        if (columnId.startsWith("_")) continue;
        const col: ExportColumnConfig = {
          query: `.${columnId}`,
          label: r.column.label,
        };
        if (this.appendUnique(allAvailableColumns, col)) {
          columnById.set(columnId, col);
          const fieldColumns = columnsByField.get(r.sourceFieldId) ?? [];
          fieldColumns.push({ columnId, keySuffix });
          columnsByField.set(r.sourceFieldId, fieldColumns);
        }
      }

      // When a field offers both a raw value and a readable column (e.g. entity
      // references: id + name), distinguish the raw id column in the dialog so
      // users who need the internal id can still select it on demand.
      for (const fieldColumns of columnsByField.values()) {
        const hasReadable = fieldColumns.some(
          (c) => c.keySuffix === "_readable",
        );
        if (!hasReadable) continue;
        const base = fieldColumns.find((c) => c.keySuffix === "");
        const baseCol = base && columnById.get(base.columnId);
        if (baseCol) {
          baseCol.label = `${baseCol.label}${$localize`:export id column suffix: (ID)`}`;
        }
      }
    }

    // For each visible list column preselect the single most useful export
    // column of its underlying field: the human-readable name for entity
    // references, the derived value for virtual display columns (e.g. the age
    // for a `DisplayAge` column), otherwise the raw field value. The remaining
    // columns (e.g. the raw entity id) stay available for manual selection.
    // The preselected column keeps the label shown in the list view so the
    // export header matches what the user sees (e.g. "Age", "School").
    const preselectedKeys = new Set<string>();
    for (const colId of visibleColIds) {
      const { fieldId, isVirtual } = this.resolveUnderlyingField(
        colId,
        schema,
        availableColumns,
      );
      const fieldColumns = columnsByField.get(fieldId);
      if (!fieldColumns?.length) continue;

      const base = fieldColumns.find((c) => c.keySuffix === "");
      const readable = fieldColumns.find((c) => c.keySuffix === "_readable");
      const derived = fieldColumns.find((c) => c.keySuffix !== "");

      const chosen = isVirtual ? (derived ?? base) : (readable ?? base);
      if (!chosen) continue;
      preselectedKeys.add(chosen.columnId);

      const visibleLabel = this.getVisibleLabel(
        colId,
        schema,
        availableColumns,
      );
      const col = columnById.get(chosen.columnId);
      if (visibleLabel && col) col.label = visibleLabel;
    }

    // Admin-configured custom labels take precedence over the list view labels
    // (see EntityListConfig.exportConfig).
    for (const configured of exportConfig ?? []) {
      if (!configured.label) continue;
      const key = normalizeQueryKey(configured.query);
      const match = allAvailableColumns.find(
        (c) => normalizeQueryKey(c.query) === key,
      );
      if (match) match.label = configured.label;
    }

    const preselectedExportConfig = allAvailableColumns.filter((c) =>
      preselectedKeys.has(normalizeQueryKey(c.query)),
    );

    return { allAvailableColumns, preselectedExportConfig };
  }

  /**
   * The label shown for a column in the list view, used so exports match what
   * the user sees. Prefer the column's configured label, fall back to the
   * schema field label.
   */
  private getVisibleLabel(
    colId: string,
    schema: Map<string, any> | undefined,
    availableColumns: Array<string | ExportColumnConfig | FormFieldConfig>,
  ): string | undefined {
    const colConfig = availableColumns.find(
      (c) => this.isFormFieldConfig(c) && c.id === colId,
    );
    if (this.isFormFieldConfig(colConfig) && colConfig.label) {
      return colConfig.label;
    }
    return schema?.get(colId)?.label;
  }

  /**
   * Resolve the schema field a visible list column reads its data from.
   *
   * For most columns this is the column id itself. Virtual display columns
   * (e.g. `DisplayAge`) read from a different field referenced via `additional`,
   * so fall back to that when the column id is not a schema field.
   */
  private resolveUnderlyingField(
    colId: string,
    schema: Map<string, any> | undefined,
    availableColumns: Array<string | ExportColumnConfig | FormFieldConfig>,
  ): { fieldId: string; isVirtual: boolean } {
    if (schema?.has(colId)) return { fieldId: colId, isVirtual: false };

    const colConfig = availableColumns.find(
      (c) => this.isFormFieldConfig(c) && c.id === colId,
    );
    if (
      this.isFormFieldConfig(colConfig) &&
      typeof colConfig.additional === "string" &&
      schema?.has(colConfig.additional)
    ) {
      return { fieldId: colConfig.additional, isVirtual: true };
    }

    return { fieldId: colId, isVirtual: false };
  }

  private appendUnique(
    list: ExportColumnConfig[],
    col: ExportColumnConfig,
  ): boolean {
    const key = normalizeQueryKey(col.query);
    if (list.some((c) => normalizeQueryKey(c.query) === key)) {
      return false;
    }
    list.push(col);
    return true;
  }

  private isFormFieldConfig(v: unknown): v is FormFieldConfig {
    return typeof v === "object" && v !== null && "id" in v;
  }
}
