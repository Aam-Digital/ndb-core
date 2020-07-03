import { NotesManagerComponent } from "./notes-manager.component";
import { Note } from "../model/note";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { NotesModule } from "../notes.module";
import { MatNativeDateModule } from "@angular/material/core";
import { ChildrenService } from "../../children/children.service";
import { FormBuilder } from "@angular/forms";
import { Database } from "../../../core/database/database";
import { MockDatabase } from "../../../core/database/mock-database";
import { EntitySchemaService } from "../../../core/entity/schema/entity-schema.service";
import { EntityMapperService } from "../../../core/entity/entity-mapper.service";
import { ConfirmationDialogService } from "../../../core/confirmation-dialog/confirmation-dialog.service";
import { SessionService } from "../../../core/session/session-service/session.service";

function generateNewNotes(): Array<Note> {
  let i;
  const notes: Array<Note> = [];
  for (i = 0; i < 10; i++) {
    const note = new Note("" + i);
    notes.push(note);
  }
  return notes;
}

const database: Database = new MockDatabase();
const testNotes = generateNewNotes();

describe("NotesManagerComponent", () => {
  let component: NotesManagerComponent;
  let fixture: ComponentFixture<NotesManagerComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [],
      imports: [NotesModule, MatNativeDateModule],
      providers: [
        EntitySchemaService,
        EntityMapperService,
        ConfirmationDialogService,
        ChildrenService,
        FormBuilder,
        SessionService,
        { provide: Database, useValue: database },
      ],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(NotesManagerComponent);
    component = fixture.componentInstance;
    const entityMapperService = fixture.debugElement.injector.get(
      EntityMapperService
    );
    testNotes.forEach((note) => entityMapperService.save(note));
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });

  it("should load all data after initializing", async () => {
    await component.ngOnInit();
    expect(component.entityList.length).toEqual(testNotes.length);
  });
});
