import { NoteDetailsComponent } from "./note-details.component";
import { Note } from "../model/note";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { EMPTY } from "rxjs";
import { ChildrenService } from "../../children/children.service";
import { Child } from "../../children/model/child";
import { MatDialogRef } from "@angular/material/dialog";
import { defaultAttendanceStatusTypes } from "../../../core/config/default-config/default-attendance-status-types";
import { MockedTestingModule } from "../../../utils/mocked-testing.module";
import { By } from "@angular/platform-browser";
import { ChildMeetingNoteAttendanceComponent } from "./child-meeting-attendance/child-meeting-note-attendance.component";
import { LoginState } from "../../../core/session/session-states/login-state.enum";

function generateTestNote(forChildren: Child[]) {
  const testNote = Note.create(new Date(), "test note");
  testNote.category = {
    _ordinal: 0,
    id: "CHILDREN_MEETING",
    label: "Children's Meeting",
    color: "#E1F5FE",
    isMeeting: true,
  };
  for (const child of forChildren) {
    testNote.addChild(child.getId());
    testNote.getAttendance(child.getId()).status =
      defaultAttendanceStatusTypes[0];
  }
  return testNote;
}

describe("NoteDetailsComponent", () => {
  let component: NoteDetailsComponent;
  let fixture: ComponentFixture<NoteDetailsComponent>;

  let children: Child[];
  let testNote: Note;

  beforeEach(() => {
    children = [new Child("1"), new Child("2"), new Child("3")];
    testNote = generateTestNote(children);

    const mockChildrenService = jasmine.createSpyObj("mockChildrenService", [
      "getChild",
    ]);
    mockChildrenService.getChild.and.resolveTo(new Child(""));

    const dialogRefMock = { beforeClosed: () => EMPTY, close: () => {} };

    TestBed.configureTestingModule({
      imports: [
        NoteDetailsComponent,
        MockedTestingModule.withState(LoginState.LOGGED_IN, children),
      ],
      providers: [
        { provide: MatDialogRef, useValue: dialogRefMock },
        { provide: ChildrenService, useValue: mockChildrenService },
      ],
    }).compileComponents();
    fixture = TestBed.createComponent(NoteDetailsComponent);
    component = fixture.componentInstance;

    component.entity = testNote;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });

  it("should show the child meeting note attendance component when the event is a meeting", () => {
    component.entity.category.isMeeting = true;
    const element = fixture.debugElement.query(
      By.directive(ChildMeetingNoteAttendanceComponent)
    );
    expect(element).toBeTruthy();
  });

  it("should not show the child meeting note attendance component when the event's category is undefined", () => {
    component.entity.category = undefined;
    fixture.detectChanges();
    const element = fixture.debugElement.query(
      By.directive(ChildMeetingNoteAttendanceComponent)
    );
    expect(element).toBeFalsy();
  });
});
