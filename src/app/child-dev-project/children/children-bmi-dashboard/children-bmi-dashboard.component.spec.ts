import {
  ComponentFixture,
  fakeAsync,
  TestBed,
  tick,
} from "@angular/core/testing";
import { RouterTestingModule } from "@angular/router/testing";
import { HealthCheck } from "../health-checkup/model/health-check";
import { of } from "rxjs";
import { ChildrenService } from "../children.service";
import { Child } from "../model/child";
import { ChildrenBmiDashboardComponent } from "./children-bmi-dashboard.component";
import { ChildrenModule } from "../children.module";
import { FontAwesomeTestingModule } from "@fortawesome/angular-fontawesome/testing";

describe("ChildrenBmiDashboardComponent", () => {
  let component: ChildrenBmiDashboardComponent;
  let fixture: ComponentFixture<ChildrenBmiDashboardComponent>;
  const mockChildrenService: jasmine.SpyObj<ChildrenService> = jasmine.createSpyObj(
    "mockChildrenService",
    ["getHealthChecksOfChild", "getChildren"]
  );

  beforeEach(() => {
    mockChildrenService.getChildren.and.returnValue(of([]));
    TestBed.configureTestingModule({
      imports: [
        ChildrenModule,
        RouterTestingModule.withRoutes([]),
        FontAwesomeTestingModule,
      ],
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

  it("should load the BMI data for the childs, but only display the unhealthy one", fakeAsync(() => {
    const testChild = new Child("testID");
    const healthCheck1 = HealthCheck.create({
      _id: "hc1",
      child: "testID",
      date: new Date("2020-10-30"),
      height: 130,
      weight: 60,
    });
    const healthCheck2 = HealthCheck.create({
      _id: "hc2",
      child: "testID",
      date: new Date("2020-11-30"),
      height: 150,
      weight: 15,
    });
    const testChild2 = new Child("testID2");
    const healthCheck3 = HealthCheck.create({
      _id: "hc3",
      child: "testID2",
      date: new Date("2020-09-30"),
      height: 115,
      weight: 30,
    });
    mockChildrenService.getChildren.and.returnValue(
      of([testChild, testChild2])
    );
    mockChildrenService.getHealthChecksOfChild.and.callFake(
      (childId: string) => {
        if (childId === "testID") {
          return of([healthCheck1, healthCheck2]);
        }
        if (childId === "testID2") {
          return of([healthCheck3]);
        }
      }
    );
    component.ngOnInit();
    expect(mockChildrenService.getChildren).toHaveBeenCalled();
    expect(mockChildrenService.getHealthChecksOfChild).toHaveBeenCalledWith(
      testChild.getId()
    );
    expect(mockChildrenService.getHealthChecksOfChild).toHaveBeenCalledWith(
      testChild2.getId()
    );
    tick();
    expect(component.bmiRows).toEqual([
      { childId: "testID", bmi: healthCheck2.bmi },
    ]);
  }));
});
