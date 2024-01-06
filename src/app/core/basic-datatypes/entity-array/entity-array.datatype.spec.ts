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
import { EntityArrayDatatype } from "./entity-array.datatype";
import { EntityDatatype } from "../entity/entity.datatype";

describe("Schema data type: entity-array", () => {
  const mockEntityDatatype = new EntityDatatype(null, null);
  const mockEntitySchemaService = {
    getDatatypeOrDefault: () => mockEntityDatatype,
  } as any;
  const datatype = new EntityArrayDatatype(mockEntitySchemaService);

  testDatatype(datatype, ["1", "User:5"], ["1", "User:5"], "User");

  testDatatype(
    datatype,
    ["User:1", "Child:1"],
    ["User:1", "Child:1"],
    ["User", "Child", "School"],
  );

  it("should anonymize entities recursively", async () => {
    const testValue = ["Entity:ref-1", "Entity:ref-2"];
    spyOn(mockEntityDatatype, "anonymize").and.callFake(async (x) => x);

    const anonymizedValue = await datatype.anonymize(testValue, null, null);

    expect(anonymizedValue).toEqual(testValue);
    expect(mockEntityDatatype.anonymize).toHaveBeenCalledTimes(2);
    expect(mockEntityDatatype.anonymize).toHaveBeenCalledWith(
      "Entity:ref-1",
      jasmine.objectContaining({ dataType: "entity" }),
      null,
    );
  });
});
