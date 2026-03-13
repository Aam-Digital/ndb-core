import { ComponentFixture, TestBed } from "@angular/core/testing";
import { AdminPrimaryActionComponent } from "./admin-primary-action.component";
import { MockedTestingModule } from "../../../utils/mocked-testing.module";
import { ConfigService } from "../../config/config.service";
import { NEVER } from "rxjs";

describe("AdminPrimaryActionComponent", () => {
  let component: AdminPrimaryActionComponent;
  let fixture: ComponentFixture<AdminPrimaryActionComponent>;

  beforeEach(async () => {
    const configSpy = {
      getConfig: vi.fn().mockName("ConfigService.getConfig"),
      saveConfig: vi.fn().mockName("ConfigService.saveConfig"),
      exportConfig: vi.fn().mockName("ConfigService.exportConfig"),
      getAllConfigs: vi.fn().mockName("ConfigService.getAllConfigs"),
      configUpdates: NEVER,
    };

    // Mock the config data structure
    configSpy.getConfig.mockReturnValue({
      icon: "file-alt",
      actionType: "createEntity",
      entityType: "Note",
    });

    configSpy.exportConfig.mockReturnValue({
      primaryAction: {
        icon: "file-alt",
        actionType: "createEntity",
        entityType: "Note",
      },
    });

    configSpy.getAllConfigs.mockReturnValue([]);

    await TestBed.configureTestingModule({
      imports: [AdminPrimaryActionComponent, MockedTestingModule.withState()],
      providers: [{ provide: ConfigService, useValue: configSpy }],
    }).compileComponents();

    fixture = TestBed.createComponent(AdminPrimaryActionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
