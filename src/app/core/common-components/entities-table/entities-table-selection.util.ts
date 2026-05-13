import { Entity } from "../../entity/model/entity";
import { TableRow } from "./table-row";

/**
 * Pure selection helpers for entities-table row interaction and checkbox state.
 */

/**
 * Result container for a row selection interaction.
 */
export interface MouseSelectionUpdate<T extends Entity> {
  selectedRecords: T[];
  lastSelectedRow: TableRow<T> | null;
  lastSelection: boolean | null;
}

/**
 * Detects whether the click target is inside an element marked as `.clickable`.
 */
export function isClickableTarget(target: EventTarget | null): boolean {
  const element = target as {
    closest?: (selector: string) => Element | null;
  } | null;
  return !!element?.closest?.(".clickable");
}

/**
 * Detects whether the click originated from a checkbox input.
 */
export function isCheckboxTarget(target: EventTarget | null): boolean {
  return target instanceof HTMLInputElement && target.type === "checkbox";
}

/**
 * Determines whether row-click handling should be skipped for this interaction.
 */
export function shouldSkipRowInteraction<T extends Entity>(
  target: EventTarget | null,
  row: TableRow<T>,
): boolean {
  return isClickableTarget(target) || !!row.formGroup?.enabled;
}

/**
 * Adds or removes a single record from the selected records collection.
 */
export function toggleRecordSelection<T extends Entity>(
  selectedRecords: T[],
  record: T,
  checked: boolean,
): T[] {
  if (checked) {
    return selectedRecords.includes(record)
      ? selectedRecords
      : [...selectedRecords, record];
  }

  return selectedRecords.includes(record)
    ? selectedRecords.filter((current) => current !== record)
    : selectedRecords;
}

/**
 * Applies a contiguous shift-selection update over a row index range.
 */
export function applyRangeSelection<T extends Entity>(
  selectedRecords: T[],
  selectedRows: TableRow<T>[],
  range: { start: number; end: number },
  shouldCheck: boolean,
): T[] {
  const updatedSelection = [...selectedRecords];
  for (let index = range.start; index <= range.end; index++) {
    const row = selectedRows[index];
    const isSelected = updatedSelection.includes(row.record);

    if (shouldCheck && !isSelected) {
      updatedSelection.push(row.record);
    } else if (!shouldCheck && isSelected) {
      updatedSelection.splice(updatedSelection.indexOf(row.record), 1);
    }
  }
  return updatedSelection;
}

/**
 * Computes the next selection state for a row `mousedown`, including shift-range behavior.
 */
export function updateSelectionFromMouseDown<T extends Entity>(
  selectedRecords: T[],
  selectedRows: TableRow<T>[],
  row: TableRow<T>,
  shiftKey: boolean,
  lastSelectedRow: TableRow<T> | null,
  lastSelection: boolean | null,
): MouseSelectionUpdate<T> {
  const currentIndex = selectedRows.indexOf(row);
  const anchorIndex = lastSelectedRow
    ? selectedRows.indexOf(lastSelectedRow)
    : -1;
  const canRangeSelect =
    shiftKey && !!lastSelectedRow && anchorIndex !== -1 && currentIndex !== -1;

  if (canRangeSelect) {
    const start = Math.min(anchorIndex, currentIndex);
    const end = Math.max(anchorIndex, currentIndex);
    const shouldCheck =
      lastSelection !== null
        ? !lastSelection
        : !selectedRecords.includes(row.record);

    return {
      selectedRecords: applyRangeSelection(
        selectedRecords,
        selectedRows,
        { start, end },
        shouldCheck,
      ),
      lastSelectedRow: row,
      lastSelection,
    };
  }

  const wasSelected = selectedRecords.includes(row.record);
  return {
    selectedRecords: toggleRecordSelection(
      selectedRecords,
      row.record,
      !wasSelected,
    ),
    lastSelectedRow: currentIndex !== -1 ? row : null,
    lastSelection: wasSelected,
  };
}

/**
 * Selects or clears all currently visible rows.
 */
export function selectAllRecords<T extends Entity>(
  rows: TableRow<T>[],
  checked: boolean,
): T[] {
  return checked ? rows.map((row) => row.record) : [];
}

/**
 * Returns true when selected records count matches row count.
 */
export function areAllRowsSelected<T extends Entity>(
  selectedRecords: T[],
  rowCount: number,
): boolean {
  return selectedRecords.length === rowCount;
}

/**
 * Returns true when at least one row is selected but not all rows are selected.
 */
export function isSelectionIndeterminate<T extends Entity>(
  selectedRecords: T[],
  rowCount: number,
): boolean {
  return (
    selectedRecords.length > 0 && !areAllRowsSelected(selectedRecords, rowCount)
  );
}
