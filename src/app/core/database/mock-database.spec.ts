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

describe("MockDatabase tests", () => {
  let database: MockDatabase;

  beforeEach(() => {
    database = new MockDatabase();
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
});
