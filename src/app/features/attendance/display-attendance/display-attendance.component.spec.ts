import { ComponentFixture, TestBed } from "@angular/core/testing";
import { DisplayAttendanceComponent } from "./display-attendance.component";
import { AttendanceItem } from "../model/attendance-item";
import {
  AttendanceLogicalStatus,
  AttendanceStatusType,
} from "../model/attendance-status";

function makeStatus(
  countAs: AttendanceLogicalStatus,
  shortName = "",
): AttendanceStatusType {
  return { id: countAs, label: countAs, shortName, countAs };
}

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

  it("should calculate percentage from attendance items", () => {
    fixture.componentRef.setInput("value", [
      new AttendanceItem(makeStatus(AttendanceLogicalStatus.PRESENT, "P")),
      new AttendanceItem(makeStatus(AttendanceLogicalStatus.PRESENT, "P")),
      new AttendanceItem(makeStatus(AttendanceLogicalStatus.ABSENT, "A")),
      new AttendanceItem(makeStatus(AttendanceLogicalStatus.IGNORE, "E")),
    ]);

    // 2 present / (2 present + 1 absent) = 0.666...
    expect(component.percentage()).toBeCloseTo(2 / 3);
    expect(component.items().length).toBe(4);
  });

  it("should return undefined percentage when no present/absent items", () => {
    fixture.componentRef.setInput("value", [
      new AttendanceItem(makeStatus(AttendanceLogicalStatus.IGNORE, "E")),
    ]);

    expect(component.percentage()).toBeUndefined();
  });

  it("should compute warning class based on percentage", () => {
    fixture.componentRef.setInput("value", [
      new AttendanceItem(makeStatus(AttendanceLogicalStatus.PRESENT, "P")),
    ]);

    // 100% present → OK
    expect(component.warningClass()).toBe("w-OK");
  });

  it("should handle missing value gracefully", () => {
    fixture.componentRef.setInput("value", null);

    expect(component.percentage()).toBeUndefined();
  });

  it("should handle empty array gracefully", () => {
    fixture.componentRef.setInput("value", []);

    expect(component.percentage()).toBeUndefined();
  });
});
