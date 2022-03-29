import { NotesOfChildComponent } from "./notes-of-child.component";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { NotesModule } from "../notes.module";
import { ChildrenService } from "../../children/children.service";
import { Note } from "../model/note";
import { Child } from "../../children/model/child";
import { MockedTestingModule } from "../../../utils/mocked-testing.module";

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
      imports: [NotesModule, MockedTestingModule.withState()],
      providers: [{ provide: ChildrenService, useValue: mockChildrenService }],
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
