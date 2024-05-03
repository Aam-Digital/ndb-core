import {
  ComponentFixture,
  fakeAsync,
  TestBed,
  tick,
} from "@angular/core/testing";

import { SetupWizardComponent } from "./setup-wizard.component";
import { EntityMapperService } from "../../entity/entity-mapper/entity-mapper.service";
import {
  mockEntityMapper,
  MockEntityMapperService,
} from "../../entity/entity-mapper/mock-entity-mapper-service";
import {
  CONFIG_SETUP_WIZARD_ID,
  defaultSetupWizardConfig,
  SetupWizardConfig,
} from "./setup-wizard-config";
import { Config } from "../../config/config";

describe("SetupWizardComponent", () => {
  let component: SetupWizardComponent;
  let fixture: ComponentFixture<SetupWizardComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SetupWizardComponent],
      providers: [
        { provide: EntityMapperService, useValue: mockEntityMapper() },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(SetupWizardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });

  it("should not save progress if no config was originally loaded", fakeAsync(() => {
    const entityMapperSpy = spyOn(TestBed.inject(EntityMapperService), "save");

    component.ngOnDestroy();
    tick();

    expect(entityMapperSpy).not.toHaveBeenCalled();
  }));

  it("should load config on init and save progress upon leaving component", fakeAsync(() => {
    const testConfig: SetupWizardConfig = JSON.parse(
      JSON.stringify(defaultSetupWizardConfig),
    );
    testConfig.currentStep = 2;

    const entityMapper: MockEntityMapperService = TestBed.inject(
      EntityMapperService,
    ) as MockEntityMapperService;
    entityMapper.add(new Config(CONFIG_SETUP_WIZARD_ID, testConfig));
    const entityMapperSaveSpy = spyOn(entityMapper, "save");

    component.ngOnInit();
    tick();
    expect(component.config).toEqual(testConfig);
    expect(component.config.currentStep).toBe(2);

    component.config.currentStep = 3;
    component.config.finished = true;
    component.ngOnDestroy();
    tick();

    expect(entityMapperSaveSpy).toHaveBeenCalled();
    const actualSavedConfig = entityMapperSaveSpy.calls.mostRecent()
      .args[0] as Config<SetupWizardConfig>;
    expect(actualSavedConfig.data.finished).toBe(true);
    expect(actualSavedConfig.data.currentStep).toBe(3);
  }));
});
