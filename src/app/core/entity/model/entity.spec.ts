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

import { Entity, EntityConstructor } from "./entity";
import { waitForAsync } from "@angular/core/testing";
import { EntitySchemaService } from "../schema/entity-schema.service";
import { DatabaseField } from "../database-field.decorator";
import { ConfigurableEnumDatatype } from "../../configurable-enum/configurable-enum-datatype/configurable-enum-datatype";
import { ConfigService } from "../../config/config.service";
import { LoggingService } from "../../logging/logging.service";

describe("Entity", () => {
  let entitySchemaService: EntitySchemaService;

  beforeEach(
    waitForAsync(() => {
      entitySchemaService = new EntitySchemaService();
    })
  );

  testEntitySubclass("Entity", Entity, { _id: "someId", _rev: "some_rev" });

  it("rawData() returns only data matching the schema", function () {
    class TestEntity extends Entity {
      @DatabaseField() text: string = "text";
      @DatabaseField() defaultText: string = "default";
      otherText: string = "other Text";
    }
    const id = "test1";
    const entity = new TestEntity(id);

    const data = entitySchemaService.transformEntityToDatabaseFormat(entity);

    expect(data.text).toBe("text");
    expect(data.defaultText).toBe("default");
    expect(data.otherText).toBeUndefined();
  });

  it("rawData() includes searchIndices containing name parts", function () {
    const id = "test1";
    const entity = new Entity(id);
    entity["name"] = "John Doe";

    const data = entitySchemaService.transformEntityToDatabaseFormat(entity);

    expect(data.searchIndices).toBeDefined();
    expect(data.searchIndices).toContain("John");
    expect(data.searchIndices).toContain("Doe");
  });

  it("can perform a shallow copy of itself", () => {
    const id = "t1";
    const entity: Entity = new Entity(id);
    entity["value"] = 1;
    const otherEntity = entity.copy();
    expect(otherEntity).toEqual(entity);
  });

  it("preserves it's type when copying", () => {
    class TestEntity extends Entity {
      value: number;
      constructor(id: string, value: number) {
        super(id);
        this.value = value;
      }
    }

    const entity: TestEntity = new TestEntity("t1", 2);
    const otherEntity = entity.copy();
    expect(otherEntity).not.toBe(entity);
    expect(otherEntity).toEqual(entity);
    expect(otherEntity).toBeInstanceOf(TestEntity);
  });
});

export function testEntitySubclass(
  entityType: string,
  entityClass: EntityConstructor,
  expectedDatabaseFormat: any
) {
  it("should be a valid entity subclass", () => {
    const id = "test1";
    const entity = new entityClass(id);

    // correct ID
    expect(entity).toHaveId(id);
    expect(Entity.extractEntityIdFromId(entity._id)).toBe(id);

    // correct Type
    expect(entity).toBeInstanceOf(entityClass);
    expect(entity).toBeInstanceOf(Entity);
    expect(entity).toHaveType(entityType);
    expect(Entity.extractTypeFromId(entity._id)).toBe(entityType);
  });

  it("should only load and store properties defined in the schema", () => {
    const schemaService = new EntitySchemaService();
    const configService = new ConfigService(new LoggingService());
    configService.loadConfig({ load: () => Promise.reject() } as any);
    schemaService.registerSchemaDatatype(
      new ConfigurableEnumDatatype(configService)
    );
    const entity = new entityClass();

    schemaService.loadDataIntoEntity(
      entity,
      JSON.parse(JSON.stringify(expectedDatabaseFormat))
    );
    const rawData = schemaService.transformEntityToDatabaseFormat(entity);
    if (rawData.searchIndices.length === 0) {
      delete rawData.searchIndices;
    }
    expect(rawData).toEqual(expectedDatabaseFormat);
  });
}
