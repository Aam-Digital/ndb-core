import { ComponentFixture, TestBed } from "@angular/core/testing";
import { signal } from "@angular/core";

import { SetupWizardComponent } from "./setup-wizard.component";
import { EntityMapperService } from "../../entity/entity-mapper/entity-mapper.service";
import { SetupWizardService, SetupWizardState } from "./setup-wizard.service";
import {
  CONFIG_SETUP_WIZARD_ID,
  SetupWizardConfig,
} from "./setup-wizard-config";
import { Config } from "../../config/config";
import {
  entityRegistry,
  EntityRegistry,
} from "app/core/entity/database-entity.decorator";
import { FontAwesomeTestingModule } from "@fortawesome/angular-fontawesome/testing";
import { MarkdownModule } from "ngx-markdown";
import { RouterTestingModule } from "@angular/router/testing";

describe("SetupWizardComponent", () => {
  let component: SetupWizardComponent;
  let fixture: ComponentFixture<SetupWizardComponent>;

  const testConfig: SetupWizardConfig = {
    openOnStart: true,
    steps: [
      {
        title: "Welcome",
        text: "# Welcome to Aam Digital!\nWe are here ...",
      },
      {
        title: "Import Data",
        text: "...",
        actions: [{ label: "Import Data", link: "/import" }],
      },
    ],
  };

  let setupWizardService: {
    state: any;
    config: any;
  };

  beforeEach(async () => {
    setupWizardService = {
      state: signal<SetupWizardState>("loaded"),
      config: signal(new Config(CONFIG_SETUP_WIZARD_ID, { ...testConfig })),
    };

    await TestBed.configureTestingModule({
      imports: [
        SetupWizardComponent,
        FontAwesomeTestingModule,
        MarkdownModule.forRoot(),
        RouterTestingModule,
      ],
      providers: [
        {
          provide: EntityMapperService,
          useValue: { load: vi.fn(), save: vi.fn() },
        },
        { provide: SetupWizardService, useValue: setupWizardService },
        { provide: EntityRegistry, useValue: { entityRegistry } },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(SetupWizardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => {
    localStorage.removeItem(component.LOCAL_STORAGE_KEY);
  });

  it("should mark the config as finished in the last step", async () => {
    const entityMapper = TestBed.inject(EntityMapperService) as any;

    await component.finishWizard();

    const actualSavedConfig = vi.mocked(entityMapper.save).mock
      .lastCall[0] as Config<SetupWizardConfig>;
    expect(actualSavedConfig.data.finished).toBe(true);
  });

  it("should not attempt to save anything if no config is available", async () => {
    const entityMapper = TestBed.inject(EntityMapperService) as any;
    setupWizardService.config.set(undefined);

    await component.finishWizard();

    expect(entityMapper.save).not.toHaveBeenCalled();
  });

  it("should show a loading indicator while the config is not available yet", () => {
    setupWizardService.state.set("loading");
    fixture.detectChanges();

    expect(
      fixture.nativeElement.querySelector('[role="progressbar"]'),
    ).toBeTruthy();
  });

  it.each([
    ["error", "could not be loaded"],
    ["unavailable", "No setup wizard is configured"],
  ])(
    "should explain the %s state instead of showing an empty wizard",
    (state, expectedText) => {
      setupWizardService.state.set(state);
      setupWizardService.config.set(undefined);
      fixture.detectChanges();

      expect(fixture.nativeElement.textContent).toContain(expectedText);
    },
  );

  it("should load local progress/status on init and save to local storage", async () => {
    vi.useFakeTimers();
    try {
      const testStatus = { currentStep: 2, completedSteps: [0, 2] };
      localStorage.setItem(
        component.LOCAL_STORAGE_KEY,
        JSON.stringify(testStatus),
      );

      component.ngOnInit();
      await vi.advanceTimersByTimeAsync(0);
      expect(component.currentStep).toEqual(testStatus.currentStep);
      expect(component.completedSteps).toEqual(testStatus.completedSteps);

      component.onNextStep(3);
      expect(component.currentStep).toBe(3);
      expect(component.completedSteps.includes(3)).toBe(true);
      await vi.advanceTimersByTimeAsync(0);

      const storedStatus = JSON.parse(
        localStorage.getItem(component.LOCAL_STORAGE_KEY),
      );
      expect(storedStatus).toEqual({
        currentStep: 3,
        completedSteps: [0, 2, 3],
      });
    } finally {
      vi.useRealTimers();
    }
  });
});
