import { NotesRelatedToEntityComponent } from "./notes-related-to-entity.component";
import { ComponentFixture, TestBed, waitForAsync } from "@angular/core/testing";
import { Note } from "../model/note";
import { MockedTestingModule } from "../../../utils/mocked-testing.module";
import { Entity } from "../../../core/entity/model/entity";
import { DatabaseEntity } from "../../../core/entity/database-entity.decorator";
import { DatabaseField } from "../../../core/entity/database-field.decorator";
import { ChildSchoolRelation } from "../../children/model/childSchoolRelation";
import { createEntityOfType } from "../../../core/demo-data/create-entity-of-type";
import { TestEntity } from "../../../utils/test-utils/TestEntity";

describe("NotesRelatedToEntityComponent", () => {
  let component: NotesRelatedToEntityComponent;
  let fixture: ComponentFixture<NotesRelatedToEntityComponent>;
  const originalNoteSchema_relatedEntities =
    Note.schema.get("relatedEntities").additional;

  beforeEach(waitForAsync(() => {
    Note.schema.get("relatedEntities").additional = [
      ChildSchoolRelation.ENTITY_TYPE,
    ];

    TestBed.configureTestingModule({
      imports: [NotesRelatedToEntityComponent, MockedTestingModule.withState()],
    }).compileComponents();
  }));

  beforeEach(waitForAsync(() => {
    fixture = TestBed.createComponent(NotesRelatedToEntityComponent);
    component = fixture.componentInstance;
  }));

  afterEach(() => {
    Note.schema.get("relatedEntities").additional =
      originalNoteSchema_relatedEntities;
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });

  it("should use the attendance color function when passing a child", () => {
    const note = new Note();
    spyOn(note, "getColorForId");
    const entity = createEntityOfType("Child");
    component.entity = entity;
    component.ngOnInit();

    component.getColor(note);

    expect(note.getColorForId).toHaveBeenCalledWith(entity.getId());
  });

  it("should create a new note and fill it with the appropriate initial value", async () => {
    let entity: Entity = createEntityOfType("Child");
    component.entity = entity;
    component.filter = undefined;
    component.property = undefined;
    await component.ngOnInit();
    let note = component.createNewRecordFactory()();
    expect(note.children).toEqual([entity.getId()]);

    entity = createEntityOfType("School");
    component.entity = entity;
    component.filter = undefined;
    component.property = undefined;
    await component.ngOnInit();
    note = component.createNewRecordFactory()();
    expect(note.schools).toEqual([entity.getId()]);

    entity = createEntityOfType("User");
    component.entity = entity;
    component.filter = undefined;
    component.property = undefined;
    await component.ngOnInit();
    note = component.createNewRecordFactory()();
    expect(note.relatedEntities).toEqual([entity.getId()]);

    entity = new ChildSchoolRelation();
    entity["childId"] = `Child:someChild`;
    entity["schoolId"] = `School:someSchool`;
    component.entity = entity;
    component.filter = undefined;
    component.property = undefined;
    await component.ngOnInit();
    note = component.createNewRecordFactory()();
    expect(note.relatedEntities).toEqual([entity.getId()]);
    expect(note.children).toEqual([`Child:someChild`]);
    expect(note.schools).toEqual([`School:someSchool`]);
  });

  it("should handle ChildSchoolRelation links also if they are arrays", async () => {
    const relation = new ChildSchoolRelation();
    relation.schoolId = ["School:1"] as any; // assume entity config was overwritten to hold array
    relation.childId = ["Child:1", "Child:2"] as any; // assume entity config was overwritten to hold array

    component.entity = relation;
    await component.ngOnInit();

    const newNote = component.createNewRecordFactory()();

    expect(newNote.relatedEntities).toContain(relation.getId());
    expect(newNote.children).toEqual(relation.childId);
    expect(newNote.schools).toEqual(relation.schoolId);
  });

  it("should create a new note and fill it with indirectly related references (2-hop) of the types allowed for note.relatedEntities", () => {
    @DatabaseEntity("EntityWithRelations")
    class EntityWithRelations extends Entity {
      static override ENTITY_TYPE = "EntityWithRelations";

      @DatabaseField({
        dataType: "entity",
        isArray: true,
        additional: ["Child", TestEntity.ENTITY_TYPE],
      })
      links;

      @DatabaseField({
        dataType: "entity",
        additional: "Child",
      })
      childrenLink;
    }
    const customEntity = new EntityWithRelations();
    customEntity.links = [
      `Child:1`,
      `${TestEntity.ENTITY_TYPE}:not-a-type-for-note.relatedEntities`,
    ];
    customEntity.childrenLink = `Child:child-without-prefix`;

    const schemaBefore = Note.schema.get("relatedEntities").additional;
    Note.schema.get("relatedEntities").additional = [
      "Child",
      EntityWithRelations.ENTITY_TYPE,
    ];
    component.entity = customEntity;
    component.ngOnInit();

    const newNote = component.createNewRecordFactory()();

    expect(newNote.relatedEntities).toContain(customEntity.getId());
    expect(newNote.relatedEntities).toContain(customEntity.links[0]);
    expect(newNote.relatedEntities).not.toContain(customEntity.links[1]);
    expect(newNote.relatedEntities).toContain(
      Entity.createPrefixedId("Child", customEntity.childrenLink),
    );

    Note.schema.get("relatedEntities").additional = schemaBefore;
  });
});
