import { ComponentFixture, TestBed } from "@angular/core/testing";

import { FormControl, FormGroup } from "@angular/forms";
import { By } from "@angular/platform-browser";
import { defaultInteractionTypes } from "#src/app/core/config/default-config/default-interaction-types";
import { Entity } from "#src/app/core/entity/model/entity";
import { LoginState } from "#src/app/core/session/session-states/login-state.enum";
import { MockedTestingModule } from "#src/app/utils/mocked-testing.module";
import { TestEntity } from "#src/app/utils/test-utils/TestEntity";
import { InteractionType } from "#src/app/child-dev-project/notes/model/interaction-type.interface";
import { Note } from "#src/app/child-dev-project/notes/model/note";
import { EditLegacyAttendanceComponent } from "./edit-legacy-attendance.component";
import { EditConfigurableEnumComponent } from "#src/app/core/basic-datatypes/configurable-enum/edit-configurable-enum/edit-configurable-enum.component";
import {
  addLegacyNoteFieldsToSchema,
  removeLegacyNoteFieldsFromSchema,
} from "#src/app/child-dev-project/notes/deprecated/legacy-note-link-fields.testing";

describe("EditLegacyAttendanceComponent", () => {
  let component: EditLegacyAttendanceComponent;
  let fixture: ComponentFixture<EditLegacyAttendanceComponent>;
  let parentFormGroup: FormGroup;
  let categoryForm: FormControl<InteractionType>;
  let childrenForm: FormControl<string[]>;

  let childrenEntities: Entity[];

  beforeEach(async () => {
    // this deprecated component only applies to systems that still have the legacy
    // children / childrenAttendance fields in their config
    addLegacyNoteFieldsToSchema();
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

    fixture.componentRef.setInput("formFieldConfig", { id: "children" });
    fixture.componentRef.setInput("entity", new Note());
    fixture.detectChanges();
  });

  afterEach(() => removeLegacyNoteFieldsFromSchema());

  it("should show the child meeting note attendance component when the event is a meeting", () => {
    categoryForm.setValue(defaultInteractionTypes.find((c) => c.isMeeting));
    fixture.detectChanges();

    const element = fixture.debugElement.query(
      By.directive(EditConfigurableEnumComponent),
    );

    expect(element).toBeTruthy();
  });

  it("should not show the child meeting note attendance component when the event's category is undefined", () => {
    categoryForm.setValue(defaultInteractionTypes.find((c) => !c.isMeeting));
    fixture.detectChanges();

    const element = fixture.debugElement.query(
      By.directive(EditConfigurableEnumComponent),
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

    expect(attendanceForm.value).toHaveLength(2);

    component.removeChild(childrenEntities[1].getId());

    expect(childrenForm.value).toEqual([childrenEntities[0].getId()]);
    expect(attendanceForm.value).toHaveLength(1);
    expect(
      attendanceForm.value.find(
        (item) => item.participant === childrenEntities[0].getId(),
      ),
    ).toBe(a1);
  });

  it("should not add an attendance control if the system has no legacy attendance field", () => {
    removeLegacyNoteFieldsFromSchema();
    // a form group of its own, so the component of the shared fixture does not write into it
    const ownCategoryForm = new FormControl<InteractionType>(
      defaultInteractionTypes.find((c) => c.isMeeting),
    );
    const ownChildrenForm = new FormControl(
      childrenEntities.map((c) => c.getId()),
    );
    const ownParentForm = new FormGroup({
      category: ownCategoryForm,
      children: ownChildrenForm,
    });

    const freshFixture = TestBed.createComponent(
      EditLegacyAttendanceComponent,
    );
    freshFixture.componentInstance.ngControl = {
      control: ownChildrenForm,
    } as any;
    freshFixture.componentRef.setInput("formFieldConfig", { id: "children" });
    freshFixture.componentRef.setInput("entity", new Note());
    freshFixture.detectChanges();

    expect(ownParentForm.get("childrenAttendance")).toBeNull();
    expect(freshFixture.componentInstance.showAttendance()).toBe(false);
  });

  it("should mark form as dirty when some attendance detail was changed", () => {
    categoryForm.setValue(defaultInteractionTypes.find((c) => c.isMeeting));
    fixture.detectChanges();

    component.updateAttendanceValue(
      childrenEntities[0].getId(),
      "remarks",
      "new remarks",
    );

    expect(
      component.getAttendance(childrenEntities[0].getId()).remarks,
    ).toEqual("new remarks");
    expect(component.formControl.dirty).toBe(true);
  });
});
