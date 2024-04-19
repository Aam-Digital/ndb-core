import { ComponentFixture, TestBed } from "@angular/core/testing";

import { SetupWizardButtonComponent } from "./setup-wizard-button.component";
import { EntityMapperService } from "../../../entity/entity-mapper/entity-mapper.service";
import { mockEntityMapper } from "../../../entity/entity-mapper/mock-entity-mapper-service";

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
});
