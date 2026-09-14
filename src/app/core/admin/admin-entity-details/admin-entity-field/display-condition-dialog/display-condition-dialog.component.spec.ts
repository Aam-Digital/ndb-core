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

  it("applies the edited condition", () => {
    const component = createComponent();

    component.onConditionsChange({ $or: [{ name: "shown" }] });
    component.apply();

    expect(mockDialogRef.close).toHaveBeenCalledWith({
      $or: [{ name: "shown" }],
    });
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
