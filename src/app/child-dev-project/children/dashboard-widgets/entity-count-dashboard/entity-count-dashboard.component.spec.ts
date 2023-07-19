import {
  ComponentFixture,
  fakeAsync,
  TestBed,
  tick,
  waitForAsync,
} from "@angular/core/testing";

import { EntityCountDashboardComponent } from "./entity-count-dashboard.component";
import { Center, Child } from "../../model/child";
import { ConfigurableEnumValue } from "../../../../core/configurable-enum/configurable-enum.interface";
import { EntityMapperService } from "../../../../core/entity/entity-mapper.service";
import {
  mockEntityMapper,
  MockEntityMapperService,
} from "../../../../core/entity/mock-entity-mapper-service";
import { MockedTestingModule } from "../../../../utils/mocked-testing.module";
import { RecurringActivity } from "../../../attendance/model/recurring-activity";
import { defaultInteractionTypes } from "../../../../core/config/default-config/default-interaction-types";

describe("EntityCountDashboardComponent", () => {
  let component: EntityCountDashboardComponent;
  let fixture: ComponentFixture<EntityCountDashboardComponent>;
  let entityMapper: MockEntityMapperService;

  function createChild(center: Center) {
    const child = new Child();
    child.center = center;
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
      (e) => e.label === centerA.label
    )[0];
    expect(actualCenterAEntry.value)
      .withContext("child count of CenterA not correct")
      .toBe(2);
    const actualCenterBEntry = component.entityGroupCounts.filter(
      (e) => e.label === centerB.label
    )[0];
    expect(actualCenterBEntry.value)
      .withContext("child count of CenterB not correct")
      .toBe(1);
  });

  it("should groupBy enum values and display label", async () => {
    const testGroupBy = "test";
    component.groupBy = testGroupBy;

    const children = [new Child(), new Child(), new Child(), new Child()];
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

    component.entity = RecurringActivity.ENTITY_TYPE;
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
