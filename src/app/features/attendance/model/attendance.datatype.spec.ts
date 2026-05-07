import { TestBed } from "@angular/core/testing";
import { AttendanceDatatype } from "./attendance.datatype";
import { AttendanceItem } from "./attendance-item";
import { MockedTestingModule } from "#src/app/utils/mocked-testing.module";
import { defaultAttendanceStatusTypes } from "#src/app/core/config/default-config/default-attendance-status-types";
import { AttendanceLogicalStatus } from "./attendance-status";

describe("AttendanceDatatype", () => {
  let datatype: AttendanceDatatype;

  const present = defaultAttendanceStatusTypes.find(
    (s) => s.countAs === AttendanceLogicalStatus.PRESENT,
  );
  const absent = defaultAttendanceStatusTypes.find(
    (s) => s.countAs === AttendanceLogicalStatus.ABSENT,
  );

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [MockedTestingModule.withState()],
      providers: [AttendanceDatatype],
    });
    datatype = TestBed.inject(AttendanceDatatype);
  });

  it("sortValue returns 1 when all participants are present", () => {
    const items = [
      new AttendanceItem(present),
      new AttendanceItem(present),
      new AttendanceItem(present),
    ];
    expect(datatype.sortValue(items)).toBe(1);
  });

  it("sortValue returns 0.5 when half of participants are present", () => {
    const items = [new AttendanceItem(present), new AttendanceItem(absent)];
    expect(datatype.sortValue(items)).toBe(0.5);
  });

  it("sortValue returns 0 for empty array", () => {
    expect(datatype.sortValue([])).toBe(0);
  });

  it("sortValue returns 0 for undefined", () => {
    expect(datatype.sortValue(undefined)).toBe(0);
  });

  it("sortValue excludes IGNORE status items from percentage calculation", () => {
    const excused = defaultAttendanceStatusTypes.find(
      (s) => s.countAs === AttendanceLogicalStatus.IGNORE,
    );
    const items = [new AttendanceItem(present), new AttendanceItem(excused)];
    expect(datatype.sortValue(items)).toBe(1);
  });
});
