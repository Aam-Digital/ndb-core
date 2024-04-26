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
import { Subject } from "rxjs";
import { UpdatedEntity } from "../../entity/model/entity-update";
import { Entity } from "../../entity/model/entity";
import { DatabaseEntity } from "../../entity/database-entity.decorator";
import { EntityDatatype } from "../../basic-datatypes/entity/entity.datatype";
import { School } from "../../../child-dev-project/schools/model/school";
import { DatabaseField } from "../../entity/database-field.decorator";
import { expectEntitiesToMatch } from "../../../utils/expect-entity-data.spec";
import { ArrayDatatype } from "../../basic-datatypes/array/array.datatype";

describe("RelatedEntitiesComponent", () => {
  let component: RelatedEntitiesComponent<ChildSchoolRelation>;
  let fixture: ComponentFixture<RelatedEntitiesComponent<ChildSchoolRelation>>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RelatedEntitiesComponent, MockedTestingModule.withState()],
    }).compileComponents();

    fixture = TestBed.createComponent(
      RelatedEntitiesComponent<ChildSchoolRelation>,
    );
    component = fixture.componentInstance;
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });

  it("should create a filter for the passed entity", fakeAsync(() => {
    const child = new Child();
    const columns = ["start", "end", "schoolId"];
    component.entity = child;
    component.entityType = ChildSchoolRelation.ENTITY_TYPE;
    component.columns = columns;
    fixture.detectChanges();
    tick();

    expect(component.filter).toEqual({ childId: child.getId() });
  }));

  it("should also include the provided filter", fakeAsync(() => {
    const child = new Child();
    const filter = { start: { $exists: true } };

    component.entity = child;
    component.entityType = ChildSchoolRelation.ENTITY_TYPE;
    component.filter = { ...filter };
    fixture.detectChanges();
    tick();

    expect(component.filter).toEqual({
      ...filter,
      childId: child.getId(),
      // added by table
      isActive: true,
    });
  }));

  it("should create a new entity that references the related one", fakeAsync(() => {
    const related = new Child();
    component.entity = related;
    component.entityType = ChildSchoolRelation.ENTITY_TYPE;
    component.columns = [];
    fixture.detectChanges();
    tick();

    const newEntity = component.createNewRecordFactory()();

    expect(newEntity instanceof ChildSchoolRelation).toBeTrue();
    expect(newEntity["childId"]).toBe(related.getId());
  }));

  it("should add a new entity that was created after the initial loading to the table", fakeAsync(() => {
    const entityUpdates = new Subject<UpdatedEntity<Entity>>();
    const entityMapper = TestBed.inject(EntityMapperService);
    spyOn(entityMapper, "receiveUpdates").and.returnValue(entityUpdates);
    component.entity = new Child();
    component.entityType = ChildSchoolRelation.ENTITY_TYPE;
    fixture.detectChanges();
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
    component.entity = new Child();
    component.entityType = entity.getType();
    component.data = [entity];
    fixture.detectChanges();
    tick();

    entityUpdates.next({ entity: entity, type: "remove" });
    tick();

    expect(component.data).toEqual([]);
  }));

  it("should support multiple related properties", fakeAsync(() => {
    @DatabaseEntity("MultiPropTest")
    class MultiPropTest extends Entity {
      @DatabaseField({
        dataType: EntityDatatype.dataType,
        additional: Child.ENTITY_TYPE,
      })
      singleChild: string;
      @DatabaseField({
        dataType: ArrayDatatype.dataType,
        innerDataType: EntityDatatype.dataType,
        additional: [Child.ENTITY_TYPE, School.ENTITY_TYPE],
      })
      multiEntities: string;
    }

    const child = new Child();
    component.entity = child;
    component.entityType = MultiPropTest.ENTITY_TYPE;
    component.filter = {};

    fixture.detectChanges();
    tick();

    // filter matching relations at any of the available props
    expect(component.filter).toEqual({
      $or: [
        { singleChild: child.getId() },
        { multiEntities: { $elemMatch: { $eq: child.getId() } } },
      ],
      // is added inside table
      isActive: true,
    });
    // no special properties set when creating a new entity
    expectEntitiesToMatch(
      [component.createNewRecordFactory()()],
      [new MultiPropTest()],
      true,
    );
  }));

  it("should align the filter with the related properties", async () => {
    @DatabaseEntity("PropTest")
    class PropTest extends Entity {}
    component.entityType = PropTest.ENTITY_TYPE;

    PropTest.schema.set("singleRelation", {
      dataType: EntityDatatype.dataType,
      additional: Child.ENTITY_TYPE,
    });
    component.entity = new Child();
    component.filter = undefined;
    component.property = undefined;
    await component.ngOnInit();
    expect(component.filter).toEqual({
      singleRelation: component.entity.getId(),
    });

    PropTest.schema.set("arrayRelation", {
      dataType: ArrayDatatype.dataType,
      innerDataType: EntityDatatype.dataType,
      additional: School.ENTITY_TYPE,
    });
    component.entity = new School();
    component.filter = undefined;
    component.property = undefined;
    await component.ngOnInit();
    expect(component.filter).toEqual({
      arrayRelation: { $elemMatch: { $eq: component.entity.getId() } },
    });

    PropTest.schema.set("multiTypeRelation", {
      dataType: ArrayDatatype.dataType,
      innerDataType: EntityDatatype.dataType,
      additional: [ChildSchoolRelation.ENTITY_TYPE, Child.ENTITY_TYPE],
    });
    component.entity = new ChildSchoolRelation();
    component.filter = undefined;
    component.property = undefined;
    await component.ngOnInit();
    expect(component.filter).toEqual({
      multiTypeRelation: { $elemMatch: { $eq: component.entity.getId() } },
    });

    // Now with 2 relations ("singleRelation" and "multiTypeRelation")
    component.entity = new Child();
    component.filter = undefined;
    component.property = undefined;
    await component.ngOnInit();
    expect(component.filter).toEqual({
      $or: [
        { singleRelation: component.entity.getId() },
        {
          multiTypeRelation: { $elemMatch: { $eq: component.entity.getId() } },
        },
      ],
    });

    // preselected property should not be changed
    component.entity = new Child();
    component.filter = undefined;
    component.property = "singleRelation";
    await component.ngOnInit();
    expect(component.filter).toEqual({
      singleRelation: component.entity.getId(),
    });
  });
});
