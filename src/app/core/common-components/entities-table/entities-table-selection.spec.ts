import { TestEntity } from "#src/app/utils/test-utils/TestEntity";
import {
  applyRangeSelection,
  isCheckboxTarget,
  isClickableTarget,
  shouldSkipRowInteraction,
  toggleRecordSelection,
  updateSelectionFromMouseDown,
} from "./entities-table-selection";

describe("entities-table-selection util", () => {
  it("adds and removes a selected record", () => {
    const recordA = TestEntity.create("A");
    const recordB = TestEntity.create("B");

    const added = toggleRecordSelection([recordA], recordB, true);
    expect(added).toEqual([recordA, recordB]);

    const removed = toggleRecordSelection(added, recordA, false);
    expect(removed).toEqual([recordB]);
  });

  it("applies shift-range select and unselect", () => {
    const recordA = TestEntity.create("A");
    const recordB = TestEntity.create("B");
    const recordC = TestEntity.create("C");
    const selectedRows = [
      { record: recordA },
      { record: recordB },
      { record: recordC },
    ];

    const rangeSelected = applyRangeSelection(
      [],
      selectedRows,
      { start: 0, end: 2 },
      true,
    );
    expect(rangeSelected).toEqual([recordA, recordB, recordC]);

    const rangeUnselected = applyRangeSelection(
      rangeSelected,
      selectedRows,
      { start: 1, end: 2 },
      false,
    );
    expect(rangeUnselected).toEqual([recordA]);
  });

  it("detects clickable and checkbox targets", () => {
    const clickable = document.createElement("button");
    clickable.classList.add("clickable");
    const container = document.createElement("div");
    container.appendChild(clickable);
    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";

    expect(isClickableTarget(clickable)).toBe(true);
    expect(isCheckboxTarget(checkbox)).toBe(true);
    expect(isCheckboxTarget(container)).toBe(false);
  });

  it("skips row interaction for clickable targets or enabled inline edit rows", () => {
    const record = TestEntity.create("A");
    const clickable = document.createElement("button");
    clickable.classList.add("clickable");

    expect(shouldSkipRowInteraction(clickable, { record })).toBe(true);
    expect(
      shouldSkipRowInteraction(document.createElement("div"), {
        record,
        formGroup: { enabled: true } as any,
      }),
    ).toBe(true);
  });

  it("updates selection state for normal and shift-range mouse down", () => {
    const recordA = TestEntity.create("A");
    const recordB = TestEntity.create("B");
    const recordC = TestEntity.create("C");
    const rows = [
      { record: recordA },
      { record: recordB },
      { record: recordC },
    ];

    const firstClick = updateSelectionFromMouseDown({
      selectedRecords: [],
      selectedRows: rows,
      row: rows[0],
      shiftKey: false,
      lastSelectedRow: null,
      lastSelection: null,
    });
    expect(firstClick.selectedRecords).toEqual([recordA]);
    expect(firstClick.lastSelection).toBe(false);
    expect(firstClick.lastSelectedRow).toBe(rows[0]);

    const shiftClick = updateSelectionFromMouseDown({
      selectedRecords: firstClick.selectedRecords,
      selectedRows: rows,
      row: rows[2],
      shiftKey: true,
      lastSelectedRow: firstClick.lastSelectedRow,
      lastSelection: firstClick.lastSelection,
    });
    expect(shiftClick.selectedRecords).toEqual([recordA, recordB, recordC]);
  });
});
