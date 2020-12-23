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
import { AttendanceStatus } from "./attendance-status";

describe("ActivityAttendance", () => {
  let testInstance: ActivityAttendance;

  beforeEach(() => {
    testInstance = ActivityAttendance.create(new Date(), [
      generateEventWithAttendance({
        "1": AttendanceStatus.PRESENT,
        "2": AttendanceStatus.PRESENT,
        "3": AttendanceStatus.ABSENT,
      }),
      generateEventWithAttendance({
        "1": AttendanceStatus.PRESENT,
        "2": AttendanceStatus.ABSENT,
      }),
    ]);
  });

  it("calculates individual's absent events", () => {
    expect(testInstance.getEventsAbsent("1")).toBe(0);
    expect(testInstance.getEventsAbsent("2")).toBe(1);
    expect(testInstance.getEventsAbsent("3")).toBe(1);
  });

  it("calculates individual's present events", () => {
    expect(testInstance.getEventsPresent("1")).toBe(2);
    expect(testInstance.getEventsPresent("2")).toBe(1);
    expect(testInstance.getEventsPresent("3")).toBe(0);
  });

  it("calculates average absent", () => {
    const everyoneInOneEventAbsent = ActivityAttendance.create(new Date(), [
      generateEventWithAttendance({
        "1": AttendanceStatus.PRESENT,
        "2": AttendanceStatus.ABSENT,
      }),
      generateEventWithAttendance({
        "1": AttendanceStatus.ABSENT,
        "2": AttendanceStatus.PRESENT,
      }),
      generateEventWithAttendance({
        "1": AttendanceStatus.PRESENT,
        "2": AttendanceStatus.PRESENT,
      }),
    ]);
    expect(everyoneInOneEventAbsent.getEventsAbsentAverage()).toBe(1);

    const allAbsent = ActivityAttendance.create(new Date(), [
      generateEventWithAttendance({
        "1": AttendanceStatus.ABSENT,
        "2": AttendanceStatus.ABSENT,
        "3": AttendanceStatus.ABSENT,
      }),
      generateEventWithAttendance({
        "1": AttendanceStatus.ABSENT,
        "2": AttendanceStatus.ABSENT,
      }),
    ]);
    expect(allAbsent.getEventsAbsentAverage()).toBe(2);
  });

  // TODO: what should be the excepted averaged result here?
  xit("calculates average present", () => {
    const presentAct = ActivityAttendance.create(new Date(), [
      generateEventWithAttendance({
        "1": AttendanceStatus.PRESENT,
        "2": AttendanceStatus.PRESENT,
      }),
      generateEventWithAttendance({
        "1": AttendanceStatus.PRESENT,
        "2": AttendanceStatus.PRESENT,
      }),
      generateEventWithAttendance({
        "1": AttendanceStatus.PRESENT,
      }),
    ]);
    expect(presentAct.getEventsPresentAverage()).toBe(2.5);

    const allAbsent = ActivityAttendance.create(new Date(), [
      generateEventWithAttendance({
        "1": AttendanceStatus.ABSENT,
        "2": AttendanceStatus.ABSENT,
        "3": AttendanceStatus.ABSENT,
      }),
      generateEventWithAttendance({
        "1": AttendanceStatus.ABSENT,
        "2": AttendanceStatus.ABSENT,
      }),
    ]);
    expect(allAbsent.getEventsPresentAverage()).toBe(0);
  });

  it("returns average if not childId is given", () => {
    expect(testInstance.getEventsAbsent()).toBe(
      testInstance.getEventsAbsentAverage()
    );
    expect(testInstance.getEventsAbsent(undefined)).toBe(
      testInstance.getEventsAbsentAverage()
    );

    expect(testInstance.getEventsPresent()).toBe(
      testInstance.getEventsPresentAverage()
    );
    expect(testInstance.getEventsPresent(undefined)).toBe(
      testInstance.getEventsPresentAverage()
    );
  });
});
