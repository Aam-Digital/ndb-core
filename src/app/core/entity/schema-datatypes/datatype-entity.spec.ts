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

describe("Schema data type: entity", () => {
  class TestEntity extends Entity {
    @DatabaseField({ dataType: "entity", additional: "User" })
    relatedUser: string;
  }

  let entitySchemaService: EntitySchemaService;

  beforeEach(waitForAsync(() => {
    entitySchemaService = new EntitySchemaService();
  }));

  it("keeps ids unchanged to store in db", () => {
    const entity = new TestEntity();
    entity.relatedUser = "1";

    const rawData = entitySchemaService.transformEntityToDatabaseFormat(entity);
    expect(rawData.relatedUser).toEqual("1");
  });

  it("keeps ids unchanged when loading from db", () => {
    const data = {
      relatedUser: "1",
    };
    const loadedEntity = new TestEntity();
    entitySchemaService.loadDataIntoEntity(loadedEntity, data);

    expect(loadedEntity.relatedUser).toEqual("1");
  });
});
