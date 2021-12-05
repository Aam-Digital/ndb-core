import { ComponentFixture, TestBed } from "@angular/core/testing";

import {
  EditProgressDashboardComponent,
  EditProgressDashboardComponentData,
} from "./edit-progress-dashboard.component";
import { MAT_DIALOG_DATA } from "@angular/material/dialog";
import {
  AbstractControl,
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
} from "@angular/forms";

declare global {
  namespace jasmine {
    interface Matchers<T> {
      toContainError(expected: string): void;
      toHaveValue(expected: any): void;
      toBeValid(): void;
    }
  }
}

describe("EditProgressDashboardComponent", () => {
  let component: EditProgressDashboardComponent;
  let fixture: ComponentFixture<EditProgressDashboardComponent>;

  beforeEach(() => {
    jasmine.addMatchers({
      toContainError: () => {
        return {
          compare: (form: AbstractControl, expectedError: string) => {
            const result = { pass: false, message: "" };
            if (form.hasError(expectedError)) {
              result.pass = true;
            } else {
              result.message = "Expected form to contain error";
            }
            return result;
          },
        };
      },
      toHaveValue: (util) => {
        return {
          compare: (form: AbstractControl, expected: any) => {
            const result = { pass: false, message: "" };
            if (util.equals(form.value, expected)) {
              result.pass = true;
            } else {
              result.message = "Form does not contain value " + expected;
            }
            return result;
          },
        };
      },
      toBeValid: () => {
        return {
          compare: (form: AbstractControl) => {
            const result = { pass: false, message: "" };
            if (form.valid) {
              result.pass = true;
            } else {
              result.message = "Expected form to be valid";
            }
            return result;
          },
        };
      },
    });
  });

  const mockDialogData: EditProgressDashboardComponentData = {
    parts: [
      {
        label: "foo",
        currentValue: 4,
        targetValue: 10,
      },
      {
        label: "bar",
        currentValue: 0,
        targetValue: 0,
      },
      {
        label: "baz",
        currentValue: 10,
        targetValue: 10,
      },
    ],
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [EditProgressDashboardComponent],
      imports: [ReactiveFormsModule],
      providers: [
        {
          provide: MAT_DIALOG_DATA,
          useValue: mockDialogData,
        },
        FormBuilder,
      ],
    }).compileComponents();
  });

  function getGroup(index: number): FormGroup {
    return component.forms.at(index) as FormGroup;
  }

  beforeEach(() => {
    fixture = TestBed.createComponent(EditProgressDashboardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });

  it("should contain the initial state from the data", () => {
    expect(component.forms).toHaveValue(mockDialogData.parts);
    expect(component.forms).toBeValid();
  });

  it("should append a new part", () => {
    component.addPart();
    expect(component.forms.length).toBe(4);
  });

  it("should delete a part", () => {
    component.removePart(1);
    expect(component.forms.length).toBe(2);
    expect(component.forms).toHaveValue([
      mockDialogData.parts[0],
      mockDialogData.parts[2],
    ]);
  });

  it("should mark the form as invalid when current or target is not present", () => {
    const firstForm = getGroup(0);
    firstForm.get("currentValue").setValue("");
    expect(firstForm.get("currentValue")).toContainError("required");
    firstForm.get("targetValue").setValue("");
    expect(firstForm.get("targetValue")).toContainError("required");

    expect(firstForm).not.toBeValid();
  });

  it("should mark the form as invalid when the current or target value is negative", () => {
    const group = getGroup(1);
    group.get("currentValue").setValue(-1);
    expect(group.get("currentValue")).toContainError("min");
    group.get("targetValue").setValue(-3);
    expect(group.get("targetValue")).toContainError("min");

    expect(group).not.toBeValid();
  });

  it("should mark the form as invalid when the current value is greater than the target value", () => {
    const group = getGroup(2);
    group.get("currentValue").setValue(3);
    group.get("targetValue").setValue(2);
    expect(group).not.toBeValid();
  });

  it("should clear the error flag after a current and target value mismatch has been solved", () => {
    const group = getGroup(0);
    group.get("currentValue").setValue(6);
    group.get("targetValue").setValue(5);
    expect(group).not.toBeValid();
    expect(group.get("currentValue")).toContainError("currentGtTarget");
    group.get("currentValue").setValue(5);
    expect(group.get("currentValue")).not.toContainError("currentGtTarget");
  });

  it("should clear only one error when only one is resolved", () => {
    const group = getGroup(1);
    group.get("currentValue").setValue(-2);
    group.get("targetValue").setValue(-5);
    expect(group).not.toBeValid();
    expect(group).toContainError("currentGtTarget");
    expect(group.get("currentValue")).toContainError("min");
    expect(group.get("targetValue")).toContainError("min");
    group.get("targetValue").setValue(5);
    expect(group).not.toBeValid();
    expect(group).not.toContainError("currentGtTarget");
    expect(group.get("currentValue")).toContainError("min");
    expect(group.get("targetValue")).not.toContainError("min");
  });
});
