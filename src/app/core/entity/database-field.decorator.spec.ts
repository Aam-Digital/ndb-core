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

import { Entity } from "./model/entity";
import { DatabaseField } from "./database-field.decorator";

class TestClass extends Entity {
  @DatabaseField()
  fieldUndefined: string;

  @DatabaseField()
  fieldWithDefault: string = "default";

  @DatabaseField({ generateIndex: true })
  fieldDate: Date;
}

describe("@DatabaseField Decorator", () => {
  it("keeps correct default values", async () => {
    const testClass = new TestClass("1");

    expect(testClass.fieldUndefined).toBeUndefined();
    expect(testClass.fieldWithDefault).toBe("default");
  });

  it("results in full schema", async () => {
    expect(TestClass.schema).toEqual(
      new Map([
        ["fieldUndefined", { id: "fieldUndefined", dataType: "string" }],
        ["fieldWithDefault", { id: "fieldWithDefault", dataType: "string" }],
        [
          "fieldDate",
          { id: "fieldDate", dataType: "date", generateIndex: true },
        ],
      ]),
    );
  });
});
