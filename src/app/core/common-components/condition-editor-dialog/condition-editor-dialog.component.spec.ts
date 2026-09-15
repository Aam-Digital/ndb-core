import { TestBed } from "@angular/core/testing";
import { MAT_DIALOG_DATA, MatDialogRef } from "@angular/material/dialog";
import { FaIconLibrary } from "@fortawesome/angular-fontawesome";
import { fas } from "@fortawesome/free-solid-svg-icons";

import {
  ConditionEditorDialogComponent,
  ConditionEditorDialogData,
} from "./condition-editor-dialog.component";
import { mockMatDialogRef } from "#src/app/utils/test-utils/dialog-mocks";

describe("ConditionEditorDialogComponent", () => {
  const mockDialogRef = mockMatDialogRef();

  const defaultData: ConditionEditorDialogData = {
    // entityConstructor left undefined so the embedded ConditionsEditorComponent
    // skips its (heavier) schema-dependent initialization in this unit test
    entityConstructor: undefined,
    explanation: "Only shown where…",
  };

  function createComponent(data: Partial<ConditionEditorDialogData> = {}) {
    TestBed.configureTestingModule({
      imports: [ConditionEditorDialogComponent],
      providers: [
        { provide: MatDialogRef, useValue: mockDialogRef },
        {
          provide: MAT_DIALOG_DATA,
          useValue: { ...defaultData, ...data },
        },
      ],
    });
    const fixture = TestBed.createComponent(ConditionEditorDialogComponent);
    TestBed.inject(FaIconLibrary).addIconPacks(fas);
    fixture.detectChanges();
    return fixture.componentInstance;
  }

  beforeEach(() => {
    vi.clearAllMocks();
    TestBed.resetTestingModule();
  });

  it("derives combinator and editor rows from existing conditions of different shapes", () => {
    expect(
      createComponent({ conditions: { $or: [{ gender: "m" }] } }).combinator(),
    ).toBe("any");

    TestBed.resetTestingModule();
    const allFromMerged = createComponent({
      conditions: { center: "x", gender: "m" },
    });
    expect(allFromMerged.combinator()).toBe("all");
    expect(allFromMerged.editorConditions.$or).toEqual([
      { center: "x" },
      { gender: "m" },
    ]);

    TestBed.resetTestingModule();
    const allFromAnd = createComponent({
      conditions: { $and: [{ center: "x" }, { center: "y" }] },
    });
    expect(allFromAnd.combinator()).toBe("all");
    expect(allFromAnd.editorConditions.$or).toEqual([
      { center: "x" },
      { center: "y" },
    ]);
  });

  it("initializes editorConditions and hadCondition from the existing condition", () => {
    const component = createComponent({
      conditions: { $or: [{ name: "shown" }] },
    });

    expect(component.hadCondition).toBe(true);
    expect(component.editorConditions).toEqual({ $or: [{ name: "shown" }] });
  });

  it("starts with an empty condition and hadCondition false when none exists yet", () => {
    const component = createComponent();

    expect(component.hadCondition).toBe(false);
    expect(component.editorConditions).toEqual({});
  });

  it("applies conditions according to combinator and removes empty conditions", () => {
    const component = createComponent();

    component.onConditionsChange({ $or: [{ center: "x" }, { gender: "m" }] });
    component.combinator.set("all");
    component.apply();
    expect(mockDialogRef.close).toHaveBeenCalledWith({
      center: "x",
      gender: "m",
    });

    component.combinator.set("any");
    component.apply();
    expect(mockDialogRef.close).toHaveBeenCalledWith({
      $or: [{ center: "x" }, { gender: "m" }],
    });

    // duplicate keys cannot be merged into one object, fall back to $and
    component.onConditionsChange({ $or: [{ center: "x" }, { center: "y" }] });
    component.combinator.set("all");
    component.apply();
    expect(mockDialogRef.close).toHaveBeenCalledWith({
      $and: [{ center: "x" }, { center: "y" }],
    });

    // no valid rows left -> null signals "remove condition"
    component.onConditionsChange({ $or: [{}] });
    component.apply();
    expect(mockDialogRef.close).toHaveBeenCalledWith(null);
  });

  it("preserves a direct (non-$or) condition when applied without changes", () => {
    // regression test: a condition stored as a direct Mango query (no `$or`, e.g.
    // hand-authored config) must survive an unmodified Apply instead of being
    // treated as empty and erased
    const component = createComponent({ conditions: { name: "shown" } });

    component.apply();

    expect(mockDialogRef.close).toHaveBeenCalledWith({ name: "shown" });
  });

  it("removeCondition closes with null", () => {
    const component = createComponent({ conditions: { center: "x" } });
    component.removeCondition();
    expect(mockDialogRef.close).toHaveBeenCalledWith(null);
  });

  it("cancel closes with undefined", () => {
    const component = createComponent({ conditions: { center: "x" } });
    component.cancel();
    expect(mockDialogRef.close).toHaveBeenCalledWith(undefined);
  });
});
