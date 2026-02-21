import { ComponentFixture, TestBed } from "@angular/core/testing";
import { DisplayAttendanceComponent } from "./display-attendance.component";
import { ActivityAttendance } from "../model/activity-attendance";
import { AttendanceLogicalStatus } from "../model/attendance-status";

describe("DisplayAttendanceComponent", () => {
  let component: DisplayAttendanceComponent;
  let fixture: ComponentFixture<DisplayAttendanceComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DisplayAttendanceComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(DisplayAttendanceComponent);
    component = fixture.componentInstance;
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });

  it("should calculate percentage for individual child", () => {
    const attendance = new ActivityAttendance();
    attendance.individualLogicalStatusCounts.set("child1", {
      [AttendanceLogicalStatus.PRESENT]: 8,
      [AttendanceLogicalStatus.ABSENT]: 2,
    });
    spyOn(attendance, "getAttendancePercentage").and.returnValue(0.8);

    component.value = attendance;
    component.config = { forChild: "child1" };
    component.ngOnInit();

    expect(component.percentage).toBe(0.8);
    expect(component.statusCounts[AttendanceLogicalStatus.PRESENT]).toBe(8);
    expect(component.statusCounts[AttendanceLogicalStatus.ABSENT]).toBe(2);
  });

  it("should calculate average percentage for all participants", () => {
    const attendance = new ActivityAttendance();
    spyOn(attendance, "getAttendancePercentageAverage").and.returnValue(0.75);
    spyOn(attendance, "countTotalPresent").and.returnValue(15);
    spyOn(attendance, "countTotalAbsent").and.returnValue(5);

    component.value = attendance;
    component.config = {};
    component.ngOnInit();

    expect(component.percentage).toBe(0.75);
    expect(component.statusCounts[AttendanceLogicalStatus.PRESENT]).toBe(15);
    expect(component.statusCounts[AttendanceLogicalStatus.ABSENT]).toBe(5);
  });

  it("should return color based on warning level", () => {
    const attendance = new ActivityAttendance();
    spyOn(attendance, "getColor").and.returnValue("#ff0000");

    component.value = attendance;
    component.config = { forChild: "child1" };

    expect(component.getBarColor()).toBe("#ff0000");
    expect(attendance.getColor).toHaveBeenCalledWith("child1");
  });

  it("should handle missing value gracefully", () => {
    component.value = null;
    component.ngOnInit();

    expect(component.percentage).toBeUndefined();
  });
});
