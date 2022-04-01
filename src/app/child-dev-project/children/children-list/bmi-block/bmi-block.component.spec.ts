import {
  ComponentFixture,
  fakeAsync,
  TestBed,
  tick,
  waitForAsync,
} from "@angular/core/testing";
import { HealthCheck } from "../../health-checkup/model/health-check";
import { of } from "rxjs";
import { ChildrenService } from "../../children.service";
import { Child } from "../../model/child";

import { BmiBlockComponent } from "./bmi-block.component";

describe("BmiBlockComponent", () => {
  let component: BmiBlockComponent;
  let fixture: ComponentFixture<BmiBlockComponent>;
  const mockChildrenService: jasmine.SpyObj<ChildrenService> = jasmine.createSpyObj(
    "mockChildrenService",
    ["getHealthChecksOfChild"]
  );

  beforeEach(
    waitForAsync(() => {
      TestBed.configureTestingModule({
        declarations: [BmiBlockComponent],
        providers: [
          { provide: ChildrenService, useValue: mockChildrenService },
        ],
      }).compileComponents();
    })
  );

  beforeEach(() => {
    fixture = TestBed.createComponent(BmiBlockComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });

  it("should load the BMI data for the child", fakeAsync(() => {
    const testChild = new Child("testID");
    const healthCheck1 = HealthCheck.create({
      id: "hc1",
      date: new Date("2020-10-30"),
      height: 1.3,
      weight: 60,
    });
    const healthCheck2 = HealthCheck.create({
      id: "hc2",
      date: new Date("2020-11-30"),
      height: 1.5,
      weight: 77,
    });
    const healthCheck3 = HealthCheck.create({
      id: "hc3",
      date: new Date("2020-09-30"),
      height: 1.15,
      weight: 50,
    });
    mockChildrenService.getHealthChecksOfChild.and.returnValue(
      of([healthCheck1, healthCheck2, healthCheck3])
    );
    component.onInitFromDynamicConfig({
      entity: testChild,
      id: "",
    });
    expect(mockChildrenService.getHealthChecksOfChild).toHaveBeenCalledWith(
      testChild.getId()
    );
    tick();
    expect(component.currentHealthCheck).toEqual(healthCheck2);
  }));
});
