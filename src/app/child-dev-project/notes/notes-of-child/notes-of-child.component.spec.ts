import { NotesOfChildComponent } from "./notes-of-child.component";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { NotesModule } from "../notes.module";
import { MatNativeDateModule } from "@angular/material/core";
import { ChildrenService } from "../../children/children.service";
import { DatePipe } from "@angular/common";
import { Note } from "../model/note";
import { RouterTestingModule } from "@angular/router/testing";
import { Observable } from "rxjs";
import { ActivatedRoute } from "@angular/router";
import { EntityMapperService } from "../../../core/entity/entity-mapper.service";
import { MockDatabase } from "../../../core/database/mock-database";
import { EntitySchemaService } from "../../../core/entity/schema/entity-schema.service";
import { Database } from "../../../core/database/database";
import { User } from "../../../core/user/user";
import { SessionService } from "../../../core/session/session-service/session.service";

const mockedRoute = {
  paramMap: Observable.create((observer) =>
    observer.next({
      get: () => "1",
    })
  ),
};

const mockedSessionService = {
  getCurrentUser(): User {
    return new User("1");
  },
};

const allChildren: Array<Note> = [];

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
        EntitySchemaService,
        EntityMapperService,
        { provide: SessionService, useValue: mockedSessionService },
        { provide: Database, useClass: MockDatabase },
        { provide: DatePipe, useValue: new DatePipe("medium") },
        { provide: ActivatedRoute, useValue: mockedRoute },
      ],
    }).compileComponents();
  });

  beforeEach(async () => {
    fixture = TestBed.createComponent(NotesOfChildComponent);
    component = fixture.componentInstance;
    component.ngOnInit();
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
