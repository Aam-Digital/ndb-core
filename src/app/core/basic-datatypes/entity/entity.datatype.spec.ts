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
import { Child } from "../../../child-dev-project/children/model/child";
import { ChildSchoolRelation } from "../../../child-dev-project/children/model/childSchoolRelation";
import { EntityRemoveService } from "../../entity/entity-remove.service";

describe("Schema data type: entity", () => {
  testDatatype(new EntityDatatype(null, null), "1", "1", "User");

  it("should map to the referenced entity", async () => {
    const c1 = Child.create("first");
    const c2 = new Child();
    c2.projectNumber = "123";
    const entityMapper = mockEntityMapper([c1, c2]);
    const dataType = new EntityDatatype(entityMapper, null);
    const schema = ChildSchoolRelation.schema.get("childId");

    await expectAsync(
      dataType.importMapFunction("first", schema, "name"),
    ).toBeResolvedTo(c1.getId());
    await expectAsync(
      dataType.importMapFunction("123", schema, "projectNumber"),
    ).toBeResolvedTo(c2.getId());
    await expectAsync(
      dataType.importMapFunction("345", schema, "projectNumber"),
    ).toBeResolvedTo(undefined);
  });

  it("should anonymize entity recursively", async () => {
    const referencedEntity = new Child("ref-1");
    referencedEntity.name = "test";

    const entityMapper = mockEntityMapper([referencedEntity]);
    spyOn(entityMapper, "save");
    const mockRemoveService: jasmine.SpyObj<EntityRemoveService> =
      jasmine.createSpyObj("EntityRemoveService", ["anonymize"]);
    const dataType = new EntityDatatype(entityMapper, mockRemoveService);

    const testValue = referencedEntity.getId();
    const testSchemaField = { additional: "Child", dataType: "entity" };

    const anonymizedValue = await dataType.anonymize(
      testValue,
      testSchemaField,
      null,
    );

    expect(anonymizedValue).toEqual(testValue);
    expect(mockRemoveService.anonymize).toHaveBeenCalledWith(referencedEntity);
  });
});
