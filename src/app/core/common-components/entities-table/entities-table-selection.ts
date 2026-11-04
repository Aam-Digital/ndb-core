import { computed, Injectable, signal } from "@angular/core";
import { Entity } from "../../entity/model/entity";

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
  lastSelectedRecord: T | null;
  lastSelection: boolean | null;
}

/**
 * Input values required to calculate mouse-based row selection updates.
 */
export interface MouseSelectionInput<T extends Entity> {
  selectedRecords: T[];
  /** records of the page the interaction happened on, in displayed order */
  currentPageRows: T[];
  /** the record of the row the interaction happened on */
  record: T;
  shiftKey: boolean;
  lastSelectedRecord: T | null;
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
  records: T[],
  range: { start: number; end: number },
  shouldCheck: boolean,
): T[] {
  const updatedSelection = [...selectedRecords];
  for (let index = range.start; index <= range.end; index++) {
    const record = records[index];
    const isSelected = updatedSelection.includes(record);

    if (shouldCheck && !isSelected) {
      updatedSelection.push(record);
    } else if (!shouldCheck && isSelected) {
      updatedSelection.splice(updatedSelection.indexOf(record), 1);
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
    currentPageRows,
    record,
    shiftKey,
    lastSelectedRecord,
    lastSelection,
  } = input;
  const currentIndex = currentPageRows.indexOf(record);
  const anchorIndex = lastSelectedRecord
    ? currentPageRows.indexOf(lastSelectedRecord)
    : -1;
  const canRangeSelect =
    shiftKey &&
    !!lastSelectedRecord &&
    anchorIndex !== -1 &&
    currentIndex !== -1;

  if (canRangeSelect) {
    const start = Math.min(anchorIndex, currentIndex);
    const end = Math.max(anchorIndex, currentIndex);
    const shouldCheck =
      lastSelection !== null
        ? !lastSelection
        : !selectedRecords.includes(record);

    return {
      selectedRecords: applyRangeSelection(
        selectedRecords,
        currentPageRows,
        { start, end },
        shouldCheck,
      ),
      lastSelectedRecord: record,
      lastSelection,
    };
  }

  const wasSelected = selectedRecords.includes(record);
  return {
    selectedRecords: toggleRecordSelection(
      selectedRecords,
      record,
      !wasSelected,
    ),
    lastSelectedRecord: currentIndex !== -1 ? record : null,
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
  /** all filtered records across all pages, which "select all" applies to unless they are not selectable */
  filteredRows: ReadSignal<T[]>;
  /** records of the currently displayed page, in displayed order */
  currentPageRows: ReadSignal<T[]>;
  /**
   * whether a record can be selected (e.g. not if its row options say so);
   * the table unselects every record that is not, whoever selected it
   */
  isSelectable: ReadSignal<(record: T) => boolean>;
}

/**
 * Component-scoped signal store for entities-table selection state and interaction logic.
 *
 * Uses the pure helpers above for all stateless computations;
 * this store is responsible only for holding the mutable state
 * (lastSelectedRecord, lastSelection) and coordinating updates.
 */
@Injectable()
export class EntitiesTableSelectionStore<T extends Entity> {
  private context: EntitiesTableSelectionContext<T>;
  private readonly lastSelectedRecord = signal<T | null>(null);
  private readonly lastSelection = signal<boolean | null>(null);

  /** the records that "select all" selects */
  private readonly selectableRows = computed(() => {
    if (!this.context) return [];
    const isSelectable = this.context.isSelectable();
    return this.context.filteredRows().filter(isSelectable);
  });

  readonly allRowsSelected = computed(() => {
    const selected = this.context?.selectedRecords() ?? [];
    const total = this.selectableRows().length;
    return selected.length > 0 && selected.length === total;
  });

  readonly selectionIndeterminate = computed(() => {
    const selected = this.context?.selectedRecords() ?? [];
    const total = this.selectableRows().length;
    return selected.length > 0 && selected.length < total;
  });

  /** Connects component input/model signals to this store. Must be called once from component constructor. */
  connect(context: EntitiesTableSelectionContext<T>) {
    this.context = context;
  }

  /** Selects or unselects the record of a single row. */
  selectRow(record: T, checked: boolean) {
    this.context.selectedRecords.set(
      toggleRecordSelection(this.context.selectedRecords(), record, checked),
    );
  }

  /** Selects or unselects all rows loaded into the table. */
  selectAllRows(checked: boolean) {
    this.context.selectedRecords.set(checked ? [...this.selectableRows()] : []);
  }

  /**
   * Applies row selection interaction for mouse-down in selectable mode.
   * Returns whether the event came from a checkbox target.
   */
  handleSelectableRowMouseDown(event: MouseEvent, record: T): boolean {
    const nextState = updateSelectionFromMouseDown({
      selectedRecords: this.context.selectedRecords(),
      currentPageRows: this.context.currentPageRows(),
      record,
      shiftKey: event.shiftKey,
      lastSelectedRecord: this.lastSelectedRecord(),
      lastSelection: this.lastSelection(),
    });
    this.context.selectedRecords.set(nextState.selectedRecords);
    this.lastSelectedRecord.set(nextState.lastSelectedRecord);
    this.lastSelection.set(nextState.lastSelection);
    return isCheckboxTarget(event.target);
  }
}
