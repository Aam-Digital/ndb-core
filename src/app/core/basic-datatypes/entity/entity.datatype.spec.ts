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
  testDatatype(new EntityDatatype(null, null), "1", "1", "User");

  it("should map to the referenced entity", async () => {
    const c1 = TestEntity.create("first");
    const c2 = new TestEntity();
    c2.other = "123";
    const entityMapper = mockEntityMapper([c1, c2]);
    const dataType = new EntityDatatype(entityMapper, null);
    const schema = TestEntity.schema.get("ref");

    await expectAsync(
      dataType.importMapFunction("first", schema, "name"),
    ).toBeResolvedTo(c1.getId());
    await expectAsync(
      dataType.importMapFunction("123", schema, "other"),
    ).toBeResolvedTo(c2.getId());
    await expectAsync(
      dataType.importMapFunction("345", schema, "other"),
    ).toBeResolvedTo(undefined);
  });

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
