import { TestBed } from "@angular/core/testing";
import { AttendanceMonthConflictResolutionStrategy } from "./attendance-month-conflict-resolution-strategy";
import { AttendanceMonth } from "./model/attendance-month";
import { AttendanceDay, AttendanceStatus } from "./model/attendance-day";

describe("AutoResolutionService", () => {
  let service: AttendanceMonthConflictResolutionStrategy;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [AttendanceMonthConflictResolutionStrategy],
    });
    service = TestBed.get(AttendanceMonthConflictResolutionStrategy);
  });

  it("should be created", () => {
    expect(service).toBeTruthy();
  });

  it("should suggest deleting irrelevant/trivial conflict", () => {
    const currentDoc = new AttendanceMonth("test1");
    currentDoc.month = new Date(2019, 0);
    currentDoc.dailyRegister[0] = new AttendanceDay(
      new Date(2019, 0, 1),
      AttendanceStatus.ABSENT
    );

    const conflictingDoc = new AttendanceMonth("test1");
    conflictingDoc.month = new Date(2019, 0);
    // no dailyRegister entries set

    const result = service.autoDeleteConflictingRevision(
      currentDoc,
      conflictingDoc
    );
    expect(result).toBe(true);
  });

  it("should not suggest deleting complex attendance diff conflicts", () => {
    const currentDoc = new AttendanceMonth("test1");
    currentDoc.month = new Date(2019, 0);
    currentDoc.dailyRegister[0] = new AttendanceDay(
      new Date(2019, 0, 1),
      AttendanceStatus.ABSENT
    );

    const conflictingDoc = new AttendanceMonth("test1");
    conflictingDoc.month = new Date(2019, 0);
    conflictingDoc.dailyRegister[1] = new AttendanceDay(
      new Date(2019, 0, 1),
      AttendanceStatus.EXCUSED
    );

    const result = service.autoDeleteConflictingRevision(
      currentDoc,
      conflictingDoc
    );
    expect(result).toBe(false);
  });
});
