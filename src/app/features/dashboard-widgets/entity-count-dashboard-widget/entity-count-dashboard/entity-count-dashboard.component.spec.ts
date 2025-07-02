import { ComponentFixture, TestBed } from "@angular/core/testing";

import { EntityCountDashboardComponent } from "./entity-count-dashboard.component";

import { EntityMapperService } from "../../../../core/entity/entity-mapper/entity-mapper.service";
import {
  mockEntityMapper,
  MockEntityMapperService,
} from "../../../../core/entity/entity-mapper/mock-entity-mapper-service";
import { MockedTestingModule } from "../../../../utils/mocked-testing.module";
import { Note } from "../../../../child-dev-project/notes/model/note";
import { TestEntity } from "../../../../utils/test-utils/TestEntity";
import { Entity } from "../../../../core/entity/model/entity";
import { ConfigurableEnumValue } from "app/core/basic-datatypes/configurable-enum/configurable-enum.types";
import { ConfigurableEnum } from "app/core/basic-datatypes/configurable-enum/configurable-enum";
import { ConfigurableEnumService } from "app/core/basic-datatypes/configurable-enum/configurable-enum.service";

describe("EntityCountDashboardComponent", () => {
  let component: EntityCountDashboardComponent;
  let fixture: ComponentFixture<EntityCountDashboardComponent>;
  let entityMapper: MockEntityMapperService;

  function createChild(c: ConfigurableEnumValue) {
    const child = new TestEntity();
    child.category = c;
    return child;
  }

  beforeEach(async () => {
    entityMapper = mockEntityMapper();
    await TestBed.configureTestingModule({
      imports: [EntityCountDashboardComponent, MockedTestingModule.withState()],
      providers: [
        { provide: EntityMapperService, useValue: entityMapper },
        { provide: ConfigurableEnumService, useClass: ConfigurableEnumService },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(EntityCountDashboardComponent);
    component = fixture.componentInstance;

    component.entityType = TestEntity.ENTITY_TYPE;
    component.groupBy = ["category", "other", "ref"];

    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });

  it("should calculate totalChildren correctly", async () => {
    entityMapper.add(createChild({ id: "a", label: "CenterA" }));
    entityMapper.add(createChild({ id: "b", label: "CenterB" }));
    entityMapper.add(createChild({ id: "a", label: "CenterA" }));

    await component.ngOnInit();

    expect(component.totalEntities).toBe(3);
  });

  it("should groupBy enum values and display label", async () => {
    const c1: ConfigurableEnumValue = { label: "foo", id: "01" };
    const c2: ConfigurableEnumValue = { label: "bar", id: "02" };
    const c3: ConfigurableEnumValue = { label: "qux", id: "03" };
    const configurableEnum = new ConfigurableEnum("testEnum", [c1, c2, c3]);
    entityMapper.add(configurableEnum);

    const testGroupBy = "test";
    TestEntity.schema.set(testGroupBy, {
      dataType: "configurable-enum",
      additional: "testEnum",
    });
    component.groupBy = [testGroupBy];

    const children = [new TestEntity(), new TestEntity(), new TestEntity()];
    children[0][testGroupBy] = c1;
    children[1][testGroupBy] = c2;
    children[2][testGroupBy] = c1;
    entityMapper.addAll(children);

    await component.ngOnInit();

    const groupCounts =
      component.entityGroupCounts[
        component.groupBy[component.currentGroupIndex]
      ];

    expect(groupCounts).toEqual([
      {
        label: c1.label,
        value: 2,
        id: c1.id,
        groupedByEntity: undefined,
      },
      {
        label: c2.label,
        value: 1,
        id: c2.id,
        groupedByEntity: undefined,
      },
    ]);

    configurableEnum.values.reverse();
    await entityMapper.save(configurableEnum);
    await component.ngOnInit();

    const groupCountsReversed =
      component.entityGroupCounts[
        component.groupBy[component.currentGroupIndex]
      ];

    expect(groupCountsReversed.map((count) => count.label)).toEqual([
      c2.label,
      c1.label,
    ]);

    TestEntity.schema.delete(testGroupBy);
  });

  it("inlcudes a row for entities with missing configurable enum value", async () => {
    const c1: ConfigurableEnumValue = { label: "foo", id: "01" };
    const configurableEnum = new ConfigurableEnum("testEnum", [c1]);
    entityMapper.add(configurableEnum);

    const testGroupBy = "test";
    TestEntity.schema.set(testGroupBy, {
      dataType: "configurable-enum",
      additional: "testEnum",
    });
    component.groupBy = [testGroupBy];

    const children = [new TestEntity(), new TestEntity(), new TestEntity()];
    children[2][testGroupBy] = c1;
    entityMapper.addAll(children);

    await component.ngOnInit();

    const groupCounts =
      component.entityGroupCounts[
        component.groupBy[component.currentGroupIndex]
      ];

    expect(groupCounts).toEqual([
      {
        label: "",
        value: 2,
        id: "",
        groupedByEntity: undefined,
      },
      {
        label: "foo",
        value: 1,
        id: "01",
        groupedByEntity: undefined,
      },
    ]);

    TestEntity.schema.delete(testGroupBy);
  });

  it("should groupBy entity references and display an entity-block", async () => {
    const testGroupBy = "ref";
    component.groupBy = [testGroupBy];
    component.entityType = TestEntity.ENTITY_TYPE;

    const c1 = new Entity("ref-1");
    const x0 = new TestEntity();
    const x1 = new TestEntity();

    x1[testGroupBy] = c1.getId();
    entityMapper.addAll([x0, x1, c1]);

    await component.ngOnInit();

    const currentlyShownGroupCounts =
      component.entityGroupCounts[
        component.groupBy[component.currentGroupIndex]
      ];

    expect(currentlyShownGroupCounts).toHaveSize(2);
    expect(currentlyShownGroupCounts).toContain({
      label: "",
      value: 1,
      id: "",
      groupedByEntity: TestEntity.ENTITY_TYPE,
    });
    expect(currentlyShownGroupCounts).toContain({
      label: c1.getId(),
      value: 1,
      id: c1.getId(),
      groupedByEntity: TestEntity.ENTITY_TYPE,
    });
  });

  it("should groupBy arrays, split and summarized for individual array elements", async () => {
    const testGroupBy = "children";
    component.groupBy = [testGroupBy];
    component.entityType = Note.ENTITY_TYPE;

    const x0 = new Note();
    const x1 = new Note();
    x1[testGroupBy] = ["link-1"];
    const x2 = new Note();
    x2[testGroupBy] = ["link-1", "link-2"];

    entityMapper.addAll([x0, x1, x2]);

    await component.ngOnInit();

    const currentlyShownGroupCounts =
      component.entityGroupCounts[
        component.groupBy[component.currentGroupIndex]
      ];

    expect(currentlyShownGroupCounts).toHaveSize(3);
    expect(currentlyShownGroupCounts).toContain({
      label: "",
      value: 1,
      id: "",
      groupedByEntity: "Child",
    });
    expect(currentlyShownGroupCounts).toContain({
      label: "link-1",
      value: 2,
      id: "link-1",
      groupedByEntity: "Child",
    });
    expect(currentlyShownGroupCounts).toContain({
      label: "link-2",
      value: 1,
      id: "link-2",
      groupedByEntity: "Child",
    });
  });
});
