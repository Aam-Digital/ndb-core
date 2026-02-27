import { ComponentFixture, TestBed } from "@angular/core/testing";

import { TestbedHarnessEnvironment } from "@angular/cdk/testing/testbed";
import { FormControl, FormGroup } from "@angular/forms";
import { MatInputHarness } from "@angular/material/input/testing";
import { By } from "@angular/platform-browser";
import { defaultInteractionTypes } from "#src/app/core/config/default-config/default-interaction-types";
import { Entity } from "#src/app/core/entity/model/entity";
import { LoginState } from "#src/app/core/session/session-states/login-state.enum";
import { MockedTestingModule } from "#src/app/utils/mocked-testing.module";
import { TestEntity } from "#src/app/utils/test-utils/TestEntity";
import { InteractionType } from "#src/app/child-dev-project/notes/model/interaction-type.interface";
import { Note } from "#src/app/child-dev-project/notes/model/note";
import { AttendanceStatusSelectComponent } from "../edit-attendance/attendance-status-select/attendance-status-select.component";
import { EditLegacyAttendanceComponent } from "./edit-legacy-attendance.component";

describe("EditLegacyAttendanceComponent", () => {
  let component: EditLegacyAttendanceComponent;
  let fixture: ComponentFixture<EditLegacyAttendanceComponent>;
  let parentFormGroup: FormGroup;
  let categoryForm: FormControl<InteractionType>;
  let childrenForm: FormControl<string[]>;

  let childrenEntities: Entity[];

  beforeEach(async () => {
    childrenEntities = [new TestEntity("child1"), new TestEntity("child2")];

    await TestBed.configureTestingModule({
      imports: [
        EditLegacyAttendanceComponent,
        MockedTestingModule.withState(LoginState.LOGGED_IN, childrenEntities),
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(EditLegacyAttendanceComponent);
    component = fixture.componentInstance;
    categoryForm = new FormControl<InteractionType>(defaultInteractionTypes[0]);
    childrenForm = new FormControl(childrenEntities.map((c) => c.getId()));

    // Create parent form group that contains both category and children controls
    parentFormGroup = new FormGroup({
      category: categoryForm,
      children: childrenForm,
    });

    component.ngControl = {
      control: childrenForm,
    } as any;

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
    const attendanceForm = parentFormGroup.get("childrenAttendance");
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

    expect(
      component.getAttendance(childrenEntities[0].getId()).remarks,
    ).toEqual("new remarks");
    expect(component.formControl.dirty).toBeTrue();
  });
});
