import { ComponentFixture, TestBed } from "@angular/core/testing";

import { EditAttendanceComponent } from "./edit-attendance.component";
import { FormControl, FormGroup } from "@angular/forms";
import { Note } from "../../notes/model/note";
import { MockedTestingModule } from "../../../utils/mocked-testing.module";
import { By } from "@angular/platform-browser";
import { AttendanceStatusSelectComponent } from "../attendance-status-select/attendance-status-select.component";
import { InteractionType } from "../../notes/model/interaction-type.interface";
import { defaultInteractionTypes } from "../../../core/config/default-config/default-interaction-types";
import { MatInputHarness } from "@angular/material/input/testing";
import { TestbedHarnessEnvironment } from "@angular/cdk/testing/testbed";

describe("EditAttendanceComponent", () => {
  let component: EditAttendanceComponent;
  let fixture: ComponentFixture<EditAttendanceComponent>;
  let categoryForm: FormControl<InteractionType>;
  let childrenForm: FormControl<string[]>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EditAttendanceComponent, MockedTestingModule.withState()],
    }).compileComponents();

    fixture = TestBed.createComponent(EditAttendanceComponent);
    component = fixture.componentInstance;
    categoryForm = new FormControl<InteractionType>(defaultInteractionTypes[0]);
    childrenForm = new FormControl(["child1", "child2"]);
    component.parent = new FormGroup({
      children: childrenForm,
      category: categoryForm,
    });
    component.formControl = childrenForm;
    component.formFieldConfig = { id: "children" };
    component.propertySchema = Note.schema.get("children");
    component.entity = new Note();
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });

  it("should show the child meeting note attendance component when the event is a meeting", () => {
    categoryForm.setValue(defaultInteractionTypes.find((c) => c.isMeeting));
    fixture.detectChanges();

    const element = fixture.debugElement.query(
      By.directive(AttendanceStatusSelectComponent),
    );

    expect(element).toBeTruthy();
  });

  it("should not show the child meeting note attendance component when the event's category is undefined", () => {
    categoryForm.setValue(defaultInteractionTypes.find((c) => !c.isMeeting));
    fixture.detectChanges();

    const element = fixture.debugElement.query(
      By.directive(AttendanceStatusSelectComponent),
    );

    expect(element).toBeFalsy();
  });

  it("should remove a child from the children array if the attendance is removed", () => {
    categoryForm.setValue(defaultInteractionTypes.find((c) => c.isMeeting));
    fixture.detectChanges();
    const attendanceForm = component.parent.get("childrenAttendance");
    const a1 = component.getAttendance("child1");
    const a2 = component.getAttendance("child2");
    a1.remarks = "absent";
    a2.remarks = "excused";

    expect([...attendanceForm.value.values()]).toHaveSize(2);

    component.removeChild("child2");

    expect(childrenForm.value).toEqual(["child1"]);
    expect([...attendanceForm.value.values()]).toHaveSize(1);
    expect(attendanceForm.value.get("child1")).toBe(a1);
  });

  it("should mark form as dirty when some attendance detail was changed", async () => {
    categoryForm.setValue(defaultInteractionTypes.find((c) => c.isMeeting));
    fixture.detectChanges();

    const inputElements = await TestbedHarnessEnvironment.loader(
      fixture,
    ).getAllHarnesses(MatInputHarness);
    const firstRemarkInput = inputElements[1];
    await firstRemarkInput.setValue("new remarks");

    expect(component.getAttendance("child1").remarks).toEqual("new remarks");
    expect(component.formControl.dirty).toBeTrue();
  });
});
