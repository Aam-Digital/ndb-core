import { TestBed } from "@angular/core/testing";
import { MAT_DIALOG_DATA, MatDialogRef } from "@angular/material/dialog";
import { FaIconLibrary } from "@fortawesome/angular-fontawesome";
import { fas } from "@fortawesome/free-solid-svg-icons";

import {
  PermissionConditionDialogComponent,
  PermissionConditionDialogData,
} from "./permission-condition-dialog.component";
import { EntityRegistry } from "../../../entity/database-entity.decorator";

describe("PermissionConditionDialogComponent", () => {
  const mockDialogRef = { close: vi.fn() };

  function createComponent(data: Partial<PermissionConditionDialogData> = {}) {
    TestBed.configureTestingModule({
      imports: [PermissionConditionDialogComponent],
      providers: [
        { provide: MatDialogRef, useValue: mockDialogRef },
        {
          provide: MAT_DIALOG_DATA,
          useValue: {
            roleName: "user_app",
            action: "read",
            subject: "Child",
            ...data,
          },
        },
        { provide: EntityRegistry, useValue: new EntityRegistry() },
      ],
    });
    const fixture = TestBed.createComponent(PermissionConditionDialogComponent);
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

  it("applies conditions according to combinator and removes empty conditions", () => {
    const component = createComponent({});

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

    // no valid rows left -> null signals "remove conditions"
    component.onConditionsChange({ $or: [{}] });
    component.apply();
    expect(mockDialogRef.close).toHaveBeenCalledWith(null);
  });

  it("removeConditions closes with null", () => {
    const component = createComponent({ conditions: { center: "x" } });
    component.removeConditions();
    expect(mockDialogRef.close).toHaveBeenCalledWith(null);
  });
});
