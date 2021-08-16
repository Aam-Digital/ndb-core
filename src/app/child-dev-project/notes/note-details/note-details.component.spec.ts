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
import { EntityMapperService } from "../../../core/entity/entity-mapper.service";
import { mockEntityMapper } from "../../../core/entity/mock-entity-mapper-service";
import { SessionService } from "../../../core/session/session-service/session.service";

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

  let mockSessionService: jasmine.SpyObj<SessionService>;
  let children: Child[];
  let testNote: Note;

  beforeEach(() => {
    children = [new Child("1"), new Child("2"), new Child("3")];
    testNote = generateTestNote(children);
    mockSessionService = jasmine.createSpyObj(["getCurrentUser"]);
    mockSessionService.getCurrentUser.and.returnValue({
      name: "user",
      roles: [],
    });

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
      ],
      providers: [
        { provide: MatDialogRef, useValue: dialogRefMock },
        { provide: EntityMapperService, useValue: mockEntityMapper() },
        { provide: ChildrenService, useValue: mockChildrenService },
        { provide: SessionService, useValue: mockSessionService },
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
});
