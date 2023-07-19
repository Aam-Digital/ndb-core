import { ComponentFixture, TestBed } from "@angular/core/testing";

import {
  EditProgressDashboardComponent,
  EditProgressDashboardComponentData,
} from "./edit-progress-dashboard.component";
import { MAT_DIALOG_DATA } from "@angular/material/dialog";
import { FormBuilder, FormGroup } from "@angular/forms";
import { ConfigService } from "../../../core/config/config.service";
import { createTestingConfigService } from "../../../core/config/testing-config-service";
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
        { provide: ConfigService, useValue: createTestingConfigService() },
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
    expect(component.parts).toHaveValue(mockDialogData.parts);
    expect(component.parts).toBeValidForm();

    expect(component.title).toHaveValue(mockDialogData.title);
    expect(component.title).toBeValidForm();
  });

  it("should mark form as invalid when title is empty", () => {
    component.title.setValue("");
    expect(component.title).toHaveValue("");
    expect(component.title).toContainFormError("required");

    expect(component.title).not.toBeValidForm();
  });

  it("should append a new part", () => {
    component.addPart();
    expect(component.parts).toHaveSize(4);
  });

  it("should delete a part", () => {
    component.removePart(1);
    expect(component.parts).toHaveSize(2);
    expect(component.parts).toHaveValue([
      mockDialogData.parts[0],
      mockDialogData.parts[2],
    ]);
  });

  it("should mark the form as invalid when current or target is not present", () => {
    const firstForm = getGroup(0);
    firstForm.get("currentValue").setValue("");
    expect(firstForm.get("currentValue")).toContainFormError("required");
    firstForm.get("targetValue").setValue("");
    expect(firstForm.get("targetValue")).toContainFormError("required");

    expect(firstForm).not.toBeValidForm();
  });

  it("should mark the form as invalid when the current or target value is negative", () => {
    const group = getGroup(1);
    group.get("currentValue").setValue(-1);
    expect(group.get("currentValue")).toContainFormError("min");
    group.get("targetValue").setValue(-3);
    expect(group.get("targetValue")).toContainFormError("min");

    expect(group).not.toBeValidForm();
  });

  it("should mark the form as invalid when the current value is greater than the target value", () => {
    const group = getGroup(2);
    group.get("currentValue").setValue(3);
    group.get("targetValue").setValue(2);
    expect(group).not.toBeValidForm();
    expect(group).toContainFormError("currentGtTarget");
  });

  it("should clear only one error when only one is resolved", () => {
    const group = getGroup(1);
    group.get("currentValue").setValue(-2);
    group.get("targetValue").setValue(-5);
    expect(group).not.toBeValidForm();
    expect(group).toContainFormError("currentGtTarget");
    expect(group.get("currentValue")).toContainFormError("min");
    expect(group.get("targetValue")).toContainFormError("min");
    group.get("targetValue").setValue(5);
    expect(group).not.toBeValidForm();
    expect(group).not.toContainFormError("currentGtTarget");
    expect(group.get("currentValue")).toContainFormError("min");
    expect(group.get("targetValue")).not.toContainFormError("min");
  });

  it("correctly sets errors when the target is 0", () => {
    const group = getGroup(0);
    group.get("currentValue").setValue(1);
    group.get("targetValue").setValue(0);
    expect(group).not.toBeValidForm();
  });
});
