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
import { Entity } from "../../../../core/entity/model/entity";
import { EntitySchemaService } from "../../../../core/entity/schema/entity-schema.service";
import { mathLevels } from "./mathLevels";
import { readingLevels } from "./readingLevels";
import { WarningLevel } from "../../../../core/entity/model/warning-level";

describe("Aser", () => {
  const ENTITY_TYPE = "Aser";
  const entitySchemaService = new EntitySchemaService();

  it("has correct _id and entityId and type", function () {
    const id = "test1";
    const entity = new Aser(id);

    expect(entity.getId()).toBe(id);
    expect(Entity.extractEntityIdFromId(entity._id)).toBe(id);
  });

  it("has correct type/prefix", function () {
    const id = "test1";
    const entity = new Aser(id);

    expect(entity.getType()).toBe(ENTITY_TYPE);
    expect(Entity.extractTypeFromId(entity._id)).toBe(ENTITY_TYPE);
  });

  it("has all and only defined schema fields in rawData", function () {
    const id = "test1";
    const expectedData = {
      _id: ENTITY_TYPE + ":" + id,

      child: "1",
      date: new Date(),
      hindi: readingLevels[2],
      bengali: readingLevels[1],
      english: readingLevels[2],
      math: mathLevels[4],
      remarks: "nothing to remark",

      searchIndices: [],
    };

    const entity = new Aser(id);
    entity.child = expectedData.child;
    entity.date = expectedData.date;
    entity.hindi = expectedData.hindi;
    entity.bengali = expectedData.bengali;
    entity.english = expectedData.english;
    entity.math = expectedData.math;
    entity.remarks = expectedData.remarks;

    const rawData = entitySchemaService.transformEntityToDatabaseFormat(entity);

    expect(rawData).toEqual(expectedData);
  });

  it("warning level OK if no results", function () {
    const id = "test1";
    const entity = new Aser(id);

    expect(entity.getWarningLevel()).toBe(WarningLevel.OK);
  });

  it("warning level WARNING if some bad results", function () {
    const id = "test1";
    const entity = new Aser(id);
    entity.english = readingLevels[1];
    entity.math = readingLevels[2];

    expect(entity.getWarningLevel()).toBe(WarningLevel.WARNING);
  });

  it("has a warning level of OK if english is at it's highest level", () => {
    const entity = new Aser();
    entity.english = readingLevels[readingLevels.length - 1];

    expect(entity.getWarningLevel()).toBe(WarningLevel.OK);
  });

  it("has a warning level of OK if all values are at it's highest level", () => {
    const entity = new Aser();
    entity.math = mathLevels[mathLevels.length - 1];
    entity.english = readingLevels[readingLevels.length - 1];
    entity.hindi = readingLevels[readingLevels.length - 1];
    entity.bengali = readingLevels[readingLevels.length - 1];

    expect(entity.getWarningLevel()).toBe(WarningLevel.OK);
  });
});
