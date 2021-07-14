import { ComponentFixture, TestBed } from "@angular/core/testing";
import { RouterTestingModule } from "@angular/router/testing";
import { HealthCheck } from "app/child-dev-project/health-checkup/model/health-check";
import { of } from "rxjs";
import { ChildrenService } from "../children.service";
import { Child } from "../model/child";
import { ChildrenBmiDashboardComponent } from "./children-bmi-dashboard.component";
import { ChildrenModule } from "../children.module";

describe("ChildrenBmiDashboardComponent", () => {
  let component: ChildrenBmiDashboardComponent;
  let fixture: ComponentFixture<ChildrenBmiDashboardComponent>;
  const mockChildrenService: jasmine.SpyObj<ChildrenService> =
    jasmine.createSpyObj("mockChildrenService", [
      "getHealthChecksOfChild",
      "getChildren",
    ]);

  beforeEach(() => {
    mockChildrenService.getChildren.and.returnValue(of([]));
    TestBed.configureTestingModule({
      imports: [ChildrenModule, RouterTestingModule.withRoutes([])],
      providers: [{ provide: ChildrenService, useValue: mockChildrenService }],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ChildrenBmiDashboardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });

  it("should load the BMI data for the childs, but only display the unhealthy one", (done) => {
    const testChild = new Child("testID");
    const HealthCheck1 = new HealthCheck("hc1");
    HealthCheck1.child = "testID";
    HealthCheck1.date = new Date("2020-10-30");
    HealthCheck1.height = 130;
    HealthCheck1.weight = 60;
    const HealthCheck2 = new HealthCheck("hc2");
    HealthCheck2.child = "testID";
    HealthCheck2.date = new Date("2020-11-30");
    HealthCheck2.height = 150;
    HealthCheck2.weight = 15;
    const testChild2 = new Child("testID2");
    const HealthCheck3 = new HealthCheck("hc3");
    HealthCheck3.child = "testID2";
    HealthCheck3.date = new Date("2020-09-30");
    HealthCheck3.height = 115;
    HealthCheck3.weight = 30;
    mockChildrenService.getChildren.and.returnValue(
      of([testChild, testChild2])
    );
    mockChildrenService.getHealthChecksOfChild.and.callFake(function (
      childId: string
    ) {
      if (childId === "testID") {
        return of([HealthCheck1, HealthCheck2]);
      }
      if (childId === "testID2") {
        return of([HealthCheck3]);
      }
    });
    component.ngOnInit();
    expect(mockChildrenService.getChildren).toHaveBeenCalled();
    expect(mockChildrenService.getHealthChecksOfChild).toHaveBeenCalledWith(
      testChild.getId()
    );
    expect(mockChildrenService.getHealthChecksOfChild).toHaveBeenCalledWith(
      testChild2.getId()
    );
    setTimeout(() => {
      expect(component.bmiRows).toEqual([
        { childId: "testID", bmi: HealthCheck2.bmi },
      ]);
      done();
    });
  });
});
