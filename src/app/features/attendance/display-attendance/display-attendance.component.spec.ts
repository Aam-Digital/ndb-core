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
    component.value = [
      new AttendanceItem(makeStatus(AttendanceLogicalStatus.PRESENT, "P")),
      new AttendanceItem(makeStatus(AttendanceLogicalStatus.PRESENT, "P")),
      new AttendanceItem(makeStatus(AttendanceLogicalStatus.ABSENT, "A")),
      new AttendanceItem(makeStatus(AttendanceLogicalStatus.IGNORE, "E")),
    ];
    component.ngOnInit();

    // 2 present / (2 present + 1 absent) = 0.666...
    expect(component.percentage).toBeCloseTo(2 / 3);
    expect(component.items.length).toBe(4);
  });

  it("should return undefined percentage when no present/absent items", () => {
    component.value = [
      new AttendanceItem(makeStatus(AttendanceLogicalStatus.IGNORE, "E")),
    ];
    component.ngOnInit();

    expect(component.percentage).toBeUndefined();
  });

  it("should compute warning class based on percentage", () => {
    component.value = [
      new AttendanceItem(makeStatus(AttendanceLogicalStatus.PRESENT, "P")),
    ];
    component.ngOnInit();

    // 100% present → OK
    expect(component.warningClass).toBe("w-OK");
  });

  it("should handle missing value gracefully", () => {
    component.value = null;
    component.ngOnInit();

    expect(component.percentage).toBeUndefined();
  });

  it("should handle empty array gracefully", () => {
    component.value = [];
    component.ngOnInit();

    expect(component.percentage).toBeUndefined();
  });
});
