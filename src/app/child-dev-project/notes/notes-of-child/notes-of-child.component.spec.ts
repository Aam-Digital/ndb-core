import { NotesOfChildComponent } from "./notes-of-child.component";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { NotesModule } from "../notes.module";
import { MatNativeDateModule } from "@angular/material/core";
import { ChildrenService } from "../../children/children.service";
import { DatePipe } from "@angular/common";
import { Note } from "../model/note";
import { EntityMapperService } from "../../../core/entity/entity-mapper.service";
import { SessionService } from "../../../core/session/session-service/session.service";
import { Child } from "../../children/model/child";
import { User } from "../../../core/user/user";
import { RouterTestingModule } from "@angular/router/testing";

const allChildren: Array<Note> = [];

const mockedSessionService = {
  getCurrentUser(): User {
    return new User("1");
  },
};

describe("NotesOfChildComponent", () => {
  let component: NotesOfChildComponent;
  let fixture: ComponentFixture<NotesOfChildComponent>;

  let mockChildrenService: jasmine.SpyObj<ChildrenService>;

  beforeEach(() => {
    mockChildrenService = jasmine.createSpyObj("mockChildrenService", [
      "getNotesOfChild",
    ]);
    TestBed.configureTestingModule({
      imports: [NotesModule, MatNativeDateModule, RouterTestingModule],
      providers: [
        { provide: ChildrenService, useValue: mockChildrenService },
        { provide: SessionService, useValue: mockedSessionService },
        { provide: DatePipe, useValue: new DatePipe("medium") },
        { provide: EntityMapperService, useValue: {} },
      ],
    }).compileComponents();
  });

  beforeEach(async () => {
    fixture = TestBed.createComponent(NotesOfChildComponent);
    component = fixture.componentInstance;
    component.child = new Child("1");
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });

  it("should load initial notes", async () => {
    await fixture.whenStable();
    expect(component.records).toEqual(allChildren);
  });

  it("should create a new note", function () {
    const newNoteFactory = component.generateNewRecordFactory();
    expect(newNoteFactory).toBeDefined();
  });
});
