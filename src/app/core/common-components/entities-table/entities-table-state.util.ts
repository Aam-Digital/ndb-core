import { EntityDatatype } from "../../basic-datatypes/entity/entity.datatype";
import { Entity, EntityConstructor } from "../../entity/model/entity";
import {
  ColumnConfig,
  FormFieldConfig,
  toFormFieldConfig,
} from "../entity-form/FormConfig";

/**
 * Pure helpers for deriving entities-table column structure.
 */

/**
 * Inputs needed to derive table column metadata from entity schema and component inputs.
 */
export interface ColumnStateParams<T extends Entity> {
  entityType?: EntityConstructor<T>;
  customColumns: ColumnConfig[];
  columnsToDisplay?: string[];
  selectable: boolean;
  editable: boolean;
  actionColumnSelect: string;
  actionColumnEdit: string;
  extendFormFieldConfig: (
    config: ColumnConfig,
    entityType: EntityConstructor<T>,
  ) => FormFieldConfig;
}

/**
 * Normalized table column state consumed by `EntitiesTableComponent`.
 */
export interface ColumnState {
  customColumns: FormFieldConfig[];
  columns: FormFieldConfig[];
  columnsToDisplay: string[];
  idForSavingPagination: string;
}

/**
 * Builds the effective table column config, including custom overrides and action columns.
 */
export function buildColumnState<T extends Entity>(
  params: ColumnStateParams<T>,
): ColumnState {
  const mappedCustomColumns = mapCustomColumns(params);
  const entityColumns = params.entityType?.schema
    ? [...params.entityType.schema.entries()].map(
        ([id, field]) => ({ ...field, id }) as FormFieldConfig,
      )
    : [];

  const mergedColumns = normalizeSortingRules([
    ...entityColumns.filter(
      (column) =>
        !mappedCustomColumns.some(
          (customColumn) => customColumn.id === column.id,
        ),
    ),
    ...mappedCustomColumns,
  ]);

  const columnsToDisplay = buildColumnsToDisplay({
    explicitColumnsToDisplay: params.columnsToDisplay,
    customColumns: mappedCustomColumns,
    selectable: params.selectable,
    editable: params.editable,
    actionColumnSelect: params.actionColumnSelect,
    actionColumnEdit: params.actionColumnEdit,
  });

  return {
    customColumns: mappedCustomColumns,
    columns: mergedColumns,
    columnsToDisplay,
    idForSavingPagination: mappedCustomColumns
      .map((column) => column.id)
      .join(""),
  };
}

interface BuildColumnsToDisplayParams {
  explicitColumnsToDisplay?: string[];
  customColumns: FormFieldConfig[];
  selectable: boolean;
  editable: boolean;
  actionColumnSelect: string;
  actionColumnEdit: string;
}

function buildColumnsToDisplay(params: BuildColumnsToDisplayParams): string[] {
  let colsToDisplay = params.explicitColumnsToDisplay;
  if (!colsToDisplay || colsToDisplay.length === 0) {
    colsToDisplay = params.customColumns
      .filter((column) => !column.hideFromTable)
      .map((column) => column.id);
  }

  const columns = colsToDisplay.filter((column) => !column.startsWith("__"));
  if (params.selectable) {
    columns.unshift(params.actionColumnSelect);
  }
  if (params.editable) {
    const insertIndex = params.selectable ? 1 : 0;
    columns.splice(insertIndex, 0, params.actionColumnEdit);
  }

  return columns;
}

function mapCustomColumns<T extends Entity>(
  params: ColumnStateParams<T>,
): FormFieldConfig[] {
  return params.customColumns.map((column) =>
    params.entityType
      ? params.extendFormFieldConfig(column, params.entityType)
      : toFormFieldConfig(column),
  );
}

function normalizeSortingRules(columns: FormFieldConfig[]): FormFieldConfig[] {
  return columns.map((column) => {
    if (column.viewComponent === "DisplayAge") {
      return column;
    }

    if (
      column.isArray ||
      column.dataType === EntityDatatype.dataType ||
      !column.dataType
    ) {
      return { ...column, noSorting: true };
    }

    return column;
  });
}
