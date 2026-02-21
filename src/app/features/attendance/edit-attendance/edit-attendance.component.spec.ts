import { ComponentFixture, TestBed } from "@angular/core/testing";

import { FormControl } from "@angular/forms";
import { By } from "@angular/platform-browser";
import { Entity } from "#src/app/core/entity/model/entity";
import { LoginState } from "#src/app/core/session/session-states/login-state.enum";
import { MockedTestingModule } from "#src/app/utils/mocked-testing.module";
import { TestEntity } from "#src/app/utils/test-utils/TestEntity";
import { AttendanceStatusSelectComponent } from "./attendance-status-select/attendance-status-select.component";
import { EditAttendanceComponent } from "./edit-attendance.component";
import { AttendanceItem } from "../model/attendance-item";

describe("EditAttendanceComponent", () => {
  let component: EditAttendanceComponent;
  let fixture: ComponentFixture<EditAttendanceComponent>;
  let attendanceForm: FormControl<AttendanceItem[]>;

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

    const initialItems = childrenEntities.map(
      (c) => new AttendanceItem(undefined, "", c.getId()),
    );
    attendanceForm = new FormControl<AttendanceItem[]>(initialItems);

    component.ngControl = {
      control: attendanceForm,
    } as any;

    component.formFieldConfig = {
      id: "attendance",
      additional: {
        participant: { dataType: "entity", additional: "TestEntity" },
      },
    };
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });

  it("should show attendance status selects for each participant", () => {
    const elements = fixture.debugElement.queryAll(
      By.directive(AttendanceStatusSelectComponent),
    );
    expect(elements).toHaveSize(2);
  });

  it("should add a participant when addParticipant is called", () => {
    component.addParticipant("child3");
    expect(attendanceForm.value).toHaveSize(3);
    expect(attendanceForm.value[2].participant).toBe("child3");
  });

  it("should not add duplicate participant", () => {
    component.addParticipant(childrenEntities[0].getId());
    expect(attendanceForm.value).toHaveSize(2);
  });

  it("should remove a participant from the attendance array", () => {
    const a1 = component.getAttendanceItem(childrenEntities[0].getId());
    a1.remarks = "present";

    component.removeParticipant(childrenEntities[1].getId());

    expect(attendanceForm.value).toHaveSize(1);
    expect(attendanceForm.value[0].participant).toBe(
      childrenEntities[0].getId(),
    );
    expect(attendanceForm.value[0].remarks).toBe("present");
  });

  it("should mark form as dirty when some attendance detail was changed", () => {
    component.updateAttendanceValue(
      childrenEntities[0].getId(),
      "remarks",
      "new remarks",
    );

    expect(
      component.getAttendanceItem(childrenEntities[0].getId()).remarks,
    ).toEqual("new remarks");
    expect(component.formControl.dirty).toBeTrue();
  });

  it("should exclude already-added participants from the filter", () => {
    const existingEntity = childrenEntities[0];
    const newEntity = new TestEntity("child3");

    const filter = component.participantFilter();
    expect(filter(existingEntity)).toBeFalse();
    expect(filter(newEntity)).toBeTrue();
  });

  it("should update the participant filter after adding a participant", () => {
    const newEntity = new TestEntity("child3");
    expect(component.participantFilter()(newEntity)).toBeTrue();

    component.addParticipant(newEntity.getId());

    expect(component.participantFilter()(newEntity)).toBeFalse();
  });
});
