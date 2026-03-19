import { ComponentFixture, TestBed } from "@angular/core/testing";

import {
  EditProgressDashboardComponent,
  EditProgressDashboardComponentData,
} from "./edit-progress-dashboard.component";
import { MAT_DIALOG_DATA } from "@angular/material/dialog";
import { FormBuilder, FormGroup } from "@angular/forms";
import { ConfigService } from "../../../../core/config/config.service";
import { provideTestingConfigService } from "../../../../core/config/testing-config-service";
import { NoopAnimationsModule } from "@angular/platform-browser/animations";
import { FontAwesomeTestingModule } from "@fortawesome/angular-fontawesome/testing";

describe("EditProgressDashboardComponent", () => {
  let component: EditProgressDashboardComponent;
  let fixture: ComponentFixture<EditProgressDashboardComponent>;

  const mockDialogData: EditProgressDashboardComponentData = {
    title: "qwe",
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
      imports: [
        EditProgressDashboardComponent,
        NoopAnimationsModule,
        FontAwesomeTestingModule,
      ],
      providers: [
        {
          provide: MAT_DIALOG_DATA,
          useValue: mockDialogData,
        },
        ...provideTestingConfigService(),
        FormBuilder,
      ],
    }).compileComponents();
  });

  function getGroup(index: number): FormGroup {
    return component.parts.at(index) as FormGroup;
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
    expect(component.parts.value).toEqual(mockDialogData.parts);
    expect(component.parts.valid).toBe(true);

    expect(component.title.value).toEqual(mockDialogData.title);
    expect(component.title.valid).toBe(true);
  });

  it("should mark form as invalid when title is empty", () => {
    component.title.setValue("");
    expect(component.title.value).toEqual("");
    expect(component.title.hasError("required")).toBe(true);

    expect(component.title.valid).toBe(false);
  });

  it("should append a new part", () => {
    component.addPart();
    expect(component.parts).toHaveLength(4);
  });

  it("should delete a part", () => {
    component.removePart(1);
    expect(component.parts).toHaveLength(2);
    expect(component.parts.value).toEqual([
      mockDialogData.parts[0],
      mockDialogData.parts[2],
    ]);
  });

  it("should mark the form as invalid when current or target is not present", () => {
    const firstForm = getGroup(0);
    firstForm.get("currentValue").setValue("");
    expect(firstForm.get("currentValue").hasError("required")).toBe(true);
    firstForm.get("targetValue").setValue("");
    expect(firstForm.get("targetValue").hasError("required")).toBe(true);

    expect(firstForm.valid).toBe(false);
  });

  it("should mark the form as invalid when the current or target value is negative", () => {
    const group = getGroup(1);
    group.get("currentValue").setValue(-1);
    expect(group.get("currentValue").hasError("min")).toBe(true);
    group.get("targetValue").setValue(-3);
    expect(group.get("targetValue").hasError("min")).toBe(true);

    expect(group.valid).toBe(false);
  });

  it("should mark the form as invalid when the current value is greater than the target value", () => {
    const group = getGroup(2);
    group.get("currentValue").setValue(3);
    group.get("targetValue").setValue(2);
    expect(group.valid).toBe(false);
    expect(group.hasError("currentGtTarget")).toBe(true);
  });

  it("should clear only one error when only one is resolved", () => {
    const group = getGroup(1);
    group.get("currentValue").setValue(-2);
    group.get("targetValue").setValue(-5);
    expect(group.valid).toBe(false);
    expect(group.hasError("currentGtTarget")).toBe(true);
    expect(group.get("currentValue").hasError("min")).toBe(true);
    expect(group.get("targetValue").hasError("min")).toBe(true);
    group.get("targetValue").setValue(5);
    expect(group.valid).toBe(false);
    expect(group.hasError("currentGtTarget")).toBe(false);
    expect(group.get("currentValue").hasError("min")).toBe(true);
    expect(group.get("targetValue").hasError("min")).toBe(false);
  });

  it("correctly sets errors when the target is 0", () => {
    const group = getGroup(0);
    group.get("currentValue").setValue(1);
    group.get("targetValue").setValue(0);
    expect(group.valid).toBe(false);
  });
});
