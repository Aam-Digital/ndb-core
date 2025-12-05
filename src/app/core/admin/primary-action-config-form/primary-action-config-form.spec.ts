import { ComponentFixture, TestBed } from "@angular/core/testing";
import { PrimaryActionConfigFormComponent } from "./primary-action-config-form.component";
import { MockedTestingModule } from "../../../utils/mocked-testing.module";
import { ConfigService } from "../../config/config.service";

describe("PrimaryActionConfigFormComponent", () => {
  let component: PrimaryActionConfigFormComponent;
  let fixture: ComponentFixture<PrimaryActionConfigFormComponent>;

  beforeEach(async () => {
    const configSpy = jasmine.createSpyObj(
      "ConfigService",
      ["getConfig", "saveConfig", "exportConfig", "getAllConfigs"],
      {
        configUpdates: { subscribe: jasmine.createSpy() },
      },
    );

    // Mock the config data structure
    configSpy.getConfig.and.returnValue({
      icon: "file-alt",
      actionType: "createEntity",
      entityType: "Note",
    });

    configSpy.exportConfig.and.returnValue({
      primaryAction: {
        icon: "file-alt",
        actionType: "createEntity",
        entityType: "Note",
      },
    });

    configSpy.getAllConfigs.and.returnValue([]);

    await TestBed.configureTestingModule({
      imports: [
        PrimaryActionConfigFormComponent,
        MockedTestingModule.withState(),
      ],
      providers: [{ provide: ConfigService, useValue: configSpy }],
    }).compileComponents();

    fixture = TestBed.createComponent(PrimaryActionConfigFormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
