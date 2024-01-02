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
import { EntitySchemaService } from "../schema/entity-schema.service";
import { DatabaseField } from "../database-field.decorator";
import { DatabaseEntity } from "../database-entity.decorator";
import { fakeAsync, TestBed, waitForAsync } from "@angular/core/testing";
import { MockedTestingModule } from "../../../utils/mocked-testing.module";

describe("Entity", () => {
  let entitySchemaService: EntitySchemaService;

  testEntitySubclass("Entity", Entity, { _id: "someId", _rev: "some_rev" });

  beforeEach(() => {
    // TestBed.configureTestingModule done in testEntitySubclass() already
    entitySchemaService = TestBed.inject(EntitySchemaService);
  });

  it("rawData() returns only data matching the schema", function () {
    @DatabaseEntity("TestWithIgnoredFieldEntity")
    class TestEntity extends Entity {
      @DatabaseField() text: string = "text";
      @DatabaseField() defaultText: string = "default";
      otherText: string = "other Text";
    }

    const id = "test1";
    const entity = new TestEntity(id);

    const data = entitySchemaService.transformEntityToDatabaseFormat(entity);

    expect(data._id).toBe("TestWithIgnoredFieldEntity:" + id);
    expect(data.text).toBe("text");
    expect(data.defaultText).toBe("default");
    expect(data.otherText).toBeUndefined();
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

  it("should use entity type as default label if none is explicitly configured", () => {
    @DatabaseEntity("TestEntityForLabel")
    class TestEntity extends Entity {}

    expect(TestEntity.label).toBe("TestEntityForLabel");
    expect(TestEntity.labelPlural).toBe("TestEntityForLabel");
  });

  it("should return the route based on entity type name", () => {
    @DatabaseEntity("TestEntityForRoute")
    class TestEntity extends Entity {}

    expect(TestEntity.route).toBe("/testentityforroute");

    TestEntity.route = "/custom-route";
    expect(TestEntity.route).toBe("/custom-route");
  });

  it("should determine isActive based on active or inactive property", () => {
    const testEntity1 = new Entity();
    expect(testEntity1.isActive).withContext("default value").toBeTrue();

    testEntity1["active"] = false;
    expect(testEntity1.isActive).withContext("setting 'active'").toBeFalse();

    const testEntity2 = new Entity();
    testEntity2["inactive"] = true;
    expect(testEntity2.isActive).withContext("setting 'inactive'").toBeFalse();

    const testEntity3 = new Entity();
    testEntity3.isActive = false;
    expect(testEntity3.isActive).withContext("setting 'isActive'").toBeFalse();
  });

  it("should be 'isNew' if newly created before save", () => {
    const entity = new Entity();
    expect(entity.isNew).toBeTrue();

    entity._rev = "123";
    expect(entity.isNew).toBeFalse();
  });

  it("should convert toString using toStringAttributes config or special [anonymized] label", () => {
    @DatabaseEntity("TestEntityForToString")
    class TestEntity extends Entity {
      static toStringAttributes = ["firstname", "lastname"];
      static label = "TestEntity";
      firstname = "John";
      lastname = "Doe";
    }

    const testEntity = new TestEntity();

    expect(testEntity.toString()).toBe("John Doe");

    const anonymizedEntity = new TestEntity();
    anonymizedEntity.firstname = undefined;
    delete anonymizedEntity.lastname;
    anonymizedEntity.anonymized = true;

    expect(anonymizedEntity.toString()).toBe("[anonymized TestEntity]");
  });
});

/**
 *
 * @param entityType
 * @param entityClass
 * @param expectedDatabaseFormat
 * @param skipTestbedConfiguration do not run TestBed.configureTestingModule because it has been run in the parent test file already
 */
export function testEntitySubclass(
  entityType: string,
  entityClass: EntityConstructor,
  expectedDatabaseFormat: any,
  skipTestbedConfiguration = false,
) {
  let schemaService: EntitySchemaService;
  beforeEach(waitForAsync(() => {
    if (!skipTestbedConfiguration) {
      TestBed.configureTestingModule({
        imports: [MockedTestingModule.withState()],
      });
    }
    schemaService = TestBed.inject(EntitySchemaService);
  }));

  it("should be a valid entity subclass", () => {
    const id = "test1";
    const entity = new entityClass(id);

    // correct ID
    expect(entity.getId(true)).toEqual(`${entityType}:${id}`);
    expect(Entity.extractEntityIdFromId(entity.getId(true))).toBe(id);

    // correct Type
    expect(entity).toBeInstanceOf(entityClass);
    expect(entity).toBeInstanceOf(Entity);
    expect(entity).toHaveType(entityType);
    // @ts-ignore
    expect(Entity.extractTypeFromId(entity._id)).toBe(entityType);
  });

  it("should only load and store properties defined in the schema", fakeAsync(() => {
    const entity = new entityClass();

    schemaService.loadDataIntoEntity(
      entity,
      JSON.parse(JSON.stringify(expectedDatabaseFormat)),
    );
    const rawData = schemaService.transformEntityToDatabaseFormat(entity);
    expect(rawData).toEqual(expectedDatabaseFormat);
  }));
}
