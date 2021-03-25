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

import { MockDatabase } from "./mock-database";
import { Child } from "../../child-dev-project/children/model/child";
import { EntityMapperService } from "../entity/entity-mapper.service";
import { EntitySchemaService } from "../entity/schema/entity-schema.service";
import { Gender } from "../../child-dev-project/children/model/Gender";
import {
  DatabaseIndexingService,
  DesignDoc,
} from "../entity/database-indexing/database-indexing.service";
import { fakeAsync, tick } from "@angular/core/testing";

describe("MockDatabase tests", () => {
  let database: MockDatabase;
  let entityMapper: EntityMapperService;
  let dbIndexing: DatabaseIndexingService;

  beforeEach(() => {
    database = new MockDatabase();
    const schemaService = new EntitySchemaService();
    entityMapper = new EntityMapperService(database, schemaService);
    dbIndexing = new DatabaseIndexingService(database, schemaService);
  });

  it("get object by _id after put into database", async () => {
    const id = "test_id";
    const name = "test";
    const count = 42;
    const testData = { _id: id, name: name, count: count };
    await database.put(testData);
    const result = await database.get(id);
    expect(result._id).toBe(id);
  });

  it("put two objects with different _id", async () => {
    const data1 = { _id: "test_id", name: "test" };
    const data2 = { _id: "other_id", name: "test2" };
    await database.put(data1);
    await database.put(data2);
    const result = await database.get(data1._id);
    expect(result._id).toBe(data1._id);
    const result2 = await database.get(data2._id);
    expect(result2._id).toBe(data2._id);
  });

  it("fails to get by not existing _id", () => {
    return expectAsync(database.get("some_id")).toBeRejected();
  });

  it("rejects putting new object with existing _id and no _rev", async () => {
    const testData = { _id: "test_id", name: "test", count: 42 };
    const duplicateData = { _id: "test_id", name: "duplicate", count: 43 };
    await database.put(testData);
    const result = await database.get(testData._id);
    expect(result._id).toBe(testData._id);
    await expectAsync(database.put(duplicateData)).toBeRejected();
    const result2 = await database.get(testData._id);
    expect(result2.name).toBe(testData.name);
  });

  it("remove object", async () => {
    const id = "test_id";
    const name = "test";
    const count = 42;
    const testData = { _id: id, name: name, count: count };
    await database.put(testData);
    await expectAsync(database.get(testData._id)).toBeResolved();
    await database.remove(testData);
    await expectAsync(database.get(testData._id)).toBeRejected();
  });

  it("getAll returns all objects", async () => {
    const testData1 = { _id: "x:test_id", name: "test", count: 42 };
    const testData2 = { _id: "y:two", name: "two" };
    await database.put(testData1);
    await database.put(testData2);
    const result = await database.getAll();
    expect(result.map((el) => el._id)).toContain(testData1._id);
    expect(result.map((el) => el._id)).toContain(testData2._id);
    expect(result.length).toBe(2);
  });

  it("getAll returns prefixed objects", async () => {
    const testData1 = { _id: "x:test_id", name: "test", count: 42 };
    const testData2 = { _id: "y:two", name: "two" };
    const prefix = "x";
    await database.put(testData1);
    await database.put(testData2);
    const result = await database.getAll(prefix);
    expect(result.map((el) => el._id)).toContain(testData1._id);
    expect(result.map((el) => el._id)).not.toContain(testData2._id);
    expect(result.length).toBe(1);
  });

  it("should allow to query elements with an index", fakeAsync(async () => {
    const designDoc: DesignDoc = {
      _id: "_design/child_index",
      views: {
        by_name: {
          map: `(doc) => { 
            if (doc._id.startsWith("${Child.ENTITY_TYPE}")) {
              emit(doc.name);            
            }
          }`,
        },
        by_gender: {
          map: `(doc) => { 
            if (doc._id.startsWith("${Child.ENTITY_TYPE}")) {
              emit([doc.gender, doc.name]);            
            }
          }`,
        },
      },
    };

    const benMale = new Child();
    benMale.name = "Ben";
    benMale.gender = Gender.MALE;
    const lauraFemale = new Child();
    lauraFemale.name = "Laura";
    lauraFemale.gender = Gender.FEMALE;
    const isaFemale = new Child();
    isaFemale.name = "Isa";
    isaFemale.gender = Gender.FEMALE;
    await entityMapper.save(isaFemale);
    await entityMapper.save(benMale);
    await entityMapper.save(lauraFemale);

    await dbIndexing.createIndex(designDoc);
    tick();

    const childrenByName = await dbIndexing.queryIndexDocs<Child>(
      Child,
      "child_index/by_name"
    );

    expect(childrenByName).toHaveSize(3);
    expect(childrenByName[0].name).toBe(benMale.name);
    expect(childrenByName[1].name).toBe(isaFemale.name);
    expect(childrenByName[2].name).toBe(lauraFemale.name);

    const childrenByGender = await dbIndexing.queryIndexDocs<Child>(
      Child,
      "child_index/by_gender"
    );

    expect(childrenByGender).toHaveSize(3);
    expect(childrenByGender[0].name).toBe(isaFemale.name);
    expect(childrenByGender[1].name).toBe(lauraFemale.name);
    expect(childrenByGender[2].name).toBe(benMale.name);
  }));
});
