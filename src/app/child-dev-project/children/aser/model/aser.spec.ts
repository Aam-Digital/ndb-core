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

import { Aser } from "./aser";
import { mathLevels, readingLevels } from "./skill-levels";
import { WarningLevel } from "../../../warning-level";
import { testEntitySubclass } from "../../../../core/entity/model/entity.spec";

describe("Aser", () => {
  testEntitySubclass("Aser", Aser, {
    _id: "Aser:some-id",

    child: "1",
    date: new Date(),
    hindi: readingLevels[2].id,
    bengali: readingLevels[1].id,
    english: readingLevels[2].id,
    math: mathLevels[4].id,
    remarks: "nothing to remark",
  });

  it("warning level OK if no results", function () {
    const id = "test1";
    const entity = new Aser(id);

    expect(entity.getWarningLevel()).toBe(WarningLevel.OK);
  });

  it("warning level WARNING if some results are not passed", function () {
    const id = "test1";
    const entity = new Aser(id);
    entity.english = readingLevels[1];
    entity.math = readingLevels[2];

    expect(entity.getWarningLevel()).toBe(WarningLevel.WARNING);
  });

  it("has a warning level of OK if english is passed", () => {
    const entity = new Aser();
    entity.english = readingLevels.find((l) => l.passed);

    expect(entity.getWarningLevel()).toBe(WarningLevel.OK);
  });

  it("has a warning level of OK if all skills are passed", () => {
    const entity = new Aser();
    entity.math = mathLevels.find((l) => l.passed);
    entity.english = readingLevels.find((l) => l.passed);
    entity.hindi = readingLevels.find((l) => l.passed);
    entity.bengali = readingLevels.find((l) => l.passed);

    expect(entity.getWarningLevel()).toBe(WarningLevel.OK);
  });

  it("has warning level OK if some subjects are passed and others are empty", () => {
    const entity = new Aser();
    entity.math = mathLevels.find((l) => l.passed);
    entity.english = readingLevels.find((l) => l.passed);
    entity.hindi = readingLevels.find((l) => l.id === "");
    entity.bengali = undefined;

    expect(entity.getWarningLevel()).toBe(WarningLevel.OK);
  });
});
