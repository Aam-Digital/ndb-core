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

import { testDatatype } from "../schema/entity-schema.service.spec";
import { EntityArrayDatatype } from "./entity-array.datatype";
import { EntitySchemaService } from "../schema/entity-schema.service";
import { EntityDatatype } from "./entity.datatype";

//TODO
describe("Schema data type: entity-array", () => {
  const mockEntitySchemaService: EntitySchemaService = {
    getDatatypeOrDefault: () => new EntityDatatype(),
  } as any;
  testDatatype(
    new EntityArrayDatatype(mockEntitySchemaService),
    ["1", "User:5"],
    ["1", "User:5"],
    "User",
  );

  testDatatype(
    new EntityArrayDatatype(mockEntitySchemaService),
    ["User:1", "Child:1"],
    ["User:1", "Child:1"],
    ["User", "Child", "School"],
  );

  xit("adds prefix to ids when a definite entity type is given in schema", () => {
    // TODO discuss whether we want to switch to prefixed ids always (also see #1526)
    const data = {
      relatedUsers: ["User:1", "2"],
    };
    //const loadedEntity = new TestEntity();
    //entitySchemaService.loadDataIntoEntity(loadedEntity, data);

    //expect(loadedEntity.relatedUsers).toEqual(["User:1", "User:2"]);
  });
});
