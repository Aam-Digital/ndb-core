import { ComponentFixture, TestBed } from "@angular/core/testing";

import { AttendanceSummaryComponent } from "./attendance-summary.component";
import { AttendanceModule } from "../attendance.module";

describe("AttendanceSummaryComponent", () => {
  let component: AttendanceSummaryComponent;
  let fixture: ComponentFixture<AttendanceSummaryComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AttendanceModule],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(AttendanceSummaryComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });

  it("should set/overwrite the from and to column", () => {
    component.columns = [
      { id: "periodFrom", label: "Month" },
      { id: "totalEvents", label: "Total" },
      { id: "attendancePercentage", label: "Attendance" },
    ];

    expect(component._columns).toEqual([
      jasmine.objectContaining({ id: "periodFrom" }),
      jasmine.objectContaining({ id: "periodTo" }),
      { id: "totalEvents", label: "Total" },
      { id: "attendancePercentage", label: "Attendance" },
    ]);
    expect(component._columns).not.toContain({
      id: "periodFrom",
      label: "Month",
    });
  });
});
