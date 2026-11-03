import { TestEntity } from "#src/app/utils/test-utils/TestEntity";
import {
  applyRangeSelection,
  isCheckboxTarget,
  isClickableTarget,
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
    const rows = [recordA, recordB, recordC];

    const rangeSelected = applyRangeSelection(
      [],
      rows,
      { start: 0, end: 2 },
      true,
    );
    expect(rangeSelected).toEqual([recordA, recordB, recordC]);

    const rangeUnselected = applyRangeSelection(
      rangeSelected,
      rows,
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

  it("updates selection state for normal and shift-range mouse down", () => {
    const recordA = TestEntity.create("A");
    const recordB = TestEntity.create("B");
    const recordC = TestEntity.create("C");
    const rows = [recordA, recordB, recordC];

    const firstClick = updateSelectionFromMouseDown({
      selectedRecords: [],
      currentPageRows: rows,
      record: recordA,
      shiftKey: false,
      lastSelectedRecord: null,
      lastSelection: null,
    });
    expect(firstClick.selectedRecords).toEqual([recordA]);
    expect(firstClick.lastSelection).toBe(false);
    expect(firstClick.lastSelectedRecord).toBe(recordA);

    // the range is taken from the current order of the page, e.g. after sorting changed
    const resortedRows = [recordC, recordA, recordB];
    const shiftClick = updateSelectionFromMouseDown({
      selectedRecords: firstClick.selectedRecords,
      currentPageRows: resortedRows,
      record: recordB,
      shiftKey: true,
      lastSelectedRecord: firstClick.lastSelectedRecord,
      lastSelection: firstClick.lastSelection,
    });
    expect(shiftClick.selectedRecords).toEqual([recordA, recordB]);
  });
});
