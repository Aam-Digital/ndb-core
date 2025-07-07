import {
  ComponentFixture,
  fakeAsync,
  TestBed,
  tick,
} from "@angular/core/testing";

import { RelatedEntitiesComponent } from "./related-entities.component";
import { MockedTestingModule } from "../../../utils/mocked-testing.module";
import { EntityMapperService } from "../../entity/entity-mapper/entity-mapper.service";
import { Subject } from "rxjs";
import { UpdatedEntity } from "../../entity/model/entity-update";
import { Entity } from "../../entity/model/entity";
import { DatabaseEntity } from "../../entity/database-entity.decorator";
import { EntityDatatype } from "../../basic-datatypes/entity/entity.datatype";
import { DatabaseField } from "../../entity/database-field.decorator";
import { expectEntitiesToMatch } from "../../../utils/expect-entity-data.spec";
import { TestEntity } from "../../../utils/test-utils/TestEntity";
import { ChildrenService } from "#src/app/child-dev-project/children/children.service";
import { createEntityOfType } from "../../demo-data/create-entity-of-type";
import { LoaderMethod } from "../../entity/entity-special-loader/entity-special-loader.service";

describe("RelatedEntitiesComponent", () => {
  let component: RelatedEntitiesComponent<any>;
  let fixture: ComponentFixture<RelatedEntitiesComponent<any>>;
  let mockChildrenService: jasmine.SpyObj<ChildrenService>;

  beforeEach(async () => {
    mockChildrenService = jasmine.createSpyObj("ChildrenService", [
      "queryRelations",
    ]);
    await TestBed.configureTestingModule({
      imports: [RelatedEntitiesComponent, MockedTestingModule.withState()],
      providers: [{ provide: ChildrenService, useValue: mockChildrenService }],
    }).compileComponents();

    fixture = TestBed.createComponent(RelatedEntitiesComponent<any>);
    component = fixture.componentInstance;
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });

  it("should create a filter for the passed entity", fakeAsync(() => {
    const entity = new TestEntity();
    const columns = ["name"];
    component.entity = entity;
    component.entityType = TestEntity.ENTITY_TYPE;
    component.columns = columns;
    component.ngOnInit();
    tick();

    expect(component.filter).toEqual({ ref: entity.getId() });
  }));

  it("should also include the provided filter", fakeAsync(() => {
    const entity = new TestEntity();
    const filter = { start: { $exists: true } };

    component.entity = entity;
    component.entityType = TestEntity.ENTITY_TYPE;
    component.filter = { ...filter };
    fixture.detectChanges();
    tick();

    expect(component.filter).toEqual({
      ...filter,
      ref: entity.getId(),
      // added by table
      isActive: true,
    });
  }));

  it("should create a new entity that references the related one", fakeAsync(() => {
    const related = new TestEntity();
    component.entity = related;
    component.entityType = TestEntity.ENTITY_TYPE;
    component.columns = [];
    fixture.detectChanges();
    tick();

    const newEntity = component.createNewRecordFactory()();

    expect(newEntity instanceof TestEntity).toBeTrue();
    expect(newEntity["ref"]).toBe(related.getId());
  }));

  it("should add a new entity that was created after the initial loading to the table", fakeAsync(() => {
    const entityUpdates = new Subject<UpdatedEntity<Entity>>();
    const entityMapper = TestBed.inject(EntityMapperService);
    spyOn(entityMapper, "receiveUpdates").and.returnValue(entityUpdates);
    component.entity = new TestEntity();
    component.entityType = TestEntity.ENTITY_TYPE;
    fixture.detectChanges();
    tick();

    const entity = new TestEntity();
    entityUpdates.next({ entity: entity, type: "new" });
    tick();

    expect(component.data).toEqual([entity]);
  }));

  it("should remove an entity from the table when it has been deleted", fakeAsync(() => {
    const entityUpdates = new Subject<UpdatedEntity<Entity>>();
    const entityMapper = TestBed.inject(EntityMapperService);
    spyOn(entityMapper, "receiveUpdates").and.returnValue(entityUpdates);

    const entity = new TestEntity();
    component.entity = new TestEntity();
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
        additional: TestEntity.ENTITY_TYPE,
      })
      singleChild: string;

      @DatabaseField({
        dataType: EntityDatatype.dataType,
        isArray: true,
        additional: [TestEntity.ENTITY_TYPE, "OtherType"],
      })
      multiEntities: string;
    }

    const entity = new TestEntity();
    component.entity = entity;
    component.entityType = MultiPropTest.ENTITY_TYPE;
    component.filter = {};

    fixture.detectChanges();
    tick();

    // filter matching relations at any of the available props
    expect(component.filter).toEqual({
      $or: [
        { singleChild: entity.getId() },
        { multiEntities: { $elemMatch: { $eq: entity.getId() } } },
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
      additional: TestEntity.ENTITY_TYPE,
    });
    component.entity = new TestEntity();
    component.filter = undefined;
    component.property = undefined;
    await component.ngOnInit();
    expect(component.filter).toEqual({
      singleRelation: component.entity.getId(),
    });

    PropTest.schema.set("arrayRelation", {
      dataType: EntityDatatype.dataType,
      isArray: true,
      additional: TestEntity.ENTITY_TYPE,
    });
    component.entity = new TestEntity();
    component.filter = undefined;
    component.property = undefined;
    await component.ngOnInit();
    expect(component.filter).toEqual({
      $or: [
        { singleRelation: component.entity.getId() },
        { arrayRelation: { $elemMatch: { $eq: component.entity.getId() } } },
      ],
    });

    PropTest.schema.set("multiTypeRelation", {
      dataType: EntityDatatype.dataType,
      isArray: true,
      additional: [Entity.ENTITY_TYPE, TestEntity.ENTITY_TYPE],
    });
    component.entity = new Entity();
    component.filter = undefined;
    component.property = undefined;
    await component.ngOnInit();
    expect(component.filter).toEqual({
      multiTypeRelation: { $elemMatch: { $eq: component.entity.getId() } },
    });

    // Now with 2 relations ("singleRelation" and "multiTypeRelation")
    component.entity = new TestEntity();
    component.filter = undefined;
    component.property = undefined;
    await component.ngOnInit();
    expect(component.filter).toEqual({
      $or: [
        { singleRelation: component.entity.getId() },
        { arrayRelation: { $elemMatch: { $eq: component.entity.getId() } } },
        {
          multiTypeRelation: { $elemMatch: { $eq: component.entity.getId() } },
        },
      ],
    });

    // preselected property should not be changed
    component.entity = new TestEntity();
    component.filter = undefined;
    component.property = "singleRelation";
    await component.ngOnInit();
    expect(component.filter).toEqual({
      singleRelation: component.entity.getId(),
    });
  });

  it("it calls children service with id from passed child", fakeAsync(() => {
    const child = createEntityOfType("Child");
    mockChildrenService.queryRelations.and.resolveTo([]);

    component.entity = child;
    component.entityType = "ChildSchoolRelation";
    component.columns = [];
    component.loaderMethod = LoaderMethod.ChildrenServiceQueryRelations;
    fixture.detectChanges();
    tick();

    expect(mockChildrenService.queryRelations).toHaveBeenCalledWith(
      child.getId(),
    );
  }));
});
