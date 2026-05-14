import { computed, Injectable, signal } from "@angular/core";
import { Entity } from "../../entity/model/entity";
import { TableRow } from "./table-row";

/**
 * Pure selection helpers for entities-table row interaction
 * and checkbox state.
 * And EntitiesTableSelectionStore for holding selection state and coordinating updates.
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
 * Input values required to calculate mouse-based row selection updates.
 */
export interface MouseSelectionInput<T extends Entity> {
  selectedRecords: T[];
  selectedRows: TableRow<T>[];
  row: TableRow<T>;
  shiftKey: boolean;
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
  input: MouseSelectionInput<T>,
): MouseSelectionUpdate<T> {
  const {
    selectedRecords,
    selectedRows,
    row,
    shiftKey,
    lastSelectedRow,
    lastSelection,
  } = input;
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

// ---------------------------------------------------------------------------
// Selection Store
// ---------------------------------------------------------------------------

type ReadSignal<T> = () => T;
type ModelSignal<T> = ReadSignal<T> & { set(value: T): void };

/**
 * Input signals consumed by `EntitiesTableSelectionStore`.
 */
export interface EntitiesTableSelectionContext<T extends Entity> {
  selectedRecords: ModelSignal<T[]>;
  sortedRows: ReadSignal<TableRow<T>[]>;
  getCurrentPageRows: () => TableRow<T>[];
}

/**
 * Component-scoped signal store for entities-table selection state and interaction logic.
 *
 * Uses the pure helpers above for all stateless computations;
 * this store is responsible only for holding the mutable state
 * (lastSelectedRow, lastSelection) and coordinating updates.
 */
@Injectable()
export class EntitiesTableSelectionStore<T extends Entity> {
  private context: EntitiesTableSelectionContext<T>;
  private readonly lastSelectedRow = signal<TableRow<T> | null>(null);
  private readonly lastSelection = signal<boolean | null>(null);

  readonly allRowsSelected = computed(() => {
    const selected = this.context?.selectedRecords() ?? [];
    const total = this.context?.sortedRows().length ?? 0;
    return selected.length > 0 && selected.length === total;
  });

  readonly selectionIndeterminate = computed(() => {
    const selected = this.context?.selectedRecords() ?? [];
    const total = this.context?.sortedRows().length ?? 0;
    return selected.length > 0 && selected.length < total;
  });

  /** Connects component input/model signals to this store. Must be called once from component constructor. */
  connect(context: EntitiesTableSelectionContext<T>) {
    this.context = context;
  }

  /** Selects or unselects a single row record. */
  selectRow(row: TableRow<T>, checked: boolean) {
    this.context.selectedRecords.set(
      toggleRecordSelection(
        this.context.selectedRecords(),
        row.record,
        checked,
      ),
    );
  }

  /** Selects or unselects all currently sorted rows. */
  selectAllRows(checked: boolean) {
    this.context.selectedRecords.set(
      checked ? this.context.sortedRows().map((r) => r.record) : [],
    );
  }

  /**
   * Applies row selection interaction for mouse-down in selectable mode.
   * Returns whether the event came from a checkbox target.
   */
  handleSelectableRowMouseDown(event: MouseEvent, row: TableRow<T>): boolean {
    const selectedRows = this.context.getCurrentPageRows();
    const nextState = updateSelectionFromMouseDown({
      selectedRecords: this.context.selectedRecords(),
      selectedRows,
      row,
      shiftKey: event.shiftKey,
      lastSelectedRow: this.lastSelectedRow(),
      lastSelection: this.lastSelection(),
    });
    this.context.selectedRecords.set(nextState.selectedRecords);
    this.lastSelectedRow.set(nextState.lastSelectedRow);
    this.lastSelection.set(nextState.lastSelection);
    return isCheckboxTarget(event.target);
  }
}
