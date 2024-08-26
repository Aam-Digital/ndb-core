import { NoteDetailsComponent } from "./note-details.component";
import { Note } from "../model/note";
import { ComponentFixture, TestBed, waitForAsync } from "@angular/core/testing";
import { MAT_DIALOG_DATA, MatDialogRef } from "@angular/material/dialog";
import { defaultAttendanceStatusTypes } from "../../../core/config/default-config/default-attendance-status-types";
import { NEVER } from "rxjs";
import { MockedTestingModule } from "../../../utils/mocked-testing.module";
import { LoginState } from "../../../core/session/session-states/login-state.enum";
import { TestEntity } from "../../../utils/test-utils/TestEntity";

function generateTestNote(forChildren: TestEntity[]) {
  const testNote = Note.create(new Date(), "test note");
  testNote.category = {
    _ordinal: 0,
    id: "CHILDREN_MEETING",
    label: "Children's Meeting",
    color: "#E1F5FE",
    isMeeting: true,
  };
  for (const child of forChildren) {
    testNote.addChild(child);
    testNote.getAttendance(child).status = defaultAttendanceStatusTypes[0];
  }
  return testNote;
}

describe("NoteDetailsComponent", () => {
  let component: NoteDetailsComponent;
  let fixture: ComponentFixture<NoteDetailsComponent>;

  let testNote: Note;

  beforeEach(waitForAsync(() => {
    const children = [
      new TestEntity("1"),
      new TestEntity("2"),
      new TestEntity("3"),
    ];
    testNote = generateTestNote(children);

    TestBed.configureTestingModule({
      imports: [
        NoteDetailsComponent,
        MockedTestingModule.withState(LoginState.LOGGED_IN, children),
      ],
      providers: [
        { provide: MAT_DIALOG_DATA, useValue: { entity: testNote } },
        {
          provide: MatDialogRef,
          useValue: { backdropClick: () => NEVER, afterClosed: () => NEVER },
        },
      ],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(NoteDetailsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
