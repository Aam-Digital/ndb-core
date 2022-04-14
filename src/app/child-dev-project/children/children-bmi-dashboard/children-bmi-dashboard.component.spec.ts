import {
  ComponentFixture,
  fakeAsync,
  TestBed,
  tick,
} from "@angular/core/testing";
import { HealthCheck } from "../health-checkup/model/health-check";
import { ChildrenBmiDashboardComponent } from "./children-bmi-dashboard.component";
import { ChildrenModule } from "../children.module";
import { EntityMapperService } from "../../../core/entity/entity-mapper.service";
import { MockedTestingModule } from "../../../utils/mocked-testing.module";

describe("ChildrenBmiDashboardComponent", () => {
  let component: ChildrenBmiDashboardComponent;
  let fixture: ComponentFixture<ChildrenBmiDashboardComponent>;
  let mockEntityMapper: jasmine.SpyObj<EntityMapperService>;

  beforeEach(() => {
    mockEntityMapper = jasmine.createSpyObj("mockEntityMapper", ["loadType"]);
    mockEntityMapper.loadType.and.resolveTo([]);
    TestBed.configureTestingModule({
      imports: [ChildrenModule, MockedTestingModule.withState()],
      providers: [{ provide: EntityMapperService, useValue: mockEntityMapper }],
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
    const HealthCheck3 = new HealthCheck("hc3");
    HealthCheck3.child = "testID2";
    HealthCheck3.date = new Date("2020-09-30");
    HealthCheck3.height = 115;
    HealthCheck3.weight = 30;
    mockEntityMapper.loadType.and.resolveTo([
      HealthCheck1,
      HealthCheck2,
      HealthCheck3,
    ]);

    component.onInitFromDynamicConfig();

    expect(mockEntityMapper.loadType).toHaveBeenCalledWith(HealthCheck);
    tick();
    expect(component.bmiDataSource.data).toEqual([
      { childId: "testID", bmi: HealthCheck2.bmi },
    ]);
  }));
});
