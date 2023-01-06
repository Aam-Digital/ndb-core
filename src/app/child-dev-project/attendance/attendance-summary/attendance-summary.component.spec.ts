import { ComponentFixture, TestBed } from "@angular/core/testing";

import { AttendanceSummaryComponent } from "./attendance-summary.component";
import { MockedTestingModule } from "../../../utils/mocked-testing.module";

describe("AttendanceSummaryComponent", () => {
  let component: AttendanceSummaryComponent;
  let fixture: ComponentFixture<AttendanceSummaryComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AttendanceSummaryComponent, MockedTestingModule.withState()],
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

  it("should remove the from and to column", () => {
    component.columns = [
      { id: "periodFrom", label: "Month" },
      { id: "totalEvents", label: "Total" },
      { id: "attendancePercentage", label: "Attendance" },
    ];

    expect(component._columns).toEqual([
      { id: "attendancePercentage", label: "Attendance" },
      { id: "totalEvents", label: "Total" },
    ]);
    expect(component._columns).not.toContain({
      id: "periodFrom",
      label: "Month",
    });
  });
});
