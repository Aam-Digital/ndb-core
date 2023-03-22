import { ComponentFixture, TestBed } from "@angular/core/testing";

import { EditAttendanceComponent } from "./edit-attendance.component";
import { FormControl, FormGroup } from "@angular/forms";
import { Note } from "../../notes/model/note";
import { MockedTestingModule } from "../../../utils/mocked-testing.module";

describe("EditAttendanceComponent", () => {
  let component: EditAttendanceComponent;
  let fixture: ComponentFixture<EditAttendanceComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EditAttendanceComponent, MockedTestingModule.withState()],
    }).compileComponents();

    fixture = TestBed.createComponent(EditAttendanceComponent);
    component = fixture.componentInstance;
    const form = new FormGroup({ children: new FormControl([]) });
    component.formControl = form.get("children") as FormControl;
    component.formFieldConfig = { id: "children" };
    component.propertySchema = Note.schema.get("children");
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
