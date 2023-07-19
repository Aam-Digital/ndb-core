import {
  ComponentFixture,
  fakeAsync,
  TestBed,
  tick,
} from "@angular/core/testing";
import { ChildrenBmiDashboardComponent } from "./children-bmi-dashboard.component";
import { HealthCheck } from "../../health-checkup/model/health-check";
import { MockedTestingModule } from "../../../../utils/mocked-testing.module";
import { EntityMapperService } from "../../../../core/entity/entity-mapper.service";

describe("ChildrenBmiDashboardComponent", () => {
  let component: ChildrenBmiDashboardComponent;
  let fixture: ComponentFixture<ChildrenBmiDashboardComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [ChildrenBmiDashboardComponent, MockedTestingModule.withState()],
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

  it("should load the BMI data for the children, but only display the unhealthy one", fakeAsync(() => {
    const healthCheck1 = HealthCheck.create({
      child: "testID",
      date: new Date("2020-10-30"),
      height: 130,
      weight: 60,
    });
    const healthCheck2 = HealthCheck.create({
      child: "testID",
      date: new Date("2020-11-30"),
      height: 150,
      weight: 15,
    });
    const healthCheck3 = HealthCheck.create({
      child: "testID2",
      date: new Date("2020-09-30"),
      height: 115,
      weight: 30,
    });
    const loadTypeSpy = spyOn(TestBed.inject(EntityMapperService), "loadType");
    loadTypeSpy.and.resolveTo([healthCheck1, healthCheck2, healthCheck3]);

    component.ngOnInit();

    expect(loadTypeSpy).toHaveBeenCalledWith(HealthCheck);
    tick();
    expect(component.bmiDataSource.data).toEqual([
      { childId: "testID", bmi: healthCheck2.bmi },
    ]);
  }));
});
