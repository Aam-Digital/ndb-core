import {
  ComponentFixture,
  fakeAsync,
  TestBed,
  tick,
} from "@angular/core/testing";

import { SetupWizardComponent } from "./setup-wizard.component";
import { EntityMapperService } from "../../entity/entity-mapper/entity-mapper.service";
import {
  CONFIG_SETUP_WIZARD_ID,
  SetupWizardConfig,
} from "./setup-wizard-config";
import { Config } from "../../config/config";
import {
  entityRegistry,
  EntityRegistry,
} from "app/core/entity/database-entity.decorator";

describe("SetupWizardComponent", () => {
  let component: SetupWizardComponent;
  let fixture: ComponentFixture<SetupWizardComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SetupWizardComponent],
      providers: [
        {
          provide: EntityMapperService,
          useValue: jasmine.createSpyObj(["load", "save"]),
        },
        {
          provide: EntityRegistry,
          useValue: { entityRegistry },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(SetupWizardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => {
    localStorage.removeItem(component.LOCAL_STORAGE_KEY);
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });

  it("should load config on init and save if finished in last step", fakeAsync(() => {
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
          actions: [
            {
              label: "Import Data",
              link: "/import",
            },
          ],
        },
      ],
    };

    const entityMapper = TestBed.inject(
      EntityMapperService,
    ) as jasmine.SpyObj<EntityMapperService>;
    entityMapper.load.and.resolveTo(
      new Config(CONFIG_SETUP_WIZARD_ID, testConfig),
    );

    component.ngOnInit();
    tick();
    expect(component.steps).toEqual(testConfig.steps);

    component.finishWizard();
    tick();

    expect(entityMapper.save).toHaveBeenCalled();
    const actualSavedConfig = entityMapper.save.calls.mostRecent()
      .args[0] as Config<SetupWizardConfig>;
    expect(actualSavedConfig.data.finished).toBe(true);
  }));

  it("should load local progress/status on init and save to local storage", fakeAsync(() => {
    const testStatus: { currentStep: number; completedSteps: number[] } = {
      currentStep: 2,
      completedSteps: [0, 2],
    };
    localStorage.setItem(
      component.LOCAL_STORAGE_KEY,
      JSON.stringify(testStatus),
    );

    component.ngOnInit();
    tick();
    expect(component.currentStep).toEqual(testStatus.currentStep);
    expect(component.completedSteps).toEqual(testStatus.completedSteps);

    component.onNextStep(3);
    expect(component.currentStep).toBe(3);
    expect(component.completedSteps.includes(3)).toBeTrue();
    tick();

    const storedStatus = JSON.parse(
      localStorage.getItem(component.LOCAL_STORAGE_KEY),
    );
    expect(storedStatus).toEqual({ currentStep: 3, completedSteps: [0, 2, 3] });
  }));
});
