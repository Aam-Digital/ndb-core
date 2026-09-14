import { TestBed } from "@angular/core/testing";
import { MAT_DIALOG_DATA, MatDialogRef } from "@angular/material/dialog";
import { FaIconLibrary } from "@fortawesome/angular-fontawesome";
import { fas } from "@fortawesome/free-solid-svg-icons";

import {
  DisplayConditionDialogComponent,
  DisplayConditionDialogData,
} from "./display-condition-dialog.component";
import { mockMatDialogRef } from "#src/app/utils/test-utils/dialog-mocks";

describe("DisplayConditionDialogComponent", () => {
  const mockDialogRef = mockMatDialogRef();

  function createComponent(data: Partial<DisplayConditionDialogData> = {}) {
    TestBed.configureTestingModule({
      imports: [DisplayConditionDialogComponent],
      providers: [
        { provide: MatDialogRef, useValue: mockDialogRef },
        {
          provide: MAT_DIALOG_DATA,
          // entityType left undefined so the embedded ConditionsEditorComponent
          // skips its (heavier) schema-dependent initialization in this unit test
          useValue: { entityType: undefined, ...data },
        },
      ],
    });
    const fixture = TestBed.createComponent(DisplayConditionDialogComponent);
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
      createComponent({
        displayCondition: { $or: [{ name: "shown" }] },
      }).combinator(),
    ).toBe("any");

    TestBed.resetTestingModule();
    const allFromMerged = createComponent({
      displayCondition: { status: "closed", name: "shown" },
    });
    expect(allFromMerged.combinator()).toBe("all");
    expect(allFromMerged.editorConditions.$or).toEqual([
      { status: "closed" },
      { name: "shown" },
    ]);

    TestBed.resetTestingModule();
    const allFromAnd = createComponent({
      displayCondition: { $and: [{ status: "closed" }, { status: "open" }] },
    });
    expect(allFromAnd.combinator()).toBe("all");
    expect(allFromAnd.editorConditions.$or).toEqual([
      { status: "closed" },
      { status: "open" },
    ]);
  });

  it("initializes editorConditions from the existing displayCondition", () => {
    const component = createComponent({
      displayCondition: { $or: [{ name: "shown" }] },
    });

    expect(component.hadCondition).toBe(true);
    expect(component.editorConditions).toEqual({
      $or: [{ name: "shown" }],
    });
  });

  it("starts with an empty condition when none exists yet", () => {
    const component = createComponent();

    expect(component.hadCondition).toBe(false);
    expect(component.editorConditions).toEqual({});
  });

  it("applies conditions according to combinator and removes empty conditions", () => {
    const component = createComponent();

    component.onConditionsChange({
      $or: [{ status: "closed" }, { name: "shown" }],
    });
    component.combinator.set("all");
    component.apply();
    expect(mockDialogRef.close).toHaveBeenCalledWith({
      status: "closed",
      name: "shown",
    });

    component.combinator.set("any");
    component.apply();
    expect(mockDialogRef.close).toHaveBeenCalledWith({
      $or: [{ status: "closed" }, { name: "shown" }],
    });

    // duplicate keys cannot be merged into one object, fall back to $and
    component.onConditionsChange({
      $or: [{ status: "closed" }, { status: "open" }],
    });
    component.combinator.set("all");
    component.apply();
    expect(mockDialogRef.close).toHaveBeenCalledWith({
      $and: [{ status: "closed" }, { status: "open" }],
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
    const component = createComponent({
      displayCondition: { name: "shown" },
    });

    component.apply();

    expect(mockDialogRef.close).toHaveBeenCalledWith({ name: "shown" });
  });

  it("applies null when no valid condition rows remain", () => {
    const component = createComponent({
      displayCondition: { $or: [{ name: "shown" }] },
    });

    component.onConditionsChange({ $or: [] });
    component.apply();

    expect(mockDialogRef.close).toHaveBeenCalledWith(null);
  });

  it("removeCondition closes with null", () => {
    const component = createComponent({
      displayCondition: { $or: [{ name: "shown" }] },
    });

    component.removeCondition();

    expect(mockDialogRef.close).toHaveBeenCalledWith(null);
  });

  it("cancel closes with undefined", () => {
    const component = createComponent({
      displayCondition: { $or: [{ name: "shown" }] },
    });

    component.cancel();

    expect(mockDialogRef.close).toHaveBeenCalledWith(undefined);
  });
});
