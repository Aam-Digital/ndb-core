import {
  ComponentFixture,
  fakeAsync,
  TestBed,
  tick,
  waitForAsync,
} from "@angular/core/testing";

import { EntityCountDashboardComponent } from "./entity-count-dashboard.component";
import { ConfigurableEnumValue } from "../../../../core/basic-datatypes/configurable-enum/configurable-enum.interface";
import { EntityMapperService } from "../../../../core/entity/entity-mapper/entity-mapper.service";
import {
  mockEntityMapper,
  MockEntityMapperService,
} from "../../../../core/entity/entity-mapper/mock-entity-mapper-service";
import { MockedTestingModule } from "../../../../utils/mocked-testing.module";
import { RecurringActivity } from "../../../../child-dev-project/attendance/model/recurring-activity";
import { defaultInteractionTypes } from "../../../../core/config/default-config/default-interaction-types";
import { Note } from "../../../../child-dev-project/notes/model/note";
import { TestEntity } from "../../../../utils/test-utils/TestEntity";
import { Entity } from "../../../../core/entity/model/entity";

describe("EntityCountDashboardComponent", () => {
  let component: EntityCountDashboardComponent;
  let fixture: ComponentFixture<EntityCountDashboardComponent>;
  let entityMapper: MockEntityMapperService;

  function createChild(c: ConfigurableEnumValue) {
    const child = new TestEntity();
    child.category = c;
    return child;
  }

  beforeEach(waitForAsync(() => {
    entityMapper = mockEntityMapper();
    TestBed.configureTestingModule({
      imports: [EntityCountDashboardComponent, MockedTestingModule.withState()],
      providers: [{ provide: EntityMapperService, useValue: entityMapper }],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(EntityCountDashboardComponent);
    component = fixture.componentInstance;

    component.entityType = TestEntity.ENTITY_TYPE;
    component.groupBy = "category";

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

  it("should calculate children per center correctly", async () => {
    const centerA = { id: "a", label: "CenterA" };
    const centerB = { id: "b", label: "CenterB" };
    entityMapper.add(createChild(centerA));
    entityMapper.add(createChild(centerB));
    entityMapper.add(createChild(centerA));

    await component.ngOnInit();

    expect(component.entityGroupCounts)
      .withContext("unexpected number of centersWithProbability")
      .toHaveSize(2);
    const actualCenterAEntry = component.entityGroupCounts.filter(
      (e) => e.label === centerA.label,
    )[0];
    expect(actualCenterAEntry.value)
      .withContext("child count of CenterA not correct")
      .toBe(2);
    const actualCenterBEntry = component.entityGroupCounts.filter(
      (e) => e.label === centerB.label,
    )[0];
    expect(actualCenterBEntry.value)
      .withContext("child count of CenterB not correct")
      .toBe(1);
  });

  it("should groupBy enum values and display label", async () => {
    const testGroupBy = "test";
    TestEntity.schema.set(testGroupBy, { dataType: "configurable-enum" });
    component.groupBy = testGroupBy;

    const children = [
      new TestEntity(),
      new TestEntity(),
      new TestEntity(),
      new TestEntity(),
    ];
    const c1: ConfigurableEnumValue = { label: "foo", id: "01" };
    const c2: ConfigurableEnumValue = { label: "bar", id: "02" };
    children[0][testGroupBy] = c1;
    children[1][testGroupBy] = c2;
    children[2][testGroupBy] = c1;
    entityMapper.addAll(children);

    await component.ngOnInit();

    expect(component.entityGroupCounts).toHaveSize(3);
    expect(component.entityGroupCounts).toContain({
      label: c1.label,
      value: 2,
      id: c1.id,
    });
    expect(component.entityGroupCounts).toContain({
      label: c2.label,
      value: 1,
      id: c2.id,
    });

    TestEntity.schema.delete(testGroupBy);
  });

  it("should groupBy entity references and display an entity-block", async () => {
    const testGroupBy = "ref";
    component.groupBy = testGroupBy;
    component.entityType = TestEntity.ENTITY_TYPE;

    const c1 = new Entity("ref-1");
    const x0 = new TestEntity();
    const x1 = new TestEntity();

    x1[testGroupBy] = c1.getId();
    entityMapper.addAll([x0, x1, c1]);

    await component.ngOnInit();

    expect(component.groupedByEntity).toBe(TestEntity.ENTITY_TYPE);
    expect(component.entityGroupCounts).toHaveSize(2);
    expect(component.entityGroupCounts).toContain({
      label: "",
      value: 1,
      id: "",
    });
    expect(component.entityGroupCounts).toContain({
      label: c1.getId(),
      value: 1,
      id: c1.getId(),
    });
  });

  it("should groupBy arrays, split and summarized for individual array elements", async () => {
    const testGroupBy = "children";
    component.groupBy = testGroupBy;
    component.entityType = Note.ENTITY_TYPE;

    const x0 = new Note();
    const x1 = new Note();
    x1[testGroupBy] = ["link-1"];
    const x2 = new Note();
    x2[testGroupBy] = ["link-1", "link-2"];

    entityMapper.addAll([x0, x1, x2]);

    await component.ngOnInit();

    expect(component.entityGroupCounts).toHaveSize(3);
    expect(component.entityGroupCounts).toContain({
      label: "",
      value: 1,
      id: "",
    });
    expect(component.entityGroupCounts).toContain({
      label: "link-1",
      value: 2,
      id: "link-1",
    });
    expect(component.entityGroupCounts).toContain({
      label: "link-2",
      value: 1,
      id: "link-2",
    });
  });

  it("should also work with other entities", fakeAsync(() => {
    spyOn(entityMapper, "loadType").and.callThrough();
    const type1 = defaultInteractionTypes[1];
    const type2 = defaultInteractionTypes[2];
    const ra1 = new RecurringActivity();
    ra1.type = type1;
    const ra2 = new RecurringActivity();
    ra2.type = type1;
    const ra3 = new RecurringActivity();
    ra3.type = type2;
    const entity = RecurringActivity;
    entityMapper.addAll([ra1, ra2, ra3]);

    component.entityType = RecurringActivity.ENTITY_TYPE;
    component.groupBy = "type";
    component.ngOnInit();

    expect(entityMapper.loadType).toHaveBeenCalledWith(entity);
    tick();
    expect(component.totalEntities).toBe(3);
    expect(component.entityGroupCounts).toEqual([
      { label: type1.label, id: type1.id, value: 2 },
      { label: type2.label, id: type2.id, value: 1 },
    ]);
    expect(component.label).toBe(RecurringActivity.labelPlural);
  }));
});
