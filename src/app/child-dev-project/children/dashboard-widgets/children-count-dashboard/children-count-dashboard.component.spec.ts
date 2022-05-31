import { ComponentFixture, TestBed, waitForAsync } from "@angular/core/testing";

import { ChildrenCountDashboardComponent } from "./children-count-dashboard.component";
import { Center, Child } from "../../model/child";
import { ConfigurableEnumValue } from "../../../../core/configurable-enum/configurable-enum.interface";
import { FontAwesomeTestingModule } from "@fortawesome/angular-fontawesome/testing";
import { EntityMapperService } from "../../../../core/entity/entity-mapper.service";
import {
  mockEntityMapper,
  MockEntityMapperService,
} from "../../../../core/entity/mock-entity-mapper-service";
import { ChildrenModule } from "../../children.module";
import { MockedTestingModule } from "../../../../utils/mocked-testing.module";

describe("ChildrenCountDashboardComponent", () => {
  let component: ChildrenCountDashboardComponent;
  let fixture: ComponentFixture<ChildrenCountDashboardComponent>;
  let entityMapper: MockEntityMapperService;

  function createChild(center: Center) {
    const child = new Child();
    child.center = center;
    return child;
  }

  beforeEach(
    waitForAsync(() => {
      entityMapper = mockEntityMapper();
      TestBed.configureTestingModule({
        imports: [
          ChildrenModule,
          MockedTestingModule.withState(),
          FontAwesomeTestingModule,
        ],
        providers: [{ provide: EntityMapperService, useValue: entityMapper }],
      }).compileComponents();
    })
  );

  beforeEach(() => {
    fixture = TestBed.createComponent(ChildrenCountDashboardComponent);
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

    expect(component.totalChildren).toBe(3);
  });

  it("should calculate children per center correctly", async () => {
    const centerA = { id: "a", label: "CenterA" };
    const centerB = { id: "b", label: "CenterB" };
    entityMapper.add(createChild(centerA));
    entityMapper.add(createChild(centerB));
    entityMapper.add(createChild(centerA));

    await component.ngOnInit();

    expect(component.childrenGroupCounts)
      .withContext("unexpected number of centersWithProbability")
      .toHaveSize(2);
    const actualCenterAEntry = component.childrenGroupCounts.filter(
      (e) => e.label === centerA.label
    )[0];
    expect(actualCenterAEntry.value)
      .withContext("child count of CenterA not correct")
      .toBe(2);
    const actualCenterBEntry = component.childrenGroupCounts.filter(
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

    expect(component.childrenGroupCounts).toHaveSize(3);
    expect(component.childrenGroupCounts).toContain({
      label: c1.label,
      value: 2,
      id: c1.id,
    });
    expect(component.childrenGroupCounts).toContain({
      label: c2.label,
      value: 1,
      id: c2.id,
    });
  });
});
