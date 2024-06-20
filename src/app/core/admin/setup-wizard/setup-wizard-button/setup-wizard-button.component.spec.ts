import {
  ComponentFixture,
  fakeAsync,
  TestBed,
  tick,
} from "@angular/core/testing";

import { SetupWizardButtonComponent } from "./setup-wizard-button.component";
import { EntityMapperService } from "../../../entity/entity-mapper/entity-mapper.service";
import { mockEntityMapper } from "../../../entity/entity-mapper/mock-entity-mapper-service";
import { SetupWizardConfig } from "../setup-wizard-config";
import { Config } from "../../../config/config";
import { Router } from "@angular/router";

describe("SetupWizardButtonComponent", () => {
  let component: SetupWizardButtonComponent;
  let fixture: ComponentFixture<SetupWizardButtonComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SetupWizardButtonComponent],
      providers: [
        { provide: EntityMapperService, useValue: mockEntityMapper() },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(SetupWizardButtonComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });

  it("should hide if SetupWizardConfig completed", fakeAsync(() => {
    const testWizardConfig: SetupWizardConfig = {
      steps: [],
      finished: true,
    };
    spyOn(TestBed.inject(EntityMapperService), "load").and.resolveTo(
      new Config("", testWizardConfig),
    );

    component.ngOnInit();
    tick();

    expect(component.showSetupWizard).toBeFalse();
  }));

  it("should auto navigate to setup wizard if configured openOnStart", fakeAsync(() => {
    const routerSpy = spyOn(TestBed.inject(Router), "navigate");
    const testWizardConfig: SetupWizardConfig = { steps: [] };
    spyOn(TestBed.inject(EntityMapperService), "load").and.resolveTo(
      new Config("", testWizardConfig),
    );

    // don't re-route if disabled in config
    testWizardConfig.openOnStart = false;
    component.ngOnInit();
    tick();
    expect(routerSpy).not.toHaveBeenCalled();

    // don't re-route if finished
    testWizardConfig.finished = true;
    testWizardConfig.openOnStart = true;
    component.ngOnInit();
    tick();
    expect(routerSpy).not.toHaveBeenCalled();

    // re-route automatically if configured
    testWizardConfig.openOnStart = true;
    testWizardConfig.finished = false;
    component.ngOnInit();
    tick();
    expect(routerSpy).toHaveBeenCalled();
  }));
});
