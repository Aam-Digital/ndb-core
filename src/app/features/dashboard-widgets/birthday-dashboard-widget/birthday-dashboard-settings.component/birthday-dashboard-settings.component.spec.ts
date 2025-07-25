import { ComponentFixture, TestBed } from "@angular/core/testing";

import { BirthdayDashboardSettingsComponent } from "./birthday-dashboard-settings.component";

describe("BirthdayDashboardSettingsComponent", () => {
  let component: BirthdayDashboardSettingsComponent;
  let fixture: ComponentFixture<BirthdayDashboardSettingsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BirthdayDashboardSettingsComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(BirthdayDashboardSettingsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
