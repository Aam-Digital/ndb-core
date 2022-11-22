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
import { DataFilter } from "../../../core/entity-components/entity-subrecord/entity-subrecord/entity-subrecord-config";
import { defaultInteractionTypes } from "../../../core/config/default-config/default-interaction-types";

describe("NotesOfChildComponent", () => {
  let component: NotesOfChildComponent;
  let fixture: ComponentFixture<NotesOfChildComponent>;

  let mockChildrenService: jasmine.SpyObj<ChildrenService>;

  beforeEach(() => {
    mockChildrenService = jasmine.createSpyObj(["getNotesOf"]);
    mockChildrenService.getNotesOf.and.resolveTo([]);
    TestBed.configureTestingModule({
      imports: [NotesModule, MockedTestingModule.withState()],
      providers: [{ provide: ChildrenService, useValue: mockChildrenService }],
    }).compileComponents();
  });

  beforeEach(async () => {
    fixture = TestBed.createComponent(NotesOfChildComponent);
    component = fixture.componentInstance;
    component.onInitFromDynamicConfig({ entity: new Child("1") });
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });

  it("should throw an error when a invalid entity is passed", () => {
    const config: PanelConfig = { entity: new ChildSchoolRelation() };
    expect(() => component.onInitFromDynamicConfig(config)).toThrowError();
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

    entity = new School();
    component.onInitFromDynamicConfig({ entity });
    note = component.generateNewRecordFactory()();
    expect(note.schools).toEqual([entity.getId()]);
    expect(note.authors).toEqual([TEST_USER]);

    entity = new User();
    component.onInitFromDynamicConfig({ entity });
    note = component.generateNewRecordFactory()();
    expect(note.authors).toEqual([entity.getId(), TEST_USER]);
  });

  it("should sort notes by date", fakeAsync(() => {
    // No date should come first
    const n1 = new Note();
    const n2 = new Note();
    n2.date = moment().subtract(1, "day").toDate();
    const n3 = new Note();
    n3.date = moment().subtract(2, "days").toDate();
    mockChildrenService.getNotesOf.and.resolveTo([n3, n2, n1]);

    component.onInitFromDynamicConfig({ entity: new Child() });
    tick();

    expect(component.records).toEqual([n1, n2, n3]);
  }));

  it("should respect filter values when creating a new record", () => {
    const entity = new Child();
    const guardianTalk = defaultInteractionTypes.find(
      ({ id }) => id === "GUARDIAN_TALK"
    );
    const filter = {
      subject: "Test",
      "category.id": guardianTalk.id,
    } as DataFilter<Note>;
    component.onInitFromDynamicConfig({ config: { filter }, entity });

    const newEntity = component.newRecordFactory();

    expect(newEntity.subject).toBe("Test");
    expect(newEntity.category).toEqual(guardianTalk);
    expect(newEntity.children).toEqual([entity.getId()]);
  });
});
