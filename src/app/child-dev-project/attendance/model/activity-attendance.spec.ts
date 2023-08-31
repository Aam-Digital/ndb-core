/*
 *     This file is part of ndb-core.
 *
 *     ndb-core is free software: you can redistribute it and/or modify
 *     it under the terms of the GNU General Public License as published by
 *     the Free Software Foundation, either version 3 of the License, or
 *     (at your option) any later version.
 *
 *     ndb-core is distributed in the hope that it will be useful,
 *     but WITHOUT ANY WARRANTY; without even the implied warranty of
 *     MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 *     GNU General Public License for more details.
 *
 *     You should have received a copy of the GNU General Public License
 *     along with ndb-core.  If not, see <http://www.gnu.org/licenses/>.
 */

import {
  ActivityAttendance,
  generateEventWithAttendance,
} from "./activity-attendance";
import {
  AttendanceLogicalStatus,
  AttendanceStatusType,
} from "./attendance-status";
import { defaultAttendanceStatusTypes } from "../../../core/config/default-config/default-attendance-status-types";

describe("ActivityAttendance", () => {
  let testInstance: ActivityAttendance;

  beforeEach(() => {
    testInstance = ActivityAttendance.create(new Date(), [
      generateEventWithAttendance([
        ["1", AttendanceLogicalStatus.PRESENT],
        ["2", AttendanceLogicalStatus.PRESENT],
        ["3", AttendanceLogicalStatus.ABSENT],
      ]),
      generateEventWithAttendance([
        ["1", AttendanceLogicalStatus.PRESENT],
        ["2", AttendanceLogicalStatus.ABSENT],
      ]),
    ]);
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
    const everyoneInOneEventAbsent = ActivityAttendance.create(new Date(), [
      generateEventWithAttendance([
        ["1", AttendanceLogicalStatus.PRESENT],
        ["2", AttendanceLogicalStatus.ABSENT],
      ]),
      generateEventWithAttendance([
        ["1", AttendanceLogicalStatus.ABSENT],
        ["2", AttendanceLogicalStatus.PRESENT],
      ]),
      generateEventWithAttendance([
        ["1", AttendanceLogicalStatus.PRESENT],
        ["2", AttendanceLogicalStatus.PRESENT],
      ]),
    ]);
    expect(everyoneInOneEventAbsent.countTotalAbsent()).toBe(2);

    const allAbsent = ActivityAttendance.create(new Date(), [
      generateEventWithAttendance([
        ["1", AttendanceLogicalStatus.ABSENT],
        ["2", AttendanceLogicalStatus.ABSENT],
        ["3", AttendanceLogicalStatus.ABSENT],
      ]),
      generateEventWithAttendance([
        ["1", AttendanceLogicalStatus.ABSENT],
        ["2", AttendanceLogicalStatus.ABSENT],
      ]),
    ]);
    expect(allAbsent.countTotalAbsent()).toBe(5);
  });

  it("calculates average present", () => {
    const presentAct = ActivityAttendance.create(new Date(), [
      generateEventWithAttendance([
        ["1", AttendanceLogicalStatus.PRESENT],
        ["2", AttendanceLogicalStatus.PRESENT],
      ]),
      generateEventWithAttendance([
        ["1", AttendanceLogicalStatus.PRESENT],
        ["2", AttendanceLogicalStatus.PRESENT],
      ]),
      generateEventWithAttendance([["1", AttendanceLogicalStatus.PRESENT]]),
    ]);
    expect(presentAct.countTotalPresent()).toBe(5);

    const allAbsent = ActivityAttendance.create(new Date(), [
      generateEventWithAttendance([
        ["1", AttendanceLogicalStatus.ABSENT],
        ["2", AttendanceLogicalStatus.ABSENT],
        ["3", AttendanceLogicalStatus.ABSENT],
      ]),
      generateEventWithAttendance([
        ["1", AttendanceLogicalStatus.ABSENT],
        ["2", AttendanceLogicalStatus.ABSENT],
      ]),
    ]);
    expect(allAbsent.countTotalPresent()).toBe(0);

    const halfAbsent = ActivityAttendance.create(new Date(), [
      generateEventWithAttendance([
        ["1", AttendanceLogicalStatus.ABSENT],
        ["2", AttendanceLogicalStatus.PRESENT],
      ]),
      generateEventWithAttendance([
        ["1", AttendanceLogicalStatus.PRESENT],
        ["2", AttendanceLogicalStatus.ABSENT],
        ["3", AttendanceLogicalStatus.IGNORE],
      ]),
    ]);
    expect(halfAbsent.countTotalPresent()).toBe(2);
  });

  it("calculates logical stats on set of events", () => {
    const record = ActivityAttendance.create(new Date(), [
      generateEventWithAttendance([
        ["1", AttendanceLogicalStatus.PRESENT],
        ["2", AttendanceLogicalStatus.ABSENT],
      ]),
      generateEventWithAttendance([
        ["1", AttendanceLogicalStatus.ABSENT],
        ["2", AttendanceLogicalStatus.PRESENT],
      ]),
      generateEventWithAttendance([
        ["1", AttendanceLogicalStatus.PRESENT],
        ["2", AttendanceLogicalStatus.IGNORE],
      ]),
    ]);

    const logicalCount1 = record.individualLogicalStatusCounts.get("1");
    expect(logicalCount1[AttendanceLogicalStatus.ABSENT]).toBe(1);
    expect(logicalCount1[AttendanceLogicalStatus.PRESENT]).toBe(2);
    const logicalCount2 = record.individualLogicalStatusCounts.get("2");
    expect(logicalCount2[AttendanceLogicalStatus.ABSENT]).toBe(1);
    expect(logicalCount2[AttendanceLogicalStatus.PRESENT]).toBe(1);
    expect(logicalCount2[AttendanceLogicalStatus.IGNORE]).toBe(1);
  });

  it("calculates type stats on set of events", () => {
    const record = ActivityAttendance.create(new Date(), [
      generateEventWithAttendance([
        ["1", AttendanceLogicalStatus.PRESENT],
        ["2", AttendanceLogicalStatus.ABSENT],
      ]),
      generateEventWithAttendance([
        ["1", AttendanceLogicalStatus.ABSENT],
        ["2", AttendanceLogicalStatus.PRESENT],
      ]),
      generateEventWithAttendance([
        ["1", AttendanceLogicalStatus.PRESENT],
        ["2", AttendanceLogicalStatus.IGNORE],
      ]),
    ]);

    const StatusLate: AttendanceStatusType = defaultAttendanceStatusTypes.find(
      (t) => t.id === "LATE",
    );
    record.events[0].getAttendance("1").status = StatusLate;
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
    const attendance = ActivityAttendance.create(new Date(), [
      generateEventWithAttendance([
        ["1", AttendanceLogicalStatus.PRESENT],
        ["2", AttendanceLogicalStatus.IGNORE],
      ]),
      generateEventWithAttendance([
        ["1", AttendanceLogicalStatus.PRESENT],
        ["2", AttendanceLogicalStatus.PRESENT],
      ]),
    ]);

    // adding participants without attendance to one event
    attendance.events[1].children.push("3");
    attendance.events[1].children.push("4");

    expect(attendance.countEventsWithUnknownStatus()).toBe(1); // one unique event with undefined attendances
    expect(attendance.countEventsWithUnknownStatus("2")).toBe(0);
    expect(attendance.countEventsWithUnknownStatus("3")).toBe(1);
  });
});
