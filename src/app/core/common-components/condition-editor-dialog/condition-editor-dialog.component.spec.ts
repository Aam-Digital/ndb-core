import { TestBed } from "@angular/core/testing";
import { By } from "@angular/platform-browser";
import { MAT_DIALOG_DATA, MatDialogRef } from "@angular/material/dialog";
import { FaIconLibrary } from "@fortawesome/angular-fontawesome";
import { fas } from "@fortawesome/free-solid-svg-icons";

import {
  ConditionEditorDialogComponent,
  ConditionEditorDialogData,
} from "./condition-editor-dialog.component";
import { ConditionsEditorComponent } from "../conditions-editor/conditions-editor.component";
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
    return {
      component: fixture.componentInstance,
      editor: fixture.debugElement.query(
        By.directive(ConditionsEditorComponent),
      ).componentInstance as ConditionsEditorComponent,
    };
  }

  beforeEach(() => {
    vi.clearAllMocks();
    TestBed.resetTestingModule();
  });

  it("knows whether a condition already existed", () => {
    expect(createComponent().component.hadCondition).toBe(false);

    TestBed.resetTestingModule();
    expect(
      createComponent({ conditions: { name: "shown" } }).component.hadCondition,
    ).toBe(true);
  });

  it("passes the field options on to the editor", () => {
    expect(
      createComponent({
        showInternalIdField: true,
      }).editor.showInternalIdField(),
    ).toBe(true);
  });

  it("applies the latest condition the editor reported", () => {
    const { component, editor } = createComponent();

    editor.conditionsChange.emit({ $or: [{ center: "x" }, { gender: "m" }] });
    component.apply();

    expect(mockDialogRef.close).toHaveBeenCalledWith({
      $or: [{ center: "x" }, { gender: "m" }],
    });
  });

  it("closes with null when the editor reports no conditions", () => {
    const { component, editor } = createComponent({
      conditions: { center: "x" },
    });

    editor.conditionsChange.emit({});
    component.apply();

    expect(mockDialogRef.close).toHaveBeenCalledWith(null);
  });

  it("returns an unedited condition unchanged", () => {
    // a condition stored as a plain Mango query (no `$or`, e.g. hand-authored
    // config) must survive an unmodified Apply instead of being erased
    createComponent({ conditions: { name: "shown" } }).component.apply();
    expect(mockDialogRef.close).toHaveBeenLastCalledWith({ name: "shown" });

    TestBed.resetTestingModule();
    createComponent({
      conditions: { $or: [{ name: "shown" }] },
    }).component.apply();
    expect(mockDialogRef.close).toHaveBeenLastCalledWith({
      $or: [{ name: "shown" }],
    });
  });

  it("keeps a sibling clause next to $or instead of silently dropping it", () => {
    createComponent({
      conditions: { status: "active", $or: [{ a: 1 }, { b: 2 }] },
    }).component.apply();

    expect(mockDialogRef.close).toHaveBeenCalledWith({
      $or: [{ a: 1 }, { b: 2 }, { status: "active" }],
    });
  });

  it("removeCondition closes with null", () => {
    createComponent({
      conditions: { center: "x" },
    }).component.removeCondition();
    expect(mockDialogRef.close).toHaveBeenCalledWith(null);
  });

  it("cancel closes with undefined", () => {
    createComponent({ conditions: { center: "x" } }).component.cancel();
    expect(mockDialogRef.close).toHaveBeenCalledWith(undefined);
  });
});
