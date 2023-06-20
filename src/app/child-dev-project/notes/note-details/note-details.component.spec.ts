import { NoteDetailsComponent } from "./note-details.component";
import { Note } from "../model/note";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { Child } from "../../children/model/child";
import { MAT_DIALOG_DATA, MatDialogRef } from "@angular/material/dialog";
import { defaultAttendanceStatusTypes } from "../../../core/config/default-config/default-attendance-status-types";
import { MockedTestingModule } from "../../../utils/mocked-testing.module";
import { LoginState } from "../../../core/session/session-states/login-state.enum";
import { EntityConfigService } from "../../../core/entity/entity-config.service";
import { NEVER } from "rxjs";

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

  let testNote: Note;

  beforeEach(async () => {
    const children = [new Child("1"), new Child("2"), new Child("3")];
    testNote = generateTestNote(children);

    await TestBed.configureTestingModule({
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

    TestBed.inject(EntityConfigService).setupEntitiesFromConfig();
    fixture = TestBed.createComponent(NoteDetailsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
