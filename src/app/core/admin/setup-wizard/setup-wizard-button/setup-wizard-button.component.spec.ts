import { ComponentFixture, TestBed } from "@angular/core/testing";

import { SetupWizardButtonComponent } from "./setup-wizard-button.component";
import { EntityMapperService } from "../../../entity/entity-mapper/entity-mapper.service";
import { mockEntityMapperProvider } from "../../../entity/entity-mapper/mock-entity-mapper-service";
import { SetupWizardConfig } from "../setup-wizard-config";
import { Config } from "../../../config/config";
import { Router } from "@angular/router";
import {
  entityRegistry,
  EntityRegistry,
} from "app/core/entity/database-entity.decorator";

describe("SetupWizardButtonComponent", () => {
  let component: SetupWizardButtonComponent;
  let fixture: ComponentFixture<SetupWizardButtonComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SetupWizardButtonComponent],
      providers: [
        ...mockEntityMapperProvider(),
        {
          provide: EntityRegistry,
          useValue: { entityRegistry },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(SetupWizardButtonComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });

  it("should hide if SetupWizardConfig completed", async () => {
    vi.useFakeTimers();
    try {
      const testWizardConfig: SetupWizardConfig = {
        steps: [],
        finished: true,
      };
      vi.spyOn(TestBed.inject(EntityMapperService), "load").mockResolvedValue(
        new Config("", testWizardConfig),
      );

      component.ngOnInit();
      await vi.advanceTimersByTimeAsync(0);

      expect(component.showSetupWizard).toBe(false);
    } finally {
      vi.useRealTimers();
    }
  });

  it("should auto navigate to setup wizard if configured openOnStart", async () => {
    vi.useFakeTimers();
    try {
      const routerSpy = vi.spyOn(TestBed.inject(Router), "navigate");
      const testWizardConfig: SetupWizardConfig = { steps: [] };
      vi.spyOn(TestBed.inject(EntityMapperService), "load").mockResolvedValue(
        new Config("", testWizardConfig),
      );

      // don't re-route if disabled in config
      testWizardConfig.openOnStart = false;
      component.ngOnInit();
      await vi.advanceTimersByTimeAsync(0);
      expect(routerSpy).not.toHaveBeenCalled();

      // don't re-route if finished
      testWizardConfig.finished = true;
      testWizardConfig.openOnStart = true;
      component.ngOnInit();
      await vi.advanceTimersByTimeAsync(0);
      expect(routerSpy).not.toHaveBeenCalled();

      // re-route automatically if configured
      testWizardConfig.openOnStart = true;
      testWizardConfig.finished = false;
      component.ngOnInit();
      await vi.advanceTimersByTimeAsync(0);
      expect(routerSpy).toHaveBeenCalled();
    } finally {
      vi.useRealTimers();
    }
  });
});
