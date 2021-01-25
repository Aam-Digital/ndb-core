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
import { AttendanceLogicalStatus } from "./attendance-status";

describe("ActivityAttendance", () => {
  let testInstance: ActivityAttendance;

  beforeEach(() => {
    testInstance = ActivityAttendance.create(new Date(), [
      generateEventWithAttendance({
        "1": AttendanceLogicalStatus.PRESENT,
        "2": AttendanceLogicalStatus.PRESENT,
        "3": AttendanceLogicalStatus.ABSENT,
      }),
      generateEventWithAttendance({
        "1": AttendanceLogicalStatus.PRESENT,
        "2": AttendanceLogicalStatus.ABSENT,
      }),
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
      generateEventWithAttendance({
        "1": AttendanceLogicalStatus.PRESENT,
        "2": AttendanceLogicalStatus.ABSENT,
      }),
      generateEventWithAttendance({
        "1": AttendanceLogicalStatus.ABSENT,
        "2": AttendanceLogicalStatus.PRESENT,
      }),
      generateEventWithAttendance({
        "1": AttendanceLogicalStatus.PRESENT,
        "2": AttendanceLogicalStatus.PRESENT,
      }),
    ]);
    expect(everyoneInOneEventAbsent.countEventsAbsentAverage()).toBe(1);

    const allAbsent = ActivityAttendance.create(new Date(), [
      generateEventWithAttendance({
        "1": AttendanceLogicalStatus.ABSENT,
        "2": AttendanceLogicalStatus.ABSENT,
        "3": AttendanceLogicalStatus.ABSENT,
      }),
      generateEventWithAttendance({
        "1": AttendanceLogicalStatus.ABSENT,
        "2": AttendanceLogicalStatus.ABSENT,
      }),
    ]);
    expect(allAbsent.countEventsAbsentAverage()).toBe(2);
  });

  // TODO: what should be the excepted averaged result here?
  xit("calculates average present", () => {
    const presentAct = ActivityAttendance.create(new Date(), [
      generateEventWithAttendance({
        "1": AttendanceLogicalStatus.PRESENT,
        "2": AttendanceLogicalStatus.PRESENT,
      }),
      generateEventWithAttendance({
        "1": AttendanceLogicalStatus.PRESENT,
        "2": AttendanceLogicalStatus.PRESENT,
      }),
      generateEventWithAttendance({
        "1": AttendanceLogicalStatus.PRESENT,
      }),
    ]);
    expect(presentAct.countEventsPresentAverage()).toBe(2.5);

    const allAbsent = ActivityAttendance.create(new Date(), [
      generateEventWithAttendance({
        "1": AttendanceLogicalStatus.ABSENT,
        "2": AttendanceLogicalStatus.ABSENT,
        "3": AttendanceLogicalStatus.ABSENT,
      }),
      generateEventWithAttendance({
        "1": AttendanceLogicalStatus.ABSENT,
        "2": AttendanceLogicalStatus.ABSENT,
      }),
    ]);
    expect(allAbsent.countEventsPresentAverage()).toBe(0);
  });
});
