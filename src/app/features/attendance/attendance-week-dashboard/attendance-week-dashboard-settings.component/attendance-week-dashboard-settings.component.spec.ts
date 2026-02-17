import { ComponentFixture, TestBed } from "@angular/core/testing";

import { AttendanceWeekDashboardSettingsComponent } from "./attendance-week-dashboard-settings.component";
import { FormControl } from "@angular/forms";

describe("AttendanceWeekDashboardSettingsComponent", () => {
  let component: AttendanceWeekDashboardSettingsComponent;
  let fixture: ComponentFixture<AttendanceWeekDashboardSettingsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AttendanceWeekDashboardSettingsComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(AttendanceWeekDashboardSettingsComponent);
    component = fixture.componentInstance;

    component.formControl = new FormControl({
      daysOffset: 0,
      periodLabel: "",
      label: "",
      attendanceStatusType: "",
    });

    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
