import { ActivityAttendance } from "./activity-attendance";
import {
  AttendanceLogicalStatus,
  AttendanceStatusType,
} from "./attendance-status";
import { defaultAttendanceStatusTypes } from "#src/app/core/config/default-config/default-attendance-status-types";
import { AttendanceItem } from "./attendance-item";
import { Entity } from "#src/app/core/entity/model/entity";

class TestEventEntity extends Entity {
  date: Date;
  attendance: AttendanceItem[] = [];

  getAttendance(participantId: string): AttendanceItem {
    let item = this.attendance.find((i) => i.participant === participantId);
    if (!item) {
      item = new AttendanceItem();
      item.participant = participantId;
      this.attendance.push(item);
    }
    return item;
  }
}

function generateTestEvent(
  participating: (
    | [string, AttendanceLogicalStatus]
    | [string, AttendanceLogicalStatus, string]
  )[],
  date = new Date(),
): TestEventEntity {
  const event = new TestEventEntity();
  event.date = date;
  for (const att of participating) {
    const item = event.getAttendance(att[0]);
    item.status = defaultAttendanceStatusTypes.find(
      (t) => t.countAs === att[1],
    );
    if (att.length === 3) {
      item.remarks = att[2];
    }
  }
  return event;
}

describe("ActivityAttendance", () => {
  let testInstance: ActivityAttendance;

  beforeEach(() => {
    testInstance = ActivityAttendance.create(
      new Date(),
      [
        generateTestEvent([
          ["1", AttendanceLogicalStatus.PRESENT],
          ["2", AttendanceLogicalStatus.PRESENT],
          ["3", AttendanceLogicalStatus.ABSENT],
        ]),
        generateTestEvent([
          ["1", AttendanceLogicalStatus.PRESENT],
          ["2", AttendanceLogicalStatus.ABSENT],
        ]),
      ],
      "attendance",
    );
  });

  it("calculates individual's absent events", () => {
    expect(testInstance.countEventsAbsent("1")).toBe(0);
    expect(testInstance.countEventsAbsent("2")).toBe(1);
    expect(testInstance.countEventsAbsent("3")).toBe(1);
  });

  it("calculates individual's present events", () => {
    expect(testInstance.countEventsPresent("1")).toBe(2);
    expect(testInstance.countEventsPresent("2")).toBe(1);
    expect(testInstance.countEventsPresent("3")).toBe(0);
  });

  it("calculates average absent", () => {
    const everyoneInOneEventAbsent = ActivityAttendance.create(
      new Date(),
      [
        generateTestEvent([
          ["1", AttendanceLogicalStatus.PRESENT],
          ["2", AttendanceLogicalStatus.ABSENT],
        ]),
        generateTestEvent([
          ["1", AttendanceLogicalStatus.ABSENT],
          ["2", AttendanceLogicalStatus.PRESENT],
        ]),
        generateTestEvent([
          ["1", AttendanceLogicalStatus.PRESENT],
          ["2", AttendanceLogicalStatus.PRESENT],
        ]),
      ],
      "attendance",
    );
    expect(everyoneInOneEventAbsent.countTotalAbsent()).toBe(2);

    const allAbsent = ActivityAttendance.create(
      new Date(),
      [
        generateTestEvent([
          ["1", AttendanceLogicalStatus.ABSENT],
          ["2", AttendanceLogicalStatus.ABSENT],
          ["3", AttendanceLogicalStatus.ABSENT],
        ]),
        generateTestEvent([
          ["1", AttendanceLogicalStatus.ABSENT],
          ["2", AttendanceLogicalStatus.ABSENT],
        ]),
      ],
      "attendance",
    );
    expect(allAbsent.countTotalAbsent()).toBe(5);
  });

  it("calculates average present", () => {
    const presentAct = ActivityAttendance.create(
      new Date(),
      [
        generateTestEvent([
          ["1", AttendanceLogicalStatus.PRESENT],
          ["2", AttendanceLogicalStatus.PRESENT],
        ]),
        generateTestEvent([
          ["1", AttendanceLogicalStatus.PRESENT],
          ["2", AttendanceLogicalStatus.PRESENT],
        ]),
        generateTestEvent([["1", AttendanceLogicalStatus.PRESENT]]),
      ],
      "attendance",
    );
    expect(presentAct.countTotalPresent()).toBe(5);

    const allAbsent = ActivityAttendance.create(
      new Date(),
      [
        generateTestEvent([
          ["1", AttendanceLogicalStatus.ABSENT],
          ["2", AttendanceLogicalStatus.ABSENT],
          ["3", AttendanceLogicalStatus.ABSENT],
        ]),
        generateTestEvent([
          ["1", AttendanceLogicalStatus.ABSENT],
          ["2", AttendanceLogicalStatus.ABSENT],
        ]),
      ],
      "attendance",
    );
    expect(allAbsent.countTotalPresent()).toBe(0);

    const halfAbsent = ActivityAttendance.create(
      new Date(),
      [
        generateTestEvent([
          ["1", AttendanceLogicalStatus.ABSENT],
          ["2", AttendanceLogicalStatus.PRESENT],
        ]),
        generateTestEvent([
          ["1", AttendanceLogicalStatus.PRESENT],
          ["2", AttendanceLogicalStatus.ABSENT],
          ["3", AttendanceLogicalStatus.IGNORE],
        ]),
      ],
      "attendance",
    );
    expect(halfAbsent.countTotalPresent()).toBe(2);
  });

  it("calculates logical stats on set of events", () => {
    const record = ActivityAttendance.create(
      new Date(),
      [
        generateTestEvent([
          ["1", AttendanceLogicalStatus.PRESENT],
          ["2", AttendanceLogicalStatus.ABSENT],
        ]),
        generateTestEvent([
          ["1", AttendanceLogicalStatus.ABSENT],
          ["2", AttendanceLogicalStatus.PRESENT],
        ]),
        generateTestEvent([
          ["1", AttendanceLogicalStatus.PRESENT],
          ["2", AttendanceLogicalStatus.IGNORE],
        ]),
      ],
      "attendance",
    );

    const logicalCount1 = record.individualLogicalStatusCounts.get("1");
    expect(logicalCount1[AttendanceLogicalStatus.ABSENT]).toBe(1);
    expect(logicalCount1[AttendanceLogicalStatus.PRESENT]).toBe(2);
    const logicalCount2 = record.individualLogicalStatusCounts.get("2");
    expect(logicalCount2[AttendanceLogicalStatus.ABSENT]).toBe(1);
    expect(logicalCount2[AttendanceLogicalStatus.PRESENT]).toBe(1);
    expect(logicalCount2[AttendanceLogicalStatus.IGNORE]).toBe(1);
  });

  it("calculates type stats on set of events", () => {
    const record = ActivityAttendance.create(
      new Date(),
      [
        generateTestEvent([
          ["1", AttendanceLogicalStatus.PRESENT],
          ["2", AttendanceLogicalStatus.ABSENT],
        ]),
        generateTestEvent([
          ["1", AttendanceLogicalStatus.ABSENT],
          ["2", AttendanceLogicalStatus.PRESENT],
        ]),
        generateTestEvent([
          ["1", AttendanceLogicalStatus.PRESENT],
          ["2", AttendanceLogicalStatus.IGNORE],
        ]),
      ],
      "attendance",
    );

    const StatusLate: AttendanceStatusType = defaultAttendanceStatusTypes.find(
      (t) => t.id === "LATE",
    );
    (record.events[0].entity as TestEventEntity).getAttendance("1").status =
      StatusLate;
    record.recalculateStats();

    const typeCount1 = record.individualStatusTypeCounts.get("1");
    expect(typeCount1[StatusLate.id]).toBe(1);
    expect(typeCount1["ABSENT"]).toBe(1);
    expect(typeCount1["PRESENT"]).toBe(1);
    expect(
      record.individualStatusTypeCounts.get("2")[StatusLate.id],
    ).toBeUndefined();
  });

  it("calculates events containing unknown/undefined attendance status", () => {
    const attendance = ActivityAttendance.create(
      new Date(),
      [
        generateTestEvent([
          ["1", AttendanceLogicalStatus.PRESENT],
          ["2", AttendanceLogicalStatus.IGNORE],
        ]),
        generateTestEvent([
          ["1", AttendanceLogicalStatus.PRESENT],
          ["2", AttendanceLogicalStatus.PRESENT],
        ]),
      ],
      "attendance",
    );

    // adding participants without attendance to one event
    attendance.events[1].attendanceItems.push(
      new AttendanceItem(undefined, "", "3"),
    );
    attendance.events[1].attendanceItems.push(
      new AttendanceItem(undefined, "", "4"),
    );

    expect(attendance.countEventsWithUnknownStatus()).toBe(1); // one unique event with undefined attendances
    expect(attendance.countEventsWithUnknownStatus("2")).toBe(0);
    expect(attendance.countEventsWithUnknownStatus("3")).toBe(1);
  });
});
