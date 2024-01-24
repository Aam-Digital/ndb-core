import { NotesRelatedToEntityComponent } from "./notes-related-to-entity.component";
import { ComponentFixture, TestBed, waitForAsync } from "@angular/core/testing";
import { ChildrenService } from "../../children/children.service";
import { Note } from "../model/note";
import { Child } from "../../children/model/child";
import { MockedTestingModule } from "../../../utils/mocked-testing.module";
import { Entity } from "../../../core/entity/model/entity";
import { School } from "../../schools/model/school";
import { User } from "../../../core/user/user";
import { ChildSchoolRelation } from "../../children/model/childSchoolRelation";
import { DatabaseEntity } from "../../../core/entity/database-entity.decorator";
import { DatabaseField } from "../../../core/entity/database-field.decorator";
import { EntityMapperService } from "../../../core/entity/entity-mapper/entity-mapper.service";

describe("NotesRelatedToEntityComponent", () => {
  let component: NotesRelatedToEntityComponent;
  let fixture: ComponentFixture<NotesRelatedToEntityComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [NotesRelatedToEntityComponent, MockedTestingModule.withState()],
    }).compileComponents();
  }));

  beforeEach(waitForAsync(() => {
    fixture = TestBed.createComponent(NotesRelatedToEntityComponent);
    component = fixture.componentInstance;
    component.entity = new Child("1");
    fixture.detectChanges();
  }));

  it("should create", () => {
    expect(component).toBeTruthy();
  });

  it("should use the attendance color function when passing a child", () => {
    const note = new Note();
    spyOn(note, "getColorForId");
    const entity = new Child();
    component.entity = entity;
    component.ngOnInit();

    component.getColor(note);

    expect(note.getColorForId).toHaveBeenCalledWith(entity.getId());
  });

  it("should create a new note and fill it with the appropriate initial value", () => {
    let entity: Entity = new Child();
    component.entity = entity;
    component.ngOnInit();
    let note = component.generateNewRecordFactory()();
    expect(note.children).toEqual([entity.getId()]);

    entity = new School();
    component.entity = entity;
    component.ngOnInit();
    note = component.generateNewRecordFactory()();
    expect(note.schools).toEqual([entity.getId()]);

    entity = new User();
    component.entity = entity;
    component.ngOnInit();
    note = component.generateNewRecordFactory()();
    expect(note.relatedEntities).toEqual([entity.getId(true)]);

    entity = new ChildSchoolRelation();
    entity["childId"] = "someChild";
    entity["schoolId"] = "someSchool";
    component.entity = entity;
    component.ngOnInit();
    note = component.generateNewRecordFactory()();
    expect(note.relatedEntities).toContain(entity.getId(true));
    expect(note.children).toEqual(["someChild"]);
    expect(note.schools).toEqual(["someSchool"]);
  });

  it("should create a new note and fill it with indirectly related references (2-hop) of the types allowed for note.relatedEntities", () => {
    @DatabaseEntity("EntityWithRelations")
    class EntityWithRelations extends Entity {
      static ENTITY_TYPE = "EntityWithRelations";

      @DatabaseField({
        dataType: "entity-array",
        additional: [Child.ENTITY_TYPE, School.ENTITY_TYPE],
      })
      links;

      @DatabaseField({
        dataType: "entity",
        additional: Child.ENTITY_TYPE,
      })
      childrenLink;
    }
    const customEntity = new EntityWithRelations();
    customEntity.links = [
      "Child:1",
      "School:not-a-type-for-note.relatedEntities",
    ];
    customEntity.childrenLink = "child-without-prefix";

    Note.schema.get("relatedEntities").additional = [
      Child.ENTITY_TYPE,
      EntityWithRelations.ENTITY_TYPE,
    ];
    component.entity = customEntity;
    component.ngOnInit();

    const newNote = component.generateNewRecordFactory()();

    expect(newNote.relatedEntities).toContain(customEntity.getId(true));
    expect(newNote.relatedEntities).toContain(customEntity.links[0]);
    expect(newNote.relatedEntities).not.toContain(customEntity.links[1]);
    expect(newNote.relatedEntities).toContain(
      Entity.createPrefixedId(Child.ENTITY_TYPE, customEntity.childrenLink),
    );
  });

  it("should only add related notes after the initial load", async () => {
    const child = new Child();
    const data = [new Note(), new Note()];
    data.forEach((n) => n.addChild(child));
    const childrenService = TestBed.inject(ChildrenService);
    spyOn(childrenService, "getNotesRelatedTo").and.resolveTo([...data]);
    component.entity = child;

    await component.ngOnInit();
    expect(component.data).toEqual(data);

    const relatedNote = new Note();
    relatedNote.addChild(child);
    await TestBed.inject(EntityMapperService).save(relatedNote);
    const expectedData = jasmine.arrayWithExactContents(
      data.concat(relatedNote),
    );
    expect(component.data).toEqual(expectedData);

    const unrelatedNote = new Note();
    await TestBed.inject(EntityMapperService).save(unrelatedNote);
    // TODO is actually filtering data necessary here?
    // expect(component.data).toEqual(expectedData);
  });
});
