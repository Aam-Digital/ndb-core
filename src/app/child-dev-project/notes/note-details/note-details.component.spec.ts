import { NoteDetailsComponent } from "./note-details.component";
import { Note } from "../model/note";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { of } from "rxjs";
import { MatNativeDateModule } from "@angular/material/core";
import { ChildrenService } from "../../children/children.service";
import { NotesModule } from "../notes.module";
import { Child } from "../../children/model/child";
import { RouterTestingModule } from "@angular/router/testing";
import { Angulartics2Module } from "angulartics2";
import { MatDialogRef } from "@angular/material/dialog";
import { defaultAttendanceStatusTypes } from "../../../core/config/default-config/default-attendance-status-types";
import { MockSessionModule } from "../../../core/session/mock-session.module";
import { FontAwesomeTestingModule } from "@fortawesome/angular-fontawesome/testing";
import { By } from "@angular/platform-browser";
import { ChildMeetingNoteAttendanceComponent } from "./child-meeting-attendance/child-meeting-note-attendance.component";
import {
  EntityRegistry,
  entityRegistry,
} from "../../../core/entity/database-entity.decorator";

function generateTestNote(forChildren: Child[]) {
  const testNote = Note.create(new Date(), "test note");
  testNote.category = {
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
  testNote._rev = "x"; // mock an already existing note
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
      "getChildren",
      "getChild",
    ]);
    mockChildrenService.getChildren.and.returnValue(of([]));
    mockChildrenService.getChild.and.returnValue(of(new Child("")));

    const dialogRefMock = { beforeClosed: () => of(), close: () => {} };

    TestBed.configureTestingModule({
      declarations: [],
      imports: [
        NotesModule,
        RouterTestingModule,
        MatNativeDateModule,
        Angulartics2Module.forRoot(),
        MockSessionModule.withState(),
        FontAwesomeTestingModule,
      ],
      providers: [
        { provide: MatDialogRef, useValue: dialogRefMock },
        { provide: ChildrenService, useValue: mockChildrenService },
        { provide: EntityRegistry, useValue: entityRegistry },
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
