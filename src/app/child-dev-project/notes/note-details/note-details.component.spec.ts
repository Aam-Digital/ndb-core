import { NoteDetailsComponent } from "./note-details.component";
import { Note } from "../model/note";
import { MeetingNoteAttendance } from "../model/meeting-note-attendance";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { of } from "rxjs";
import { MatNativeDateModule } from "@angular/material/core";
import { ChildrenService } from "../../children/children.service";
import { NotesModule } from "../notes.module";
import { Child } from "../../children/model/child";
import { EntityMapperService } from "../../../core/entity/entity-mapper.service";
import { Database } from "../../../core/database/database";
import { User } from "../../../core/user/user";
import { SessionService } from "../../../core/session/session-service/session.service";
import { RouterTestingModule } from "@angular/router/testing";
import { MockDatabase } from "../../../core/database/mock-database";
import { Angulartics2Module } from "angulartics2";
import { MatDialogRef } from "@angular/material/dialog";

function generateChildAttendanceModels() {
  const attendances = [];
  let i;
  for (i = 1; i < 4; i++) {
    const am = new MeetingNoteAttendance("" + i);
    if (i % 2 === 0) {
      am.present = false;
      am.remarks = "not empty";
    }
    attendances.push(am);
  }
  return attendances;
}

function generateTestingData() {
  const n1 = new Note("1");
  n1.children = generateChildAttendanceModels();
  n1.category = {
    id: "CHILDREN_MEETING",
    label: "Children's Meeting",
    color: "#E1F5FE",
    isMeeting: true,
  };
  n1.date = new Date(Date.now());
  // mock an already existing note
  n1._rev = "x";
  return { entity: n1 };
}

const children = [new Child("1"), new Child("2"), new Child("3")];
const testData = generateTestingData();

describe("NoteDetailsComponent", () => {
  let component: NoteDetailsComponent;
  let fixture: ComponentFixture<NoteDetailsComponent>;

  beforeEach(() => {
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
        { provide: ChildrenService, useValue: mockChildrenService },
        { provide: Database, useClass: MockDatabase },
        {
          provide: SessionService,
          useValue: { getCurrentUser: () => new User("") },
        },
        { provide: MatDialogRef, useValue: dialogRefMock },
      ],
    }).compileComponents();
    fixture = TestBed.createComponent(NoteDetailsComponent);
    component = fixture.componentInstance;

    const entityMapperService = fixture.debugElement.injector.get(
      EntityMapperService
    );
    entityMapperService.save<Note>(testData.entity);
    children.forEach((child) => entityMapperService.save<Child>(child));

    component.entity = testData.entity;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });

  it("should load data", () => {
    expect(component.entity).toBe(testData.entity);
  });

  it("should save data", async function () {
    const mockedDatabase = TestBed.inject<Database>(Database);

    component.entity.addChild("5");
    component.entity.addChild("7");
    await component.formDialogWrapper.save();
    const newNote: Note = await mockedDatabase.get("Note:1");
    expect(newNote.children.length).toBe(5);
  });
});
