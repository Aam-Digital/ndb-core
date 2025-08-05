import { ComponentFixture, TestBed } from "@angular/core/testing";

import { BirthdayDashboardSettingsComponent } from "./birthday-dashboard-settings.component";
import { FormControl } from "@angular/forms";

describe("BirthdayDashboardSettingsComponent", () => {
  let component: BirthdayDashboardSettingsComponent;
  let fixture: ComponentFixture<BirthdayDashboardSettingsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BirthdayDashboardSettingsComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(BirthdayDashboardSettingsComponent);
    component = fixture.componentInstance;

    component.formControl = new FormControl({
      threshold: 32,
      entityType: "Child",
      birthdayProperty: "dateOfBirth",
    });

    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
