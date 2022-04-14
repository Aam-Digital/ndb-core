import {
  ComponentFixture,
  fakeAsync,
  flush,
  TestBed,
  waitForAsync,
} from "@angular/core/testing";

import { ChildrenCountDashboardComponent } from "./children-count-dashboard.component";
import { MatCardModule } from "@angular/material/card";
import { ChildrenService } from "../children.service";
import { RouterTestingModule } from "@angular/router/testing";
import { Center, Child } from "../model/child";
import { Observable } from "rxjs";
import { ConfigurableEnumValue } from "../../../core/configurable-enum/configurable-enum.interface";
import { FontAwesomeTestingModule } from "@fortawesome/angular-fontawesome/testing";

describe("ChildrenCountDashboardComponent", () => {
  let component: ChildrenCountDashboardComponent;
  let fixture: ComponentFixture<ChildrenCountDashboardComponent>;

  let childrenService;
  let childrenObserver;

  let _lastId = 0;
  function createChild(center: Center) {
    _lastId++;
    const child = new Child(_lastId.toString());
    child.center = center;
    return child;
  }

  beforeEach(
    waitForAsync(() => {
      childrenService = jasmine.createSpyObj(["getChildren"]);
      childrenService.getChildren.and.returnValue(
        new Observable((observer) => {
          childrenObserver = observer;
        })
      );

      TestBed.configureTestingModule({
        declarations: [ChildrenCountDashboardComponent],
        imports: [MatCardModule, RouterTestingModule, FontAwesomeTestingModule],
        providers: [{ provide: ChildrenService, useValue: childrenService }],
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

  it("should calculate totalChildren correctly", () => {
    const children = [
      createChild({ id: "a", label: "CenterA" }),
      createChild({ id: "b", label: "CenterB" }),
      createChild({ id: "a", label: "CenterA" }),
    ];
    childrenObserver.next(children);

    expect(component.totalChildren).toBe(3);
  });

  it("should calculate childrens per center correctly", fakeAsync(() => {
    const centerA = { id: "a", label: "CenterA" };
    const centerB = { id: "b", label: "CenterB" };
    const children = [
      createChild(centerA),
      createChild(centerB),
      createChild(centerA),
    ];

    childrenObserver.next(children);
    flush();

    expect(component.childrenGroupCounts.length)
      .withContext("unexpected number of centersWithProbability")
      .toBe(2);
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
  }));

  it("should groupBy enum values and display label", fakeAsync(() => {
    const testGroupBy = "test";
    component.groupBy = testGroupBy;

    const children = [new Child(), new Child(), new Child(), new Child()];
    const c1: ConfigurableEnumValue = { label: "foo", id: "01" };
    const c2: ConfigurableEnumValue = { label: "bar", id: "02" };
    children[0][testGroupBy] = c1;
    children[1][testGroupBy] = c2;
    children[2][testGroupBy] = c1;

    childrenObserver.next(children);
    flush();

    expect(component.childrenGroupCounts.length).toBe(3);
    expect(component.childrenGroupCounts).toContain({
      label: c1.label,
      value: 2,
    });
    expect(component.childrenGroupCounts).toContain({
      label: c2.label,
      value: 1,
    });
  }));
});
