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

    // @ts-ignore
    component.init();
    tick();

    expect(component.showSetupWizard).toBeFalse();
  }));
});
