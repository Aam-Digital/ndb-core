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
import { testEntitySubclass } from "../../entity/model/entity.spec";
import { TimePeriod } from "./time-period";

describe("TimePeriod Entity", () => {
  testEntitySubclass("TimePeriod", TimePeriod, {
    _id: "TimePeriod:some-id",

    start: "2019-01-01",
    end: "2019-12-31",
  });

  it("should mark relations without end date as active", () => {
    const relation = new TimePeriod();
    relation.start = new Date();
    expect(relation.isActive).toBeTrue();
  });

  it("should mark relation starting in the future as inactive", () => {
    const relation = new TimePeriod();
    relation.start = moment().add(1, "day").toDate();
    expect(relation.isActive).toBeFalse();
  });

  it("should mark relation with end date in the past as inactive", () => {
    const relation = new TimePeriod();
    relation.start = moment().subtract(1, "week").toDate();
    relation.end = moment().subtract(1, "day").toDate();
    expect(relation.isActive).toBeFalse();
  });

  it("should mark relation with end date in the future as active", () => {
    const relation = new TimePeriod();
    relation.start = moment().subtract(1, "week").toDate();
    relation.end = moment().add(1, "day").toDate();
    expect(relation.isActive).toBeTrue();
  });

  it("should mark relation with end date being today as active", () => {
    const relation = new TimePeriod();
    relation.start = moment().subtract(1, "week").toDate();
    relation.end = new Date();
    expect(relation.isActive).toBeTrue();
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
