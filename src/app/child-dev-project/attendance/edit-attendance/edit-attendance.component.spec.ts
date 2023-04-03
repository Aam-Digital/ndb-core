import { ComponentFixture, TestBed } from "@angular/core/testing";

import { EditAttendanceComponent } from "./edit-attendance.component";
import { FormControl, FormGroup } from "@angular/forms";
import { Note } from "../../notes/model/note";
import { MockedTestingModule } from "../../../utils/mocked-testing.module";
import { By } from "@angular/platform-browser";
import { AttendanceStatusSelectComponent } from "../attendance-status-select/attendance-status-select.component";
import { InteractionType } from "../../notes/model/interaction-type.interface";
import { defaultInteractionTypes } from "../../../core/config/default-config/default-interaction-types";

describe("EditAttendanceComponent", () => {
  let component: EditAttendanceComponent;
  let fixture: ComponentFixture<EditAttendanceComponent>;
  let categoryForm: FormControl<InteractionType>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EditAttendanceComponent, MockedTestingModule.withState()],
    }).compileComponents();

    fixture = TestBed.createComponent(EditAttendanceComponent);
    component = fixture.componentInstance;
    categoryForm = new FormControl<InteractionType>(defaultInteractionTypes[0]);
    const form = new FormGroup({
      children: new FormControl(["child1", "child2"]),
      category: categoryForm,
    });
    component.formControl = form.get("children") as FormControl;
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
      By.directive(AttendanceStatusSelectComponent)
    );

    expect(element).toBeTruthy();
  });

  it("should not show the child meeting note attendance component when the event's category is undefined", () => {
    categoryForm.setValue(defaultInteractionTypes.find((c) => !c.isMeeting));
    fixture.detectChanges();

    const element = fixture.debugElement.query(
      By.directive(AttendanceStatusSelectComponent)
    );

    expect(element).toBeFalsy();
  });
});
