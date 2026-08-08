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

import moment from "moment";
import { testEntitySubclass } from "../../entity/model/entity.test-utils";
import { TimePeriod } from "./time-period";
import { DefaultDatatype } from "../../entity/default-datatype/default.datatype";
import { DateOnlyDatatype } from "../../basic-datatypes/date-only/date-only.datatype";

describe("TimePeriod Entity", () => {
  testEntitySubclass(
    "TimePeriod",
    TimePeriod,
    {
      _id: "TimePeriod:some-id",

      start: "2019-01-01",
      end: "2019-12-31",
    },
    false,
    [{ provide: DefaultDatatype, useClass: DateOnlyDatatype, multi: true }],
  );

  it("should determine the active status from the covered time period", () => {
    const withoutEnd = new TimePeriod();
    withoutEnd.start = new Date();
    expect(withoutEnd.isActiveAt(new Date()), "without end date").toBe(true);

    const startingTomorrow = new TimePeriod();
    startingTomorrow.start = moment().add(1, "day").toDate();
    expect(
      startingTomorrow.isActiveAt(new Date()),
      "starting in the future",
    ).toBe(false);

    const endedYesterday = new TimePeriod();
    endedYesterday.start = moment().subtract(1, "week").toDate();
    endedYesterday.end = moment().subtract(1, "day").toDate();
    expect(endedYesterday.isActiveAt(new Date()), "ended in the past").toBe(
      false,
    );

    const endingToday = new TimePeriod();
    endingToday.start = moment().subtract(1, "week").toDate();
    endingToday.end = new Date();
    expect(endingToday.isActiveAt(new Date()), "ending today").toBe(true);
  });

  it("should keep the calculated status independent of manual archiving", () => {
    const relation = new TimePeriod();
    relation.start = moment().subtract(1, "week").toDate();
    relation.inactive = true;

    expect(relation.isActiveAt(new Date())).toBe(true);
  });

  it("should fail validation when end date but no start date is defined", () => {
    const relation = new TimePeriod();
    relation.end = new Date();
    expect(() => relation.assertValid()).toThrowError();
  });

  it("should fail validation when start date is after end date", () => {
    const relation = new TimePeriod();
    relation.start = moment().add(1, "day").toDate();
    relation.end = new Date();
    expect(() => relation.assertValid()).toThrowError();
  });

  it("should pass validation when the start date is before the end date", () => {
    const relation = new TimePeriod();
    relation.start = moment().subtract(1, "day").toDate();
    relation.end = new Date();
    expect(() => relation.assertValid()).not.toThrowError();
  });

  it("should pass validation when the start date is in future and no end date is defined", () => {
    const relation = new TimePeriod();
    relation.start = moment().add(1, "day").toDate();
    relation.end = undefined;
    expect(() => relation.assertValid()).not.toThrowError();
  });
});
