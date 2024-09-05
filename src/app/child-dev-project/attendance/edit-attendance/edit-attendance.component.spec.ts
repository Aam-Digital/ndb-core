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
import { LoginState } from "../../../core/session/session-states/login-state.enum";
import { Entity } from "../../../core/entity/model/entity";
import { TestEntity } from "../../../utils/test-utils/TestEntity";

describe("EditAttendanceComponent", () => {
  let component: EditAttendanceComponent;
  let fixture: ComponentFixture<EditAttendanceComponent>;
  let categoryForm: FormControl<InteractionType>;
  let childrenForm: FormControl<string[]>;

  let childrenEntities: Entity[];

  beforeEach(async () => {
    childrenEntities = [new TestEntity("child1"), new TestEntity("child2")];

    await TestBed.configureTestingModule({
      imports: [
        EditAttendanceComponent,
        MockedTestingModule.withState(LoginState.LOGGED_IN, childrenEntities),
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(EditAttendanceComponent);
    component = fixture.componentInstance;
    categoryForm = new FormControl<InteractionType>(defaultInteractionTypes[0]);
    childrenForm = new FormControl(childrenEntities.map((c) => c.getId()));
    component.parent = new FormGroup({
      children: childrenForm,
      category: categoryForm,
    });
    component.formControl = childrenForm;
    component.formFieldConfig = { id: "children" };
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
    const a1 = component.getAttendance(childrenEntities[0].getId());
    const a2 = component.getAttendance(childrenEntities[1].getId());
    a1.remarks = "absent";
    a2.remarks = "excused";

    expect([...attendanceForm.value.values()]).toHaveSize(2);

    component.removeChild(childrenEntities[1].getId());

    expect(childrenForm.value).toEqual([childrenEntities[0].getId()]);
    expect([...attendanceForm.value.values()]).toHaveSize(1);
    expect(attendanceForm.value.get(childrenEntities[0].getId())).toBe(a1);
  });

  it("should mark form as dirty when some attendance detail was changed", async () => {
    categoryForm.setValue(defaultInteractionTypes.find((c) => c.isMeeting));
    fixture.detectChanges();

    const inputElements =
      await TestbedHarnessEnvironment.loader(fixture).getAllHarnesses(
        MatInputHarness,
      );
    const firstRemarkInput = inputElements[2];
    await firstRemarkInput.setValue("new remarks");

    const placeholder = await firstRemarkInput.getPlaceholder();
    const name = await firstRemarkInput.getName();

    expect(
      component.getAttendance(childrenEntities[0].getId()).remarks,
    ).toEqual("new remarks");
    expect(component.formControl.dirty).toBeTrue();
  });
});
