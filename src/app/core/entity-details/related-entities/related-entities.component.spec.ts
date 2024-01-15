import {
  ComponentFixture,
  fakeAsync,
  TestBed,
  tick,
} from "@angular/core/testing";

import { RelatedEntitiesComponent } from "./related-entities.component";
import { MockedTestingModule } from "../../../utils/mocked-testing.module";
import { EntityMapperService } from "../../entity/entity-mapper/entity-mapper.service";
import { Child } from "../../../child-dev-project/children/model/child";
import { ChildSchoolRelation } from "../../../child-dev-project/children/model/childSchoolRelation";
import { Note } from "../../../child-dev-project/notes/model/note";
import { Subject } from "rxjs";
import { UpdatedEntity } from "../../entity/model/entity-update";
import { Entity } from "../../entity/model/entity";

describe("RelatedEntitiesComponent", () => {
  let component: RelatedEntitiesComponent<ChildSchoolRelation | Note>;
  let fixture: ComponentFixture<
    RelatedEntitiesComponent<ChildSchoolRelation | Note>
  >;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RelatedEntitiesComponent, MockedTestingModule.withState()],
    }).compileComponents();

    fixture = TestBed.createComponent(
      RelatedEntitiesComponent<ChildSchoolRelation>,
    );
    component = fixture.componentInstance;
    component.entity = new Child();
    component.entityType = ChildSchoolRelation.ENTITY_TYPE;
    component.property = "childId";
    component.columns = [];
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });

  it("should load only the entities which are linked with the passed one", async () => {
    const c1 = new Child();
    const c2 = new Child();
    const r1 = new ChildSchoolRelation();
    r1.childId = c1.getId();
    const r2 = new ChildSchoolRelation();
    r2.childId = c1.getId();
    const r3 = new ChildSchoolRelation();
    r3.childId = c2.getId();
    const entityMapper = TestBed.inject(EntityMapperService);
    await entityMapper.saveAll([c1, c2, r1, r2, r3]);
    const columns = ["start", "end", "schoolId"];
    const filter = { start: { $exists: true } } as any;

    component.entity = c1;
    component.entityType = ChildSchoolRelation.ENTITY_TYPE;
    component.property = "childId";
    component.columns = columns;
    component.filter = filter;
    await component.ngOnInit();

    expect(component.data).toEqual([r1, r2]);
    expect(component.filter).toEqual({ ...filter, childId: c1.getId() });
  });

  it("should ignore entities of the related type where the matching field is undefined instead of array", async () => {
    const c1 = new Child();
    const r1 = new Note();
    r1.children = [c1.getId()];
    const rEmpty = new Note();
    delete rEmpty.children; // some entity types will not have a default empty array
    const entityMapper = TestBed.inject(EntityMapperService);
    await entityMapper.saveAll([c1, r1, rEmpty]);

    component.entity = c1;
    component.entityType = Note.ENTITY_TYPE;
    component.property = "children";
    await component.ngOnInit();

    expect(component.data).toEqual([r1]);
  });

  it("should create a new entity that references the related one", async () => {
    const related = new Child();
    component.entity = related;
    component.entityType = ChildSchoolRelation.ENTITY_TYPE;
    component.property = "childId";
    component.columns = [];
    await component.ngOnInit();

    const newEntity = component.createNewRecordFactory()();

    expect(newEntity instanceof ChildSchoolRelation).toBeTrue();
    expect(newEntity["childId"]).toBe(related.getId());
  });

  it("should add a new entity that was created after the initial loading to the table", fakeAsync(() => {
    const entityUpdates = new Subject<UpdatedEntity<Entity>>();
    const entityMapper = TestBed.inject(EntityMapperService);
    spyOn(entityMapper, "receiveUpdates").and.returnValue(entityUpdates);
    component.ngOnInit();
    tick();

    const entity = new ChildSchoolRelation();
    entityUpdates.next({ entity: entity, type: "new" });
    tick();

    expect(component.data).toEqual([entity]);
  }));

  it("should remove an entity from the table when it has been deleted", fakeAsync(() => {
    const entityUpdates = new Subject<UpdatedEntity<Entity>>();
    const entityMapper = TestBed.inject(EntityMapperService);
    spyOn(entityMapper, "receiveUpdates").and.returnValue(entityUpdates);
    const entity = new ChildSchoolRelation();
    component.data = [entity];
    component.ngOnInit();
    tick();

    entityUpdates.next({ entity: entity, type: "remove" });
    tick();

    expect(component.data).toEqual([]);
  }));
});
