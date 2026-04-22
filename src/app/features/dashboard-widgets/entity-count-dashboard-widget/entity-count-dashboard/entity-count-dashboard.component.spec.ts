import { ComponentFixture, TestBed } from "@angular/core/testing";

import { EntityCountDashboardComponent } from "./entity-count-dashboard.component";
import { EntityMapperService } from "../../../../core/entity/entity-mapper/entity-mapper.service";
import {
  mockEntityMapperProvider,
  MockEntityMapperService,
} from "../../../../core/entity/entity-mapper/mock-entity-mapper-service";
import { MockedTestingModule } from "../../../../utils/mocked-testing.module";
import { Note } from "../../../../child-dev-project/notes/model/note";
import { TestEntity } from "../../../../utils/test-utils/TestEntity";
import { Entity } from "../../../../core/entity/model/entity";
import { ConfigurableEnumValue } from "app/core/basic-datatypes/configurable-enum/configurable-enum.types";
import { ConfigurableEnum } from "app/core/basic-datatypes/configurable-enum/configurable-enum";

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
    await TestBed.configureTestingModule({
      imports: [EntityCountDashboardComponent, MockedTestingModule.withState()],
      providers: [...mockEntityMapperProvider()],
    }).compileComponents();

    fixture = TestBed.createComponent(EntityCountDashboardComponent);
    component = fixture.componentInstance;

    fixture.componentRef.setInput("entityType", TestEntity.ENTITY_TYPE);
    fixture.componentRef.setInput("groupBy", ["category", "other", "ref"]);

    fixture.detectChanges();

    entityMapper = TestBed.inject(
      EntityMapperService,
    ) as MockEntityMapperService;
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });

  it("should calculate totalChildren correctly", async () => {
    entityMapper.add(createChild({ id: "a", label: "CenterA" }));
    entityMapper.add(createChild({ id: "b", label: "CenterB" }));
    entityMapper.add(createChild({ id: "a", label: "CenterA" }));

    await fixture.whenStable();

    expect(component.totalEntities()).toBe(3);
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
    fixture.componentRef.setInput("groupBy", [testGroupBy]);

    const children = [new TestEntity(), new TestEntity(), new TestEntity()];
    children[0][testGroupBy] = c1;
    children[1][testGroupBy] = c2;
    children[2][testGroupBy] = c1;
    entityMapper.addAll(children);

    fixture.detectChanges();
    await fixture.whenStable();

    const groupCounts =
      component.entityGroupCounts()[
        component.groupBy()[component.currentGroupIndex()]
      ];

    expect(groupCounts).toEqual([
      {
        label: c1.label,
        value: 2,
        id: c1.id,
        fieldName: "test",
        entity: expect.any(TestEntity),
      },
      {
        label: c2.label,
        value: 1,
        id: c2.id,
        fieldName: "test",
        entity: expect.any(TestEntity),
      },
    ]);

    configurableEnum.values.reverse();
    await entityMapper.save(configurableEnum);
    fixture.detectChanges();
    await fixture.whenStable();

    const groupCountsReversed =
      component.entityGroupCounts()[
        component.groupBy()[component.currentGroupIndex()]
      ];

    expect(groupCountsReversed.map((count) => count.label)).toEqual([
      c1.label,
      c2.label,
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
    fixture.componentRef.setInput("groupBy", [testGroupBy]);

    const children = [new TestEntity(), new TestEntity(), new TestEntity()];
    children[2][testGroupBy] = c1;
    entityMapper.addAll(children);

    fixture.detectChanges();
    await fixture.whenStable();

    const groupCounts =
      component.entityGroupCounts()[
        component.groupBy()[component.currentGroupIndex()]
      ];

    expect(groupCounts).toEqual([
      {
        label: undefined,
        value: 2,
        id: "",
        fieldName: "test",
      },
      {
        label: "foo",
        value: 1,
        id: "01",
        fieldName: "test",
        entity: expect.any(TestEntity),
      },
    ]);

    TestEntity.schema.delete(testGroupBy);
  });

  it("should groupBy entity references and display an entity-block", async () => {
    const testGroupBy = "ref";
    fixture.componentRef.setInput("groupBy", [testGroupBy]);
    fixture.componentRef.setInput("entityType", TestEntity.ENTITY_TYPE);

    const c1 = new Entity("ref-1");
    const x0 = new TestEntity();
    const x1 = new TestEntity();

    x1[testGroupBy] = c1.getId();
    entityMapper.addAll([x0, x1, c1]);

    fixture.detectChanges();
    await fixture.whenStable();

    const currentlyShownGroupCounts =
      component.entityGroupCounts()[
        component.groupBy()[component.currentGroupIndex()]
      ];

    expect(currentlyShownGroupCounts).toHaveLength(2);
    expect(currentlyShownGroupCounts).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          label: undefined,
          value: 1,
          id: "",
          fieldName: "ref",
        }),
        expect.objectContaining({
          label: c1.getId(),
          value: 1,
          id: c1.getId(),
          fieldName: "ref",
          entity: expect.any(TestEntity),
        }),
      ]),
    );
  });

  it("should groupBy arrays, split and summarized for individual array elements", async () => {
    const testGroupBy = "children";
    fixture.componentRef.setInput("groupBy", [testGroupBy]);
    fixture.componentRef.setInput("entityType", Note.ENTITY_TYPE);

    const x0 = new Note();
    const x1 = new Note();
    x1[testGroupBy] = ["link-1"];
    const x2 = new Note();
    x2[testGroupBy] = ["link-1", "link-2"];

    entityMapper.addAll([x0, x1, x2]);

    fixture.detectChanges();
    await fixture.whenStable();

    const currentlyShownGroupCounts =
      component.entityGroupCounts()[
        component.groupBy()[component.currentGroupIndex()]
      ];

    expect(currentlyShownGroupCounts).toHaveLength(3);
    expect(currentlyShownGroupCounts).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          label: undefined,
          value: 1,
          id: "",
          fieldName: "children",
        }),
        expect.objectContaining({
          label: "link-1",
          value: 2,
          id: "link-1",
          fieldName: "children",
          entity: expect.any(Note),
        }),
        expect.objectContaining({
          label: "link-2",
          value: 1,
          id: "link-2",
          fieldName: "children",
          entity: expect.any(Note),
        }),
      ]),
    );
  });
});
