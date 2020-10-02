import { ComponentFixture, TestBed } from "@angular/core/testing";
import { DashboardComponent } from "./dashboard.component";
import { ConfigService } from "app/core/config/config.service";

describe("DashboardComponent", () => {
  let component: DashboardComponent;
  let fixture: ComponentFixture<DashboardComponent>;

  let mockConfigService: jasmine.SpyObj<ConfigService>;

  beforeEach(() => {
    mockConfigService = jasmine.createSpyObj(["getConfig"]);
    mockConfigService.getConfig.and.returnValue({ widgets: [] });

    TestBed.configureTestingModule({
      declarations: [DashboardComponent],
      imports: [],
      providers: [{ provide: ConfigService, useValue: mockConfigService }],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(DashboardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
