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

import { testDatatype } from "../../entity/schema/entity-schema.service.spec";
import { EntityDatatype } from "./entity.datatype";
import { mockEntityMapper } from "../../entity/entity-mapper/mock-entity-mapper-service";
import { EntityActionsService } from "../../entity/entity-actions/entity-actions.service";
import { EntitySchemaField } from "../../entity/schema/entity-schema-field";
import { TestEntity } from "../../../utils/test-utils/TestEntity";

describe("Schema data type: entity", () => {
  testDatatype(new EntityDatatype(null as any, null as any), "1", "1", "User");

  describe("importMapFunction", () => {
    let entityMapper: ReturnType<typeof mockEntityMapper>;
    let dataType: EntityDatatype;
    let schema: EntitySchemaField;

    let c1: TestEntity;
    let c2: TestEntity;

    beforeEach(() => {
      c1 = TestEntity.create("first");
      c2 = new TestEntity();
      c2.other = "123"; // Ensure other is a string
      entityMapper = mockEntityMapper([c1, c2]);
      dataType = new EntityDatatype(entityMapper, null as any);
      schema = TestEntity.schema.get("ref") as EntitySchemaField;
    });

    it("should map to the referenced entity by name", async () => {
      await expectAsync(dataType.importMapFunction("first", schema, "name"))
        .toBeResolvedTo(c1.getId());
    });

    it("should map to the referenced entity by other field", async () => {
      await expectAsync(dataType.importMapFunction("123", schema, "other"))
        .toBeResolvedTo(c2.getId());
    });

    it("should return undefined when no matching entity is found", async () => {
      await expectAsync(dataType.importMapFunction("345", schema, "other"))
        .toBeResolvedTo(undefined);
    });

    it("should handle numeric-string mismatches correctly", async () => {
      const c3 = new TestEntity();
      c3.other = "456"; // Ensure it's a string
      entityMapper = mockEntityMapper([c3]);
      dataType = new EntityDatatype(entityMapper, null as any);
      
      await expectAsync(dataType.importMapFunction("456", schema, "other"))
        .toBeResolvedTo(c3.getId());
    });
  });

  describe("anonymize", () => {
    it("should anonymize entity recursively", async () => {
      const referencedEntity = new TestEntity("ref-1");
      referencedEntity.name = "test";

      const entityMapper = mockEntityMapper([referencedEntity]);
      spyOn(entityMapper, "save");
      const mockRemoveService: jasmine.SpyObj<EntityActionsService> =
        jasmine.createSpyObj("EntityRemoveService", ["anonymize"]);
      const dataType = new EntityDatatype(entityMapper, mockRemoveService);

      const testValue = referencedEntity.getId();
      const testSchemaField: EntitySchemaField = {
        additional: TestEntity.ENTITY_TYPE,
        dataType: "entity",
      };

      const anonymizedValue = await dataType.anonymize(
        testValue,
        testSchemaField,
        null,
      );

      expect(anonymizedValue).toEqual(testValue);
      expect(mockRemoveService.anonymize).toHaveBeenCalledWith(referencedEntity);
    });
  });
});
