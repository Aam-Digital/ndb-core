import { NoteDetailsComponent } from "./note-details.component";
import { Note } from "../model/note";
import { MeetingNoteAttendance } from "../meeting-note-attendance";
import { InteractionTypes } from "../interaction-types.enum";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { FormBuilder } from "@angular/forms";
import { of } from "rxjs";
import { MatNativeDateModule } from "@angular/material/core";
import { ChildrenService } from "../../children/children.service";
import { NotesModule } from "../notes.module";
import { Child } from "../../children/model/child";
import { EntityMapperService } from "../../../core/entity/entity-mapper.service";
import { EntitySchemaService } from "../../../core/entity/schema/entity-schema.service";
import { Database } from "../../../core/database/database";
import { User } from "../../../core/user/user";
import { ConfirmationDialogService } from "../../../core/confirmation-dialog/confirmation-dialog.service";
import { SessionService } from "../../../core/session/session-service/session.service";
import { RouterTestingModule } from "@angular/router/testing";
import { MockDatabase } from "../../../core/database/mock-database";

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
  n1.category = InteractionTypes.CHILDREN_MEETING;
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

    TestBed.configureTestingModule({
      declarations: [],
      imports: [NotesModule, RouterTestingModule, MatNativeDateModule],
      providers: [
        EntitySchemaService,
        EntityMapperService,
        ConfirmationDialogService,
        { provide: ChildrenService, useValue: mockChildrenService },
        { provide: Database, useClass: MockDatabase },
        FormBuilder,
        {
          provide: SessionService,
          useValue: { getCurrentUser: () => new User("") },
        },
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
    const mockedDatabase = TestBed.get(Database);

    component.entity.addChildren("5", "7");
    await component.formDialogWrapper.save();
    const newNote: Note = await mockedDatabase.get("Note:1");
    expect(newNote.children.length).toBe(5);
  });
});
