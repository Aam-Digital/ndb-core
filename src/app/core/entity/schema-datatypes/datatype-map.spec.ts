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

import { Entity } from "../model/entity";
import { waitForAsync } from "@angular/core/testing";
import { DatabaseField } from "../database-field.decorator";
import { EntitySchemaService } from "../schema/entity-schema.service";

describe("Schema data type: map", () => {
  class TestEntity extends Entity {
    @DatabaseField({ innerDataType: "month" }) dateMap: Map<string, Date> =
      new Map();
  }

  let entitySchemaService: EntitySchemaService;

  beforeEach(
    waitForAsync(() => {
      entitySchemaService = new EntitySchemaService();
    })
  );

  it("converts contained dates to month for saving", () => {
    const id = "test1";
    const entity = new TestEntity(id);
    entity.dateMap.set("a", new Date("2020-01-01"));
    entity.dateMap.set("b", new Date("1999-01-25"));

    const rawData = entitySchemaService.transformEntityToDatabaseFormat(entity);

    expect(rawData.dateMap).toEqual([
      ["a", "2020-01"],
      ["b", "1999-01"],
    ]);
  });

  it("converts contained month strings to dates when loading", () => {
    const id = "test1";
    const entity = new TestEntity(id);

    const data = {
      _id: "test2",
      dateMap: [
        ["a", "2020-01"],
        ["b", "1999-01"],
      ],
    };
    entitySchemaService.loadDataIntoEntity(entity, data);

    expect(entity.dateMap.get("a")).toEqual(new Date("2020-01-01"));
    expect(entity.dateMap.get("b")).toEqual(new Date("1999-01-01"));
  });

  it("reproduces exact same values after save and load", () => {
    const id = "test1";
    const originalEntity = new TestEntity(id);
    originalEntity.dateMap.set("a", new Date("2020-01-01"));
    originalEntity.dateMap.set("b", new Date("2019-02-01"));

    const rawData =
      entitySchemaService.transformEntityToDatabaseFormat(originalEntity);

    const loadedEntity = new TestEntity("");
    entitySchemaService.loadDataIntoEntity(loadedEntity, rawData);

    expect(loadedEntity.dateMap).toEqual(originalEntity.dateMap);
  });

  it("keeps value unchanged if it is not a map", () => {
    const id = "test1";
    const entity = new TestEntity(id);
    // @ts-ignore
    entity.dateMap = "not a map";

    const rawData = entitySchemaService.transformEntityToDatabaseFormat(entity);

    expect(rawData.dateMap).toEqual("not a map");
  });

  it("reproduces the entries after multiple loads", () => {
    const id = "test1";
    const originalEntity = new TestEntity(id);
    originalEntity.dateMap.set("a", new Date("2020-01-01"));
    originalEntity.dateMap.set("b", new Date("2020-02-02"));

    const rawData =
      entitySchemaService.transformEntityToDatabaseFormat(originalEntity);

    const loadedEntity = new TestEntity();
    entitySchemaService.loadDataIntoEntity(loadedEntity, rawData);

    expect(loadedEntity.dateMap.size).toEqual(originalEntity.dateMap.size);

    const loadedEntity2 = new TestEntity();
    entitySchemaService.loadDataIntoEntity(loadedEntity2, rawData);

    expect(loadedEntity2.dateMap.size).toEqual(originalEntity.dateMap.size);
  });
});
