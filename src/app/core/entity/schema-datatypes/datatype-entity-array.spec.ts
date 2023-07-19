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
import { DatabaseField } from "../database-field.decorator";
import { EntitySchemaService } from "../schema/entity-schema.service";
import { waitForAsync } from "@angular/core/testing";

describe("Schema data type: entity-array", () => {
  class TestEntity extends Entity {
    @DatabaseField({ dataType: "entity-array", additional: "User" })
    relatedUsers: string[] = [];

    @DatabaseField({
      dataType: "entity-array",
      additional: ["User", "Child", "School"],
    })
    relatedEntities: string[] = [];
  }

  let entitySchemaService: EntitySchemaService;

  beforeEach(waitForAsync(() => {
    entitySchemaService = new EntitySchemaService();
  }));

  it("keeps ids unchanged to store in db", () => {
    const entity = new TestEntity();
    entity.relatedUsers = ["1", "User:5"];

    const rawData = entitySchemaService.transformEntityToDatabaseFormat(entity);
    expect(rawData.relatedUsers).toEqual(["1", "User:5"]);
  });

  it("keeps ids unchanged when loading from db", () => {
    const data = {
      relatedEntities: ["User:1", "Child:1"],
    };
    const loadedEntity = new TestEntity();
    entitySchemaService.loadDataIntoEntity(loadedEntity, data);

    expect(loadedEntity.relatedEntities).toEqual(["User:1", "Child:1"]);
  });

  xit("adds prefix to ids when a definite entity type is given in schema", () => {
    // TODO discuss whether we want to switch to prefixed ids always (also see #1526)
    const data = {
      relatedUsers: ["User:1", "2"],
    };
    const loadedEntity = new TestEntity();
    entitySchemaService.loadDataIntoEntity(loadedEntity, data);

    expect(loadedEntity.relatedUsers).toEqual(["User:1", "User:2"]);
  });
});
