import { NotesOfChildComponent } from "./notes-of-child.component";
import {
  ComponentFixture,
  fakeAsync,
  TestBed,
  tick,
} from "@angular/core/testing";
import { NotesModule } from "../notes.module";
import { ChildrenService } from "../../children/children.service";
import { Note } from "../model/note";
import { Child } from "../../children/model/child";
import {
  MockedTestingModule,
  TEST_USER,
} from "../../../utils/mocked-testing.module";
import { ChildSchoolRelation } from "../../children/model/childSchoolRelation";
import { PanelConfig } from "../../../core/entity-components/entity-details/EntityDetailsConfig";
import { Entity } from "../../../core/entity/model/entity";
import { School } from "../../schools/model/school";
import { User } from "../../../core/user/user";
import moment from "moment";

describe("NotesOfChildComponent", () => {
  let component: NotesOfChildComponent;
  let fixture: ComponentFixture<NotesOfChildComponent>;

  let mockChildrenService: jasmine.SpyObj<ChildrenService>;

  beforeEach(() => {
    mockChildrenService = jasmine.createSpyObj(["getNotesRelatedTo"]);
    mockChildrenService.getNotesRelatedTo.and.resolveTo([]);
    TestBed.configureTestingModule({
      imports: [NotesModule, MockedTestingModule.withState()],
      providers: [{ provide: ChildrenService, useValue: mockChildrenService }],
    }).compileComponents();
  });

  beforeEach(async () => {
    fixture = TestBed.createComponent(NotesOfChildComponent);
    component = fixture.componentInstance;
    component.entity = new Child("1");
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });

  it("should use the attendance color function when passing a child", () => {
    const note = new Note();
    spyOn(note, "getColorForId");
    const entity = new Child();
    component.onInitFromDynamicConfig({ entity });

    component.getColor(note);

    expect(note.getColorForId).toHaveBeenCalledWith(entity.getId());
  });

  it("should create a new note and fill it with the appropriate initial value", () => {
    let entity: Entity = new Child();
    component.onInitFromDynamicConfig({ entity });
    let note = component.generateNewRecordFactory()();
    expect(note.children).toEqual([entity.getId()]);
    expect(note.authors).toEqual([TEST_USER]);
    expect(note.relatedEntities).toEqual([entity._id]);

    entity = new School();
    component.onInitFromDynamicConfig({ entity });
    note = component.generateNewRecordFactory()();
    expect(note.schools).toEqual([entity.getId()]);
    expect(note.authors).toEqual([TEST_USER]);
    expect(note.relatedEntities).toEqual([entity._id]);

    entity = new User();
    component.onInitFromDynamicConfig({ entity });
    note = component.generateNewRecordFactory()();
    expect(note.relatedEntities).toEqual([entity._id]);
    // adding a note for a User does not make that User an author of the note!
    expect(note.authors).toEqual([TEST_USER]);
  });

  it("should sort notes by date", fakeAsync(() => {
    // No date should come first
    const n1 = new Note();
    const n2 = new Note();
    n2.date = moment().subtract(1, "day").toDate();
    const n3 = new Note();
    n3.date = moment().subtract(2, "days").toDate();
    mockChildrenService.getNotesRelatedTo.and.resolveTo([n3, n2, n1]);

    component.onInitFromDynamicConfig({ entity: new Child() });
    tick();

    expect(mockChildrenService.getNotesRelatedTo).toHaveBeenCalledWith(
      component.entity._id
    );
    expect(component.records).toEqual([n1, n2, n3]);
  }));
});
