import {
  ComponentFixture,
  fakeAsync,
  flush,
  TestBed,
  waitForAsync,
} from "@angular/core/testing";

import { ChildrenCountDashboardComponent } from "./children-count-dashboard.component";
import { MatCardModule } from "@angular/material/card";
import { MatIconModule } from "@angular/material/icon";
import { ChildrenService } from "../children.service";
import { RouterTestingModule } from "@angular/router/testing";
import { Child } from "../model/child";
import { Observable } from "rxjs";
import { ConfigurableEnumValue } from "../../../core/configurable-enum/configurable-enum.interface";

describe("ChildrenCountDashboardComponent", () => {
  let component: ChildrenCountDashboardComponent;
  let fixture: ComponentFixture<ChildrenCountDashboardComponent>;

  let childrenService;
  let childrenObserver;

  let _lastId = 0;
  function createChild(center: string) {
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
        imports: [MatIconModule, MatCardModule, RouterTestingModule],
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
      createChild("CenterA"),
      createChild("CenterB"),
      createChild("CenterA"),
    ];
    childrenObserver.next(children);

    expect(component.totalChildren).toBe(3);
  });

  it("should calculate childrens per center correctly", fakeAsync(() => {
    const centerA = "CenterA";
    const centerB = "CenterB";
    const children = [
      createChild(centerA),
      createChild(centerB),
      createChild(centerA),
    ];

    childrenObserver.next(children);
    flush();

    expect(component.childrenGroupCounts.length).toBe(
      2,
      "unexpected number of centersWithProbability"
    );
    const actualCenterAEntry = component.childrenGroupCounts.filter(
      (e) => e.label === centerA
    )[0];
    expect(actualCenterAEntry.value).toBe(
      2,
      "child count of CenterA not correct"
    );
    const actualCenterBEntry = component.childrenGroupCounts.filter(
      (e) => e.label === centerB
    )[0];
    expect(actualCenterBEntry.value).toBe(
      1,
      "child count of CenterB not correct"
    );
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
