import { NotesOfChildComponent } from "./notes-of-child.component";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { NotesModule } from "../notes.module";
import { MatNativeDateModule } from "@angular/material/core";
import { ChildrenService } from "../../children/children.service";
import { DatePipe } from "@angular/common";
import { Note } from "../model/note";
import { Child } from "../../children/model/child";
import { RouterTestingModule } from "@angular/router/testing";
import { MockSessionModule } from "../../../core/session/mock-session.module";

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
      imports: [
        NotesModule,
        MatNativeDateModule,
        RouterTestingModule,
        MockSessionModule.withState(),
      ],
      providers: [
        { provide: ChildrenService, useValue: mockChildrenService },
        { provide: DatePipe, useValue: new DatePipe("medium") },
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
