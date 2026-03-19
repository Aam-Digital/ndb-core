import { ComponentFixture, TestBed } from "@angular/core/testing";

import { RelatedEntitiesComponent } from "./related-entities.component";
import { MockedTestingModule } from "../../../utils/mocked-testing.module";
import { EntityMapperService } from "../../entity/entity-mapper/entity-mapper.service";
import { Subject } from "rxjs";
import { UpdatedEntity } from "../../entity/model/entity-update";
import { Entity } from "../../entity/model/entity";
import { DatabaseEntity } from "../../entity/database-entity.decorator";
import { EntityDatatype } from "../../basic-datatypes/entity/entity.datatype";
import { TestEntity } from "../../../utils/test-utils/TestEntity";
import { createEntityOfType } from "../../demo-data/create-entity-of-type";
import {
  EntitySpecialLoaderService,
  LoaderMethod,
} from "../../entity/entity-special-loader/entity-special-loader.service";

describe("RelatedEntitiesComponent", () => {
  let component: RelatedEntitiesComponent<any>;
  let fixture: ComponentFixture<RelatedEntitiesComponent<any>>;
  let mockLoaderService: any;

  beforeEach(async () => {
    mockLoaderService = {
      loadDataFor: vi.fn().mockName("EntitySpecialLoaderService.loadDataFor"),
    };
    await TestBed.configureTestingModule({
      imports: [RelatedEntitiesComponent, MockedTestingModule.withState()],
      providers: [
        { provide: EntitySpecialLoaderService, useValue: mockLoaderService },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(RelatedEntitiesComponent<any>);
    component = fixture.componentInstance;
  });

  async function initComponent() {
    await component.ngOnInit();
  }

  it("should create", () => {
    expect(component).toBeTruthy();
  });

  it("should create a filter for the passed entity", async () => {
    const entity = new TestEntity();
    const columns = ["name"];
    component.entity = entity;
    component.entityType = TestEntity.ENTITY_TYPE;
    component.property = "ref";
    component.columns = columns;
    await initComponent();

    expect(component.filter).toEqual({ ref: entity.getId() });
  });

  it("should also include the provided filter", async () => {
    const entity = new TestEntity();
    const filter = { start: { $exists: true } };

    component.entity = entity;
    component.entityType = TestEntity.ENTITY_TYPE;
    component.property = "ref";
    component.filter = { ...filter };
    await initComponent();

    expect(component.filter).toEqual({
      ...filter,
      ref: entity.getId(),
    });
  });

  it("should create a new entity that references the related one", async () => {
    const related = new TestEntity();
    component.entity = related;
    component.entityType = TestEntity.ENTITY_TYPE;
    component.property = "ref";
    component.columns = [];
    await initComponent();

    const newEntity = component.createNewRecordFactory()();

    expect(newEntity instanceof TestEntity).toBe(true);
    expect(newEntity["ref"]).toBe(related.getId());
  });

  it("should add a new entity that was created after the initial loading to the table", async () => {
    const entityUpdates = new Subject<UpdatedEntity<Entity>>();
    const entityMapper = TestBed.inject(EntityMapperService);
    vi.spyOn(entityMapper, "receiveUpdates").mockReturnValue(entityUpdates);
    component.entity = new TestEntity();
    component.entityType = TestEntity.ENTITY_TYPE;
    component.property = "ref";
    await initComponent();

    const entity = new TestEntity();
    entityUpdates.next({ entity: entity, type: "new" });

    expect(component.data).toEqual([entity]);
  });

  it("should remove an entity from the table when it has been deleted", async () => {
    const entityUpdates = new Subject<UpdatedEntity<Entity>>();
    const entityMapper = TestBed.inject(EntityMapperService);
    vi.spyOn(entityMapper, "receiveUpdates").mockReturnValue(entityUpdates);

    const entity = new TestEntity();
    component.entity = new TestEntity();
    component.entityType = entity.getType();
    component.property = "ref";
    component.data = [entity];
    await initComponent();

    entityUpdates.next({ entity: entity, type: "remove" });

    expect(component.data).toEqual([]);
  });

  it("should support multiple related properties", async () => {
    @DatabaseEntity("MultiPropTest")
    class MultiPropTest extends Entity {}

    MultiPropTest.schema.set("singleChild", {
      dataType: EntityDatatype.dataType,
      additional: TestEntity.ENTITY_TYPE,
    });
    MultiPropTest.schema.set("multiEntities", {
      dataType: EntityDatatype.dataType,
      isArray: true,
      additional: [TestEntity.ENTITY_TYPE, "OtherType"],
    });

    const entity = new TestEntity();
    component.entity = entity;
    component.entityType = MultiPropTest.ENTITY_TYPE;
    component.filter = {};

    await initComponent();

    // filter matching relations at any of the available props
    expect(component.filter).toEqual({
      $or: [
        { singleChild: entity.getId() },
        { multiEntities: { $elemMatch: { $eq: entity.getId() } } },
      ],
    });
    // all matching properties set when creating a new entity
    const newEntity = component.createNewRecordFactory()();
    expect(newEntity.singleChild).toBe(entity.getId());
    expect(newEntity.multiEntities).toEqual([entity.getId()]);
  });

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

  it("should detect entity references nested in embedded schemas (e.g. attendance.participant)", async () => {
    @DatabaseEntity("EmbedTest")
    class EmbedTest extends Entity {}

    EmbedTest.schema.set("attendance", {
      dataType: "attendance",
      isArray: true,
      additional: {
        participant: {
          dataType: EntityDatatype.dataType,
          additional: [TestEntity.ENTITY_TYPE, "OtherType"],
        },
      },
    });

    component.entityType = EmbedTest.ENTITY_TYPE;
    component.entity = new TestEntity();
    component.filter = undefined;
    component.property = undefined;
    await component.ngOnInit();

    expect(component.filter).toEqual({
      attendance: {
        $elemMatch: { participant: component.entity.getId() },
      },
    });
  });

  it("should combine direct and nested entity references in filter", async () => {
    @DatabaseEntity("MixedEmbedTest")
    class MixedEmbedTest extends Entity {}

    MixedEmbedTest.schema.set("authors", {
      dataType: EntityDatatype.dataType,
      isArray: true,
      additional: TestEntity.ENTITY_TYPE,
    });
    MixedEmbedTest.schema.set("attendance", {
      dataType: "attendance",
      isArray: true,
      additional: {
        participant: {
          dataType: EntityDatatype.dataType,
          additional: [TestEntity.ENTITY_TYPE],
        },
      },
    });

    component.entityType = MixedEmbedTest.ENTITY_TYPE;
    component.entity = new TestEntity();
    component.filter = undefined;
    component.property = undefined;
    await component.ngOnInit();

    expect(component.filter).toEqual({
      $or: [
        { authors: { $elemMatch: { $eq: component.entity.getId() } } },
        {
          attendance: {
            $elemMatch: { participant: component.entity.getId() },
          },
        },
      ],
    });
  });

  it("should resolve nested entity ref when property is manually set to an embedded schema field", async () => {
    @DatabaseEntity("ManualPropTest")
    class ManualPropTest extends Entity {}

    ManualPropTest.schema.set("authors", {
      dataType: EntityDatatype.dataType,
      isArray: true,
      additional: TestEntity.ENTITY_TYPE,
    });
    ManualPropTest.schema.set("attendance", {
      dataType: "attendance",
      isArray: true,
      additional: {
        participant: {
          dataType: EntityDatatype.dataType,
          additional: [TestEntity.ENTITY_TYPE],
        },
      },
    });

    component.entityType = ManualPropTest.ENTITY_TYPE;
    component.entity = new TestEntity();
    component.filter = undefined;
    component.property = "attendance";
    await component.ngOnInit();

    // should only filter by attendance, not authors
    expect(component.filter).toEqual({
      attendance: {
        $elemMatch: { participant: component.entity.getId() },
      },
    });
  });

  it("it calls children service with id from passed child", async () => {
    const child = createEntityOfType("Child");
    mockLoaderService.loadDataFor.mockResolvedValue([]);

    component.entity = child;
    component.entityType = "ChildSchoolRelation";
    component.columns = [];
    component.loaderMethod = LoaderMethod.ChildrenServiceQueryRelations;
    await initComponent();

    expect(mockLoaderService.loadDataFor).toHaveBeenCalledWith(
      LoaderMethod.ChildrenServiceQueryRelations,
      child,
    );
  });
});
